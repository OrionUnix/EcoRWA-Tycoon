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
    
    address owner;
    address alice = address(0x1);
    address bob = address(0x2);
    
    // Constants from contract
    uint256 constant LOFT_SAINT_GERMAIN = 1;
    uint256 constant LE_BISTROT_CENTRAL = 2;
    uint256 constant ECO_TOWER_2030 = 3;
    
    function setUp() public {
        owner = address(this);
        usdc = new MockUSDC();
        vault = new ParseCityVault(address(usdc));
        
        // Distribue USDC aux testeurs avec vérification
        require(usdc.transfer(alice, 10000 * 1e6), "Transfer to alice failed");
        require(usdc.transfer(bob, 10000 * 1e6), "Transfer to bob failed");
        
        // Fund yield pool
        usdc.approve(address(vault), 100000 * 1e6);
        vault.fundYieldPool(100000 * 1e6);
    }
    
    function testMintLoftSaintGermain() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 1500 * 1e6);
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 10);
        
        assertEq(vault.balanceOf(alice, LOFT_SAINT_GERMAIN), 10);
        
        (,,, uint256 totalSupply, uint256 mintedSupply,,) = vault.getBuildingInfo(LOFT_SAINT_GERMAIN);
        assertEq(mintedSupply, 10);
        
        vm.stopPrank();
    }
    
    function testYieldCalculationLoft() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 150 * 1e6);
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 1);
        
        vm.warp(block.timestamp + 365 days);
        
        uint256 expectedYield = 6 * 1e6;
        uint256 actualYield = vault.calculateYield(LOFT_SAINT_GERMAIN, alice);
        
        assertEq(actualYield, expectedYield);
        
        vm.stopPrank();
    }
}
