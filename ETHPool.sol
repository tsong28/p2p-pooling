// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ETHPool {
    uint256 public constant STAKING_THRESHOLD = 32 ether;

    event Deposited(address indexed sender, uint256 amount);
    event ThresholdReached(uint256 totalBalance);

    constructor() {}

    receive() external payable {
        emit Deposited(msg.sender, msg.value);

        // Emit event when we hit 32 ETH
        if (address(this).balance >= STAKING_THRESHOLD) {
            emit ThresholdReached(address(this).balance);
        }
    }

    // View function to check if 32 ETH is reached (optional)
    function isReadyToStake() external view returns (bool) {
        return address(this).balance >= STAKING_THRESHOLD;
    }
}
