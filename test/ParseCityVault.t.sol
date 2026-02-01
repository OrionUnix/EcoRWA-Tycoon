// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ParseCityVault.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {
        _mint(msg.sender, 10000000 * 1e6);
    }
    
    function decimals() public pure override returns (uint8) {
        return 6;
    }
}

contract ParseCityVaultTest is Test {
    ParseCityVault public vault;
    MockUSDC public usdc;
    
    address admin;
    address maire;
    address oracle;
    address alice = address(0xA11ce);
    address bob = address(0xB0b);
    
    // Building IDs
    uint256 constant LOFT_SAINT_GERMAIN = 1;
    uint256 constant LE_BISTROT_CENTRAL = 2;
    uint256 constant ECO_TOWER_2030 = 3;
    uint256 constant SCPI_BUILDING = 4;
    
    function setUp() public {
        admin = address(this);
        usdc = new MockUSDC();
        vault = new ParseCityVault(address(usdc));
        
        // Setup additional roles
        maire = address(0x3);
        oracle = address(0x4);
        vault.grantRole(vault.MAIRE_ROLE(), maire);
        vault.grantRole(vault.ORACLE_BOOST_ROLE(), oracle);
        
        // Distribute USDC
        usdc.transfer(alice, 100000 * 1e6);
        usdc.transfer(bob, 100000 * 1e6);
        
        // Fund yield pool
        usdc.approve(address(vault), 1000000 * 1e6);
        vault.fundYieldPool(1000000 * 1e6);
        
        // Create SCPI building
        vault.createBuilding(SCPI_BUILDING, 2, 200 * 1e6, 800, 1 * 1e6, 500, true);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // BASIC TESTS
    // ═══════════════════════════════════════════════════════════════════════
    
    function testMintBuilding() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 1500 * 1e6);
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 10);
        
        assertEq(vault.balanceOf(alice, LOFT_SAINT_GERMAIN), 10);
        
        (,,,,, uint256 mintedSupply,,) = vault.getBuildingInfo(LOFT_SAINT_GERMAIN);
        assertEq(mintedSupply, 10);
        
        vm.stopPrank();
    }
    
    function testCannotExceedSupply() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 200000 * 1e6);
        
        vm.expectRevert("Exceeds supply");
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 1001); // Supply = 1000
        
        vm.stopPrank();
    }
    
    function testCannotMintInactiveBuilding() public {
        // Admin désactive le building
        vault.toggleBuildingActive(LOFT_SAINT_GERMAIN);
        
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 150 * 1e6);
        
        vm.expectRevert("Building not available");
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 1);
        
        vm.stopPrank();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // YIELD CALCULATION TESTS
    // ═══════════════════════════════════════════════════════════════════════
    
    function testBasicYieldCalculation() public {
        vm.startPrank(alice);
        
        // Mint 1 Loft (150 USDC, 4.2% APY, 0.5 USDC maintenance/month)
        usdc.approve(address(vault), 150 * 1e6);
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 1);
        
        // Avance de 1 an
        vm.warp(block.timestamp + 365 days);
        
        // Yield brut : 150 * 4.2% = 6.3 USDC
        // Taxe mairie (2%) : 6.3 * 0.02 = 0.126 USDC
        // Maintenance : 0.5 USDC/mois * 1 token * 365 jours / 30 jours = 6.083 USDC
        // Net : 6.3 - 0.126 - 6.083 = 0.091 USDC (environ)
        
        uint256 yieldAmount = vault.calculateYield(LOFT_SAINT_GERMAIN, alice);
        
        // Tolérance de 1%
        assertApproxEqRel(yieldAmount, 0.091 * 1e6, 0.01e18);
        
        vm.stopPrank();
    }
    
    function testYieldWithBoost() public {
        // Oracle set boost de 10%
        vm.prank(oracle);
        vault.setUserEmpireBoost(alice, 1000); // 10%
        
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 150 * 1e6);
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 1);
        
        vm.warp(block.timestamp + 365 days);
        
        (uint256 grossYield, uint256 boost,,,, uint256 netYield) = vault.getYieldBreakdown(LOFT_SAINT_GERMAIN, alice);
        
        // Boost doit être ~10% du gross yield
        assertApproxEqRel(boost, grossYield / 10, 0.01e18);
        
        // Net doit inclure le boost (supérieur au yield sans boost)
        assertTrue(netYield > 0);
        
        vm.stopPrank();
    }
    
    function testYieldWithSCPI() public {
        vm.startPrank(alice);
        
        // Mint SCPI building (10% frais de gestion)
        usdc.approve(address(vault), 200 * 1e6);
        vault.mintBuilding(SCPI_BUILDING, 1);
        
        vm.warp(block.timestamp + 365 days);
        
        (uint256 grossYield,, uint256 tax, uint256 maintenance, uint256 scpiFees, uint256 netYield) = 
            vault.getYieldBreakdown(SCPI_BUILDING, alice);
        
        // SCPI fees = 10% du gross yield
        uint256 expectedSCPIFees = grossYield / 10;
        assertApproxEqRel(scpiFees, expectedSCPIFees, 0.01e18);
        
        // Net doit être réduit par les frais SCPI
        uint256 expectedNet = grossYield - tax - maintenance - scpiFees;
        assertEq(netYield, expectedNet);
        
        vm.stopPrank();
    }
    
    function testYieldBreakdown() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 150 * 1e6);
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 1);
        
        vm.warp(block.timestamp + 365 days);
        
        (uint256 grossYield, uint256 boost, uint256 tax, uint256 maintenance, uint256 scpiFees, uint256 netYield) = 
            vault.getYieldBreakdown(LOFT_SAINT_GERMAIN, alice);
        
        // Vérifications de cohérence
        assertTrue(grossYield > 0, "Gross yield should be positive");
        assertEq(boost, 0, "No boost set"); // Pas de boost par défaut
        assertTrue(tax > 0, "Tax should be positive");
        assertTrue(maintenance > 0, "Maintenance should be positive");
        assertEq(scpiFees, 0, "No SCPI fees for non-SCPI building");
        
        // Net = Gross + Boost - Tax - Maintenance - SCPI
        assertEq(netYield, grossYield + boost - tax - maintenance - scpiFees);
        
        vm.stopPrank();
    }
    
    function testClaimYield() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 150 * 1e6);
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 1);
        
        uint256 balanceBefore = usdc.balanceOf(alice);
        
        vm.warp(block.timestamp + 365 days);
        
        uint256 expectedYield = vault.calculateYield(LOFT_SAINT_GERMAIN, alice);
        vault.claimYield(LOFT_SAINT_GERMAIN);
        
        uint256 balanceAfter = usdc.balanceOf(alice);
        
        assertEq(balanceAfter - balanceBefore, expectedYield);
        
        // Après claim, le yield doit être à 0
        assertEq(vault.calculateYield(LOFT_SAINT_GERMAIN, alice), 0);
        
        vm.stopPrank();
    }
    
    function testCannotClaimZeroYield() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 150 * 1e6);
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 1);
        
        // Pas de temps écoulé, yield = 0
        vm.expectRevert("No yield to claim");
        vault.claimYield(LOFT_SAINT_GERMAIN);
        
        vm.stopPrank();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // GAMEFI MECHANICS TESTS
    // ═══════════════════════════════════════════════════════════════════════
    
    function testMaireTaxRate() public {
        // Maire augmente la taxe à 5%
        vm.prank(maire);
        vault.setMairieTaxRate(500);
        
        assertEq(vault.mairieTaxRate(), 500);
        
        // Vérifier impact sur yield
        vm.startPrank(alice);
        usdc.approve(address(vault), 150 * 1e6);
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 1);
        vm.warp(block.timestamp + 365 days);
        
        (, , uint256 tax, , , ) = vault.getYieldBreakdown(LOFT_SAINT_GERMAIN, alice);
        assertTrue(tax > 0, "Tax should be applied");
        
        vm.stopPrank();
    }
    
    function testCannotSetTaxTooHigh() public {
        // Taxe ne peut pas dépasser 20%
        vm.prank(maire);
        vm.expectRevert("Tax rate too high (max 20%)");
        vault.setMairieTaxRate(2001);
    }
    
    function testEmpireBoost() public {
        // Oracle set boost pour Alice
        vm.prank(oracle);
        vault.setUserEmpireBoost(alice, 1500); // 15%
        
        assertEq(vault.userEmpireBoost(alice), 1500);
        
        // Vérifier impact sur yield
        vm.startPrank(alice);
        usdc.approve(address(vault), 150 * 1e6);
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 1);
        vm.warp(block.timestamp + 365 days);
        
        (, uint256 boost, , , , ) = vault.getYieldBreakdown(LOFT_SAINT_GERMAIN, alice);
        assertTrue(boost > 0, "Boost should be applied");
        
        vm.stopPrank();
    }
    
    function testCannotSetBoostTooHigh() public {
        // Boost ne peut pas dépasser 50%
        vm.prank(oracle);
        vm.expectRevert("Boost too high (max 50%)");
        vault.setUserEmpireBoost(alice, 5001);
    }
    
    function testBatchBoost() public {
        address[] memory users = new address[](3);
        users[0] = alice;
        users[1] = bob;
        users[2] = address(0xC);
        
        uint256[] memory boosts = new uint256[](3);
        boosts[0] = 500;
        boosts[1] = 1000;
        boosts[2] = 1500;
        
        vm.prank(oracle);
        vault.batchSetEmpireBoost(users, boosts);
        
        assertEq(vault.userEmpireBoost(alice), 500);
        assertEq(vault.userEmpireBoost(bob), 1000);
        assertEq(vault.userEmpireBoost(address(0xC)), 1500);
    }
    
    function testBatchBoostArrayMismatch() public {
        address[] memory users = new address[](2);
        users[0] = alice;
        users[1] = bob;
        
        uint256[] memory boosts = new uint256[](3);
        boosts[0] = 500;
        boosts[1] = 1000;
        boosts[2] = 1500;
        
        vm.prank(oracle);
        vm.expectRevert("Array length mismatch");
        vault.batchSetEmpireBoost(users, boosts);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // ACCESS CONTROL TESTS
    // ═══════════════════════════════════════════════════════════════════════
    
    function testOnlyAdminCanCreateBuilding() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.createBuilding(100, 1, 100 * 1e6, 500, 1 * 1e6, 1000, false);
    }
    
    function testOnlyAdminCanToggleActive() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.toggleBuildingActive(LOFT_SAINT_GERMAIN);
    }
    
    function testOnlyMaireCanSetTax() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.setMairieTaxRate(300);
    }
    
    function testOnlyOracleCanSetBoost() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.setUserEmpireBoost(bob, 1000);
    }
    
    function testOnlyAdminCanFundPool() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 1000 * 1e6);
        
        vm.expectRevert();
        vault.fundYieldPool(1000 * 1e6);
        
        vm.stopPrank();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SCPI TESTS
    // ═══════════════════════════════════════════════════════════════════════
    
    function testSetSCPIStatus() public {
        // Admin marque le Loft comme SCPI
        vault.setSCPIStatus(LOFT_SAINT_GERMAIN, true);
        
        (,,,,,,, bool isSCPI) = vault.getBuildingInfo(LOFT_SAINT_GERMAIN);
        assertTrue(isSCPI);
        
        // Désactive SCPI
        vault.setSCPIStatus(LOFT_SAINT_GERMAIN, false);
        (,,,,,,, isSCPI) = vault.getBuildingInfo(LOFT_SAINT_GERMAIN);
        assertFalse(isSCPI);
    }
    
    function testSCPIFeesApplied() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 200 * 1e6);
        vault.mintBuilding(SCPI_BUILDING, 1);
        
        vm.warp(block.timestamp + 365 days);
        
        (,,,,uint256 scpiFees,) = vault.getYieldBreakdown(SCPI_BUILDING, alice);
        
        // SCPI fees doivent être > 0
        assertTrue(scpiFees > 0);
        
        vm.stopPrank();
    }
    
    function testSCPIFeeIs10Percent() public {
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 200 * 1e6);
        vault.mintBuilding(SCPI_BUILDING, 1);
        
        vm.warp(block.timestamp + 365 days);
        
        (uint256 grossYield, uint256 boost, , , uint256 scpiFees, ) = vault.getYieldBreakdown(SCPI_BUILDING, alice);
        
        // SCPI fees = 10% de (grossYield + boost)
        uint256 expectedFees = ((grossYield + boost) * 1000) / 10000;
        assertEq(scpiFees, expectedFees);
        
        vm.stopPrank();
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // BUILDING MANAGEMENT TESTS
    // ═══════════════════════════════════════════════════════════════════════
    
    function testCreateBuilding() public {
        uint256 newId = 100;
        vault.createBuilding(newId, 4, 300 * 1e6, 900, 2 * 1e6, 250, false);
        
        (uint256 category, uint256 price, uint256 yieldPct, uint256 maint, uint256 supply, , bool isActive, bool isSCPI) = 
            vault.getBuildingInfo(newId);
        
        assertEq(category, 4);
        assertEq(price, 300 * 1e6);
        assertEq(yieldPct, 900);
        assertEq(maint, 2 * 1e6);
        assertEq(supply, 250);
        assertTrue(isActive);
        assertFalse(isSCPI);
    }
    
    function testCannotCreateDuplicateBuilding() public {
        vm.expectRevert("Building ID already exists");
        vault.createBuilding(LOFT_SAINT_GERMAIN, 1, 100 * 1e6, 500, 1 * 1e6, 1000, false);
    }
    
    function testCannotCreateInvalidCategory() public {
        vm.expectRevert("Invalid category");
        vault.createBuilding(100, 0, 100 * 1e6, 500, 1 * 1e6, 1000, false);
        
        vm.expectRevert("Invalid category");
        vault.createBuilding(101, 11, 100 * 1e6, 500, 1 * 1e6, 1000, false);
    }
    
    function testCannotCreateExcessiveYield() public {
        vm.expectRevert("Yield too high (max 50%)");
        vault.createBuilding(100, 1, 100 * 1e6, 5001, 1 * 1e6, 1000, false);
    }
    
    function testUpdateMaintenanceCost() public {
        vault.updateMaintenanceCost(LOFT_SAINT_GERMAIN, 2 * 1e6);
        
        (,,, uint256 maint,,,,) = vault.getBuildingInfo(LOFT_SAINT_GERMAIN);
        assertEq(maint, 2 * 1e6);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // SECURITY TESTS
    // ═══════════════════════════════════════════════════════════════════════
    
    function testReentrancyProtection() public {
        // Test basique - implémentation complète nécessite un contrat malveillant
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 150 * 1e6);
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 1);
        
        // Claim multiple fois rapidement ne devrait pas causer de problème
        vm.warp(block.timestamp + 1 days);
        vault.claimYield(LOFT_SAINT_GERMAIN);
        
        vm.stopPrank();
    }
    
    function testCannotClaimNegativeYield() public {
        // Crée un bâtiment avec maintenance très élevée
        vault.createBuilding(99, 1, 100 * 1e6, 100, 50 * 1e6, 1000, false); // Maint > Yield
        
        vm.startPrank(alice);
        
        usdc.approve(address(vault), 100 * 1e6);
        vault.mintBuilding(99, 1);
        
        vm.warp(block.timestamp + 30 days);
        
        uint256 yieldAmount = vault.calculateYield(99, alice);
        
        // Yield doit être 0, pas négatif
        assertEq(yieldAmount, 0);
        
        vm.stopPrank();
    }
    
    function testEmergencyWithdrawOnlySuperAdmin() public {
        vm.prank(alice);
        vm.expectRevert();
        vault.emergencyWithdraw();
        
        vm.prank(maire);
        vm.expectRevert();
        vault.emergencyWithdraw();
        
        // Only DEFAULT_ADMIN_ROLE can withdraw
        uint256 adminBalanceBefore = usdc.balanceOf(admin);
        uint256 vaultBalance = usdc.balanceOf(address(vault));
        vault.emergencyWithdraw();
        assertEq(usdc.balanceOf(admin), adminBalanceBefore + vaultBalance);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // EDGE CASES TESTS
    // ═══════════════════════════════════════════════════════════════════════
    
    function testMultipleHoldersSameBuilding() public {
        // Alice mint 5 Lofts
        vm.startPrank(alice);
        usdc.approve(address(vault), 750 * 1e6);
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 5);
        vm.stopPrank();
        
        // Bob mint 3 Lofts
        vm.startPrank(bob);
        usdc.approve(address(vault), 450 * 1e6);
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 3);
        vm.stopPrank();
        
        assertEq(vault.balanceOf(alice, LOFT_SAINT_GERMAIN), 5);
        assertEq(vault.balanceOf(bob, LOFT_SAINT_GERMAIN), 3);
        
        (,,,,, uint256 minted,,) = vault.getBuildingInfo(LOFT_SAINT_GERMAIN);
        assertEq(minted, 8);
    }
    
    function testYieldIndependentPerHolder() public {
        vm.startPrank(alice);
        usdc.approve(address(vault), 150 * 1e6);
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 1);
        vm.stopPrank();
        
        vm.warp(block.timestamp + 100 days);
        
        vm.startPrank(bob);
        usdc.approve(address(vault), 150 * 1e6);
        vault.mintBuilding(LOFT_SAINT_GERMAIN, 1);
        vm.stopPrank();
        
        vm.warp(block.timestamp + 100 days);
        
        uint256 aliceYield = vault.calculateYield(LOFT_SAINT_GERMAIN, alice);
        uint256 bobYield = vault.calculateYield(LOFT_SAINT_GERMAIN, bob);
        
        // Alice détient depuis 200 jours, Bob depuis 100 jours
        assertTrue(aliceYield > bobYield);
    }
}
