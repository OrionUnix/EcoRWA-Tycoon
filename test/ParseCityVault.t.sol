// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ParseCityVault.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 1000000 * 1e6);
    }
    
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract ParseCityVaultTest is Test {
    ParseCityVault public vault;
    MockUSDC public usdc;
    
    address alice = address(0x1);
    address bob = address(0x2);
    
    function setUp() public {
        usdc = new MockUSDC();
        vault = new ParseCityVault(address(usdc));
        
        // Distribue USDC aux testeurs
        usdc.transfer(alice, 10000 * 1e6);
        usdc.transfer(bob, 10000 * 1e6);
    }
    
    function testMintLoftSaintGermain() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 1500 * 1e6);
        vault.mintBuilding(1, 10); // 10 tokens à 150 USDC
        
        assertEq(vault.balanceOf(alice, 1), 10);
        vm.stopPrank();
    }
    
    function testYieldCalculation() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 150 * 1e6);
        vault.mintBuilding(1, 1);
        
        vm.warp(block.timestamp + 365 days);
        
        uint256 yield = vault.calculateYield(1, alice);
        assertEq(yield, 6 * 1e6); // 4% de 150 USDC = 6 USDC
        
        vm.stopPrank();
    }
}