// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ParseCityVault.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();
        
        address usdc = 0x91d5F6B2458ea9f060EDAD50794cc79E7Ec30cE0;
        ParseCityVault vault = new ParseCityVault(usdc);
        
        console.log("ParseCityVault deployed at:", address(vault));
        
        vm.stopBroadcast();
    }
}