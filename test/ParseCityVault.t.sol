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
    
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address owner;
    
    function setUp() public {
        owner = address(this);
        
        usdc = new MockUSDC();
        vault = new ParseCityVault(address(usdc));
        
        usdc.transfer(alice, 100000 * 1e6);
        usdc.transfer(bob, 100000 * 1e6);
    }
    
    function testMintLoftSaintGermain() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 1500 * 1e6);
        vault.mintBuilding(1, 10);
        
        assertEq(vault.balanceOf(alice, 1), 10);
        assertEq(usdc.balanceOf(alice), 98500 * 1e6);
        
        vm.stopPrank();
    }
    
    function testMintBistrotCentral() public {
        vm.startPrank(bob);
        
        usdc.approve(address(vault), 500 * 1e6);
        vault.mintBuilding(2, 5);
        
        assertEq(vault.balanceOf(bob, 2), 5);
        
        vm.stopPrank();
    }
    
    function testMintEcoTower() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 2500 * 1e6);
        vault.mintBuilding(3, 10);
        
        assertEq(vault.balanceOf(alice, 3), 10);
        
        vm.stopPrank();
    }
    
    function testYieldCalculationAfter1Year() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 150 * 1e6);
        vault.mintBuilding(1, 1);
        
        vm.warp(block.timestamp + 365 days);
        
        uint256 yieldAmount = vault.calculateYield(1, alice);
        assertEq(yieldAmount, 6 * 1e6);
        
        vm.stopPrank();
    }
    
    function testYieldCalculationAfter6Months() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 150 * 1e6);
        vault.mintBuilding(1, 1);
        
        vm.warp(block.timestamp + 182 days);
        
        uint256 yieldAmount = vault.calculateYield(1, alice);
        assertApproxEqRel(yieldAmount, 3 * 1e6, 0.01e18);
        
        vm.stopPrank();
    }
    
    function testClaimYield() public {
        usdc.transfer(address(vault), 10000 * 1e6);
        
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 150 * 1e6);
        vault.mintBuilding(1, 1);
        
        vm.warp(block.timestamp + 365 days);
        
        uint256 balanceBefore = usdc.balanceOf(alice);
        vault.claimYield(1);
        uint256 balanceAfter = usdc.balanceOf(alice);
        
        assertEq(balanceAfter - balanceBefore, 6 * 1e6);
        
        vm.stopPrank();
    }
    
function testMultipleYieldClaims() public {
    usdc.transfer(address(vault), 10000 * 1e6);
    
    vm.startPrank(alice);
    
    usdc.approve(address(vault), 150 * 1e6);
    vault.mintBuilding(1, 1);
    
    // Claim après 1 an
    vm.warp(block.timestamp + 365 days);
    uint256 firstClaim = vault.calculateYield(1, alice);
    vault.claimYield(1);
    
    // Vérifier que le yield est réinitialisé
    uint256 yieldAfterClaim = vault.calculateYield(1, alice);
    assertEq(yieldAfterClaim, 0);
    
    // Attendre encore 1 an
    vm.warp(block.timestamp + 365 days);
    uint256 secondClaim = vault.calculateYield(1, alice);
    
    // Les deux claims devraient être similaires (~6 USDC chacun)
    assertApproxEqRel(firstClaim, secondClaim, 0.01e18);
    
    vm.stopPrank();
}
    function testGetBuildingInfo() public {
        (
            string memory name,
            uint256 pricePerToken,
            uint256 yieldPercentage,
            uint256 totalSupply,
            uint256 mintedSupply,
            string memory pluAlert,
            bool isActive
        ) = vault.getBuildingInfo(1);
        
        assertEq(name, "Loft Saint-Germain");
        assertEq(pricePerToken, 150 * 1e6);
        assertEq(yieldPercentage, 400);
        assertEq(totalSupply, 1000);
        assertEq(mintedSupply, 0);
        assertTrue(isActive);
    }
    
    function testGetHolderStats() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 300 * 1e6);
        vault.mintBuilding(1, 2);
        
        (
            uint256 balance,
            uint256 investedAmount,
            ,
            uint256 annualYield
        ) = vault.getHolderStats(1, alice);
        
        assertEq(balance, 2);
        assertEq(investedAmount, 300 * 1e6);
        assertEq(annualYield, 12 * 1e6);
        
        vm.stopPrank();
    }
    
    function testCannotMintMoreThanSupply() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 200000 * 1e6);
        
        vm.expectRevert("Exceeds total supply");
        vault.mintBuilding(1, 1001);
        
        vm.stopPrank();
    }
    
    function testUpdatePLUAlert() public {
        vault.updatePLUAlert(1, "Nouvelle alerte de travaux");
        
        (, , , , , string memory pluAlert, ) = vault.getBuildingInfo(1);
        assertEq(pluAlert, "Nouvelle alerte de travaux");
    }
    
    function testToggleBuildingActive() public {
        vault.toggleBuildingActive(1);
        
        vm.startPrank(alice);
        usdc.approve(address(vault), 150 * 1e6);
        
        vm.expectRevert("Building not active");
        vault.mintBuilding(1, 1);
        
        vm.stopPrank();
    }
    
    function testHighYieldBistrot() public {
        usdc.transfer(address(vault), 10000 * 1e6);
        
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 100 * 1e6);
        vault.mintBuilding(2, 1);
        
        vm.warp(block.timestamp + 365 days);
        
        uint256 yieldAmount = vault.calculateYield(2, alice);
        assertEq(yieldAmount, 8 * 1e6);
        
        vm.stopPrank();
    }
}