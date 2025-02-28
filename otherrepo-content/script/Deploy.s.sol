// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../lib/forge-std/src/Script.sol";
import "../src/ETHPool.sol";

contract DeployETHPool is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // address stakingRecipient = vm.envAddress("STAKING_RECIPIENT");

        vm.startBroadcast(deployerPrivateKey);

        // ETHPool ethPool = new ETHPool(stakingRecipient);
        // console.log("ETHPool deployed to:", address(ethPool));
        ETHPool ethPool = new ETHPool(msg.sender);
        console.log("ETHPool deployed to:", address(ethPool));

        vm.stopBroadcast();
    }
}
