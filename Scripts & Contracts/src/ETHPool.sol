// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ETHPool {
    uint256 public constant STAKING_THRESHOLD = 32 ether;
    uint256 public constant UNSTAKE_VOTE_THRESHOLD_PERCENT = 51;
    uint256 public constant MAX_DEPOSIT_PER_USER = 5 ether;
    uint256 public constant REWARD_INTERVAL = 8 days;

    mapping(address => uint256) public deposits;
    mapping(address => uint256) public rewards;
    mapping(address => bool) public hasVotedForUnstake;
    address[] public depositors;

    uint256 public totalDeposited;
    uint256 public unstakeVotes;
    uint256 public lastRewardDistribution;
    uint256 public totalRewards;

    event Deposited(address indexed sender, uint256 amount);
    event ThresholdReached(uint256 totalBalance);
    event VotedForUnstake(address indexed voter);
    event Unstaked(uint256 amount, address recipient);
    event RewardsDistributed(uint256 totalRewards);

    address public stakingRecipient;

    constructor(address _stakingRecipient) {
        stakingRecipient = _stakingRecipient;
        lastRewardDistribution = block.timestamp;
    }

    receive() external payable {
        require(msg.value > 0, "Deposit must be greater than zero.");
        require(
            deposits[msg.sender] + msg.value <= MAX_DEPOSIT_PER_USER,
            "Deposit exceeds per-user limit."
        );

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

    function claimAndDistributeRewards() external {
        require(block.timestamp >= lastRewardDistribution + REWARD_INTERVAL, "Rewards can only be distributed every 8 days.");
        require(totalDeposited > 0, "No active deposits.");
        
        uint256 rewardAmount = address(this).balance - totalDeposited;
        require(rewardAmount > 0, "No rewards available.");

        totalRewards = rewardAmount;

        for (uint256 i = 0; i < depositors.length; i++) {
            address user = depositors[i];
            uint256 share = (deposits[user] * rewardAmount) / totalDeposited;
            rewards[user] += share;
        }

        lastRewardDistribution = block.timestamp;
        emit RewardsDistributed(totalRewards);
    }

    // ✅ FUNCTION TO WITHDRAW REWARDS
    function withdrawRewards() external {
        uint256 amount = rewards[msg.sender];
        require(amount > 0, "No rewards to withdraw.");
        
        rewards[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
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

        // Emit Unstake event to trigger P2P withdrawal
        emit Unstaked(amountToUnstake, address(this));
    }

    function distributeWithdrawnFunds() external {
        require(address(this).balance > 0, "No ETH to distribute.");

        uint256 contractBalance = address(this).balance;
        
        for (uint256 i = 0; i < depositors.length; i++) {
            address user = depositors[i];
            uint256 amount = (deposits[user] * contractBalance) / totalDeposited;

            if (amount > 0) {
                (bool success, ) = payable(user).call{value: amount}("");
                require(success, "ETH transfer failed");
            }
            hasVotedForUnstake[user] = false;
            deposits[user] = 0;
        }

        // Reset pool state
        totalDeposited = 0;
        unstakeVotes = 0;
        delete depositors;
    }

}
