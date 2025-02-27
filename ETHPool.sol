// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IEigenLayer {
    function unstake(address recipient, uint256 amount) external;
}

contract ETHPool {
    uint256 public constant STAKING_THRESHOLD = 32 ether;
    uint256 public constant UNSTAKE_VOTE_THRESHOLD_PERCENT = 51;

    mapping(address => uint256) public deposits;
    mapping(address => bool) public hasVotedForUnstake;
    address[] public depositors;

    uint256 public totalDeposited;
    uint256 public unstakeVotes;

    event Deposited(address indexed sender, uint256 amount);
    event ThresholdReached(uint256 totalBalance);
    event VotedForUnstake(address indexed voter);
    event Unstaked(uint256 amount, address recipient);

    IEigenLayer public eigenLayerContract;
    address public stakingRecipient;

    constructor(address _eigenLayerContract, address _stakingRecipient) {
        eigenLayerContract = IEigenLayer(_eigenLayerContract);
        stakingRecipient = _stakingRecipient;
    }

    receive() external payable {
        emit Deposited(msg.sender, msg.value);
        if (deposits[msg.sender] == 0) {
            depositors.push(msg.sender);
        }
        deposits[msg.sender] += msg.value;
        totalDeposited += msg.value;

        if (address(this).balance >= STAKING_THRESHOLD) {
            emit ThresholdReached(address(this).balance);
        }
    }

    function voteToUnstake() external {
        require(deposits[msg.sender] > 0, "Only depositors can vote.");
        require(!hasVotedForUnstake[msg.sender], "You already voted.");

        hasVotedForUnstake[msg.sender] = true;
        unstakeVotes++;

        emit VotedForUnstake(msg.sender);

        uint256 votePercentage = (unstakeVotes * 100) / depositors.length;
        if (votePercentage >= UNSTAKE_VOTE_THRESHOLD_PERCENT) {
            _unstake();
        }
    }

    function _unstake() internal {
        require(address(this).balance > 0, "No ETH to unstake.");
        require(totalDeposited > 0, "No deposits recorded.");

        uint256 amountToUnstake = address(this).balance;
        
        // Call EigenLayer unstake function
        eigenLayerContract.unstake(address(this), amountToUnstake);

        emit Unstaked(amountToUnstake, address(this));

        // Distribute the unstaked ETH to depositors proportionally
        for (uint256 i = 0; i < depositors.length; i++) {
            address depositor = depositors[i];
            uint256 depositorShare = (deposits[depositor] * amountToUnstake) / totalDeposited;

            if (depositorShare > 0) {
                (bool success, ) = payable(depositor).call{value: depositorShare}("");
                require(success, "ETH transfer failed");
            }

            // Reset deposit mapping
            deposits[depositor] = 0;
        }

        // Reset pool state
        totalDeposited = 0;
        unstakeVotes = 0;
        delete depositors;
    }
}
