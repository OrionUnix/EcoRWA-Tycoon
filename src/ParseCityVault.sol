// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ParseCityVault
 * @notice Smart Contract ERC1155 pour la tokenisation de biens immobiliers
 * @dev Version 2.0 - Modular GameFi avec SCPI et AccessControl
 */
contract ParseCityVault is ERC1155, AccessControl, ReentrancyGuard {
    
    // ═══════════════════════════════════════════════════════════════════════
    // STRUCTS & ENUMS
    // ═══════════════════════════════════════════════════════════════════════
    
    struct Building {
        uint256 category;           // Catégorie du bâtiment (1=RES, 2=COM, etc.)
        uint256 pricePerToken;      // Prix par token en USDC (6 decimals)
        uint256 yieldPercentage;    // APY en basis points (400 = 4%)
        uint256 maintenanceCost;    // Frais mensuel par token en USDC
        uint256 totalSupply;        // Supply totale
        uint256 mintedSupply;       // Quantité déjà mintée
        bool isActive;              // Disponible à l'achat
        bool isSCPI;                // Soumis aux frais de gestion SCPI (10%)
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════
    
    IERC20 public immutable usdc;
    
    // Bâtiments
    mapping(uint256 => Building) public buildings;
    
    // Yield tracking
    mapping(uint256 => mapping(address => uint256)) public lastClaimTime;
    
    // GameFi Mechanics
    uint256 public mairieTaxRate;                       // Taxe municipale (basis points)
    mapping(address => uint256) public userEmpireBoost; // Boost par joueur (basis points)
    
    // Constants
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant SECONDS_PER_YEAR = 365 days;
    uint256 private constant SECONDS_PER_MONTH = 30 days;
    uint256 public constant SCPI_MANAGEMENT_FEE = 1000; // 10% en basis points
    
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MAIRE_ROLE = keccak256("MAIRE_ROLE");
    bytes32 public constant ORACLE_BOOST_ROLE = keccak256("ORACLE_BOOST_ROLE");
    
    // ═══════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════
    
    event BuildingCreated(uint256 indexed buildingId, uint256 category, uint256 price, uint256 supply);
    event BuildingMinted(address indexed buyer, uint256 indexed buildingId, uint256 amount, uint256 totalCost);
    event YieldClaimed(address indexed holder, uint256 indexed buildingId, uint256 yieldAmount);
    event TaxRateUpdated(uint256 oldRate, uint256 newRate);
    event EmpireBoostUpdated(address indexed user, uint256 oldBoost, uint256 newBoost);
    event SCPIStatusChanged(uint256 indexed buildingId, bool isSCPI);
    event MaintenanceCostUpdated(uint256 indexed buildingId, uint256 oldCost, uint256 newCost);

    // ═══════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════
    
    constructor(address _usdc) 
        ERC1155("https://api.parsecity.io/metadata/{id}.json")
    {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MAIRE_ROLE, msg.sender);
        _grantRole(ORACLE_BOOST_ROLE, msg.sender);
        
        // Initialize default tax rate (2%)
        mairieTaxRate = 200;
        
        // Setup initial buildings (catégories uniquement)
        _setupBuilding(1, 1, 150 * 1e6, 420, 0.5 * 1e6, 1000, false);  // Loft (RES)
        _setupBuilding(2, 2, 100 * 1e6, 780, 0.8 * 1e6, 2000, false);  // Bistrot (COM)
        _setupBuilding(3, 3, 250 * 1e6, 650, 1.2 * 1e6, 500, false);   // Eco-Tower (MIXED)
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS - BUILDING MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Crée un nouveau type de bâtiment
     * @param buildingId ID unique du bâtiment
     * @param category Catégorie (1=RES, 2=COM, 3=MIXED, 4=IND, etc.)
     * @param pricePerToken Prix en USDC (6 decimals)
     * @param yieldPercentage APY en basis points
     * @param maintenanceCost Frais mensuel par token
     * @param totalSupply Supply totale
     * @param isSCPI Soumettre aux frais SCPI
     */
    function createBuilding(
        uint256 buildingId,
        uint256 category,
        uint256 pricePerToken,
        uint256 yieldPercentage,
        uint256 maintenanceCost,
        uint256 totalSupply,
        bool isSCPI
    ) external onlyRole(ADMIN_ROLE) {
        require(buildings[buildingId].totalSupply == 0, "Building ID already exists");
        require(category > 0 && category <= 10, "Invalid category");
        require(yieldPercentage <= 5000, "Yield too high (max 50%)");
        
        buildings[buildingId] = Building({
            category: category,
            pricePerToken: pricePerToken,
            yieldPercentage: yieldPercentage,
            maintenanceCost: maintenanceCost,
            totalSupply: totalSupply,
            mintedSupply: 0,
            isActive: true,
            isSCPI: isSCPI
        });
        
        emit BuildingCreated(buildingId, category, pricePerToken, totalSupply);
    }
    
    /**
     * @notice Active/désactive un bâtiment
     */
    function toggleBuildingActive(uint256 buildingId) external onlyRole(ADMIN_ROLE) {
        buildings[buildingId].isActive = !buildings[buildingId].isActive;
    }
    
    /**
     * @notice Définit le statut SCPI d'un bâtiment
     * @dev Applique automatiquement 10% de frais de gestion sur le yield
     */
    function setSCPIStatus(uint256 buildingId, bool isSCPI) external onlyRole(ADMIN_ROLE) {
        require(buildings[buildingId].totalSupply > 0, "Building does not exist");
        buildings[buildingId].isSCPI = isSCPI;
        emit SCPIStatusChanged(buildingId, isSCPI);
    }
    
    /**
     * @notice Met à jour les frais de maintenance
     */
    function updateMaintenanceCost(uint256 buildingId, uint256 newCost) external onlyRole(ADMIN_ROLE) {
        uint256 oldCost = buildings[buildingId].maintenanceCost;
        buildings[buildingId].maintenanceCost = newCost;
        emit MaintenanceCostUpdated(buildingId, oldCost, newCost);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // MAIRE FUNCTIONS - TAXES
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Ajuste le taux de taxe municipale
     * @param newRate Nouveau taux en basis points (max 20%)
     */
    function setMairieTaxRate(uint256 newRate) external onlyRole(MAIRE_ROLE) {
        require(newRate <= 2000, "Tax rate too high (max 20%)");
        uint256 oldRate = mairieTaxRate;
        mairieTaxRate = newRate;
        emit TaxRateUpdated(oldRate, newRate);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // ORACLE FUNCTIONS - EMPIRE BOOST
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Met à jour le boost d'empire d'un joueur
     * @param user Adresse du joueur
     * @param boostPercentage Boost en basis points (ex: 500 = +5%)
     */
    function setUserEmpireBoost(address user, uint256 boostPercentage) external onlyRole(ORACLE_BOOST_ROLE) {
        require(boostPercentage <= 5000, "Boost too high (max 50%)");
        uint256 oldBoost = userEmpireBoost[user];
        userEmpireBoost[user] = boostPercentage;
        emit EmpireBoostUpdated(user, oldBoost, boostPercentage);
    }
    
    /**
     * @notice Met à jour plusieurs boosts en batch
     */
    function batchSetEmpireBoost(address[] calldata users, uint256[] calldata boosts) external onlyRole(ORACLE_BOOST_ROLE) {
        require(users.length == boosts.length, "Array length mismatch");
        for (uint256 i = 0; i < users.length; i++) {
            require(boosts[i] <= 5000, "Boost too high");
            userEmpireBoost[users[i]] = boosts[i];
            emit EmpireBoostUpdated(users[i], 0, boosts[i]);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // TREASURY MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Alimente le pool de yield
     */
    function fundYieldPool(uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }
    
    /**
     * @notice Retrait d'urgence (admin uniquement)
     */
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 balance = usdc.balanceOf(address(this));
        require(usdc.transfer(msg.sender, balance), "Withdraw failed");
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // USER FUNCTIONS - MINT & CLAIM
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Mint des tokens de bâtiment
     * @param buildingId ID du bâtiment
     * @param amount Quantité à acheter
     */
    function mintBuilding(uint256 buildingId, uint256 amount) external nonReentrant {
        Building storage building = buildings[buildingId];
        require(building.isActive, "Building not available");
        require(amount > 0, "Invalid amount");
        require(building.mintedSupply + amount <= building.totalSupply, "Exceeds supply");
        
        uint256 totalCost = building.pricePerToken * amount;
        require(usdc.transferFrom(msg.sender, address(this), totalCost), "Payment failed");
        
        building.mintedSupply += amount;
        lastClaimTime[buildingId][msg.sender] = block.timestamp;
        _mint(msg.sender, buildingId, amount, "");
        
        emit BuildingMinted(msg.sender, buildingId, amount, totalCost);
    }
    
    /**
     * @notice Collecte le yield accumulé
     * @param buildingId ID du bâtiment
     */
    function claimYield(uint256 buildingId) external nonReentrant {
        uint256 yieldAmount = calculateYield(buildingId, msg.sender);
        require(yieldAmount > 0, "No yield to claim");
        require(usdc.balanceOf(address(this)) >= yieldAmount, "Insufficient USDC reserve");
        
        lastClaimTime[buildingId][msg.sender] = block.timestamp;
        require(usdc.transfer(msg.sender, yieldAmount), "Transfer failed");
        
        emit YieldClaimed(msg.sender, buildingId, yieldAmount);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS - YIELD CALCULATION
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Calcule le yield net d'un utilisateur
     * @dev Formule : Yield Brut + Boost - Taxe Mairie - Maintenance - Frais SCPI
     */
    function calculateYield(uint256 buildingId, address holder) public view returns (uint256) {
        Building memory building = buildings[buildingId];
        uint256 balance = balanceOf(holder, buildingId);
        
        if (balance == 0 || lastClaimTime[buildingId][holder] == 0) return 0;
        
        uint256 timeHeld = block.timestamp - lastClaimTime[buildingId][holder];
        uint256 investedValue = balance * building.pricePerToken;
        
        // 1. Yield brut (APY)
        uint256 grossYield = (investedValue * building.yieldPercentage * timeHeld) / (BASIS_POINTS * SECONDS_PER_YEAR);
        
        // 2. Empire Boost (multiplicateur)
        uint256 boost = (grossYield * userEmpireBoost[holder]) / BASIS_POINTS;
        
        // 3. Taxe municipale
        uint256 tax = (grossYield * mairieTaxRate) / BASIS_POINTS;
        
        // 4. Frais de maintenance
        uint256 maintenanceFees = (building.maintenanceCost * balance * timeHeld) / SECONDS_PER_MONTH;
        
        // 5. Frais SCPI (10% si applicable)
        uint256 scpiFees = 0;
        if (building.isSCPI) {
            scpiFees = ((grossYield + boost) * SCPI_MANAGEMENT_FEE) / BASIS_POINTS;
        }
        
        // 6. Yield net
        uint256 netYield = grossYield + boost;
        
        // Soustraction sécurisée
        if (netYield > tax + maintenanceFees + scpiFees) {
            netYield = netYield - tax - maintenanceFees - scpiFees;
        } else {
            netYield = 0; // Yield négatif = 0
        }
        
        return netYield;
    }
    
    /**
     * @notice Détails du calcul de yield (debug/frontend)
     */
    function getYieldBreakdown(uint256 buildingId, address holder) external view returns (
        uint256 grossYield,
        uint256 boost,
        uint256 tax,
        uint256 maintenance,
        uint256 scpiFees,
        uint256 netYield
    ) {
        Building memory building = buildings[buildingId];
        uint256 balance = balanceOf(holder, buildingId);
        
        if (balance == 0 || lastClaimTime[buildingId][holder] == 0) {
            return (0, 0, 0, 0, 0, 0);
        }
        
        uint256 timeHeld = block.timestamp - lastClaimTime[buildingId][holder];
        uint256 investedValue = balance * building.pricePerToken;
        
        grossYield = (investedValue * building.yieldPercentage * timeHeld) / (BASIS_POINTS * SECONDS_PER_YEAR);
        boost = (grossYield * userEmpireBoost[holder]) / BASIS_POINTS;
        tax = (grossYield * mairieTaxRate) / BASIS_POINTS;
        maintenance = (building.maintenanceCost * balance * timeHeld) / SECONDS_PER_MONTH;
        
        if (building.isSCPI) {
            scpiFees = ((grossYield + boost) * SCPI_MANAGEMENT_FEE) / BASIS_POINTS;
        }
        
        uint256 total = grossYield + boost;
        netYield = total > (tax + maintenance + scpiFees) ? total - tax - maintenance - scpiFees : 0;
    }
    
    /**
     * @notice Infos d'un bâtiment
     */
    function getBuildingInfo(uint256 buildingId) external view returns (
        uint256 category,
        uint256 price,
        uint256 yieldPct,
        uint256 maintenanceCost,
        uint256 totalSupply,
        uint256 mintedSupply,
        bool isActive,
        bool isSCPI
    ) {
        Building memory b = buildings[buildingId];
        return (b.category, b.pricePerToken, b.yieldPercentage, b.maintenanceCost, 
                b.totalSupply, b.mintedSupply, b.isActive, b.isSCPI);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // INTERNAL FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    function _setupBuilding(
        uint256 id,
        uint256 cat,
        uint256 price,
        uint256 yieldPct,
        uint256 maint,
        uint256 supply,
        bool scpi
    ) internal {
        buildings[id] = Building({
            category: cat,
            pricePerToken: price,
            yieldPercentage: yieldPct,
            maintenanceCost: maint,
            totalSupply: supply,
            mintedSupply: 0,
            isActive: true,
            isSCPI: scpi
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // OVERRIDES
    // ═══════════════════════════════════════════════════════════════════════
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
