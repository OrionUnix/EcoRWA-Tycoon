// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ParseCityVault
 * @notice Tokenisation immobilière fractionnée avec yields et alertes PLU
 * @dev ERC-1155 multi-tokens pour 3 bâtiments Parse City
 */
contract ParseCityVault is ERC1155, Ownable, ReentrancyGuard {
    
    // ═══════════════════════════════════════════════════════════════════════
    // STRUCTURES
    // ═══════════════════════════════════════════════════════════════════════
    
    struct Building {
        string name;
        uint256 pricePerToken;      // Prix en USDC (6 decimals)
        uint256 yieldPercentage;    // Rendement annuel en basis points (400 = 4%)
        uint256 totalSupply;        // Supply totale de tokens
        uint256 mintedSupply;       // Tokens déjà mintés
        string pluAlert;            // Alerte PLU de l'IA
        bool isActive;              // Actif pour minting
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // STORAGE
    // ═══════════════════════════════════════════════════════════════════════
    
    IERC20 public usdc;
    
    mapping(uint256 => Building) public buildings;
    mapping(uint256 => mapping(address => uint256)) public lastClaimTime;
    
    uint256 public constant LOFT_SAINT_GERMAIN = 1;
    uint256 public constant LE_BISTROT_CENTRAL = 2;
    uint256 public constant ECO_TOWER_2030 = 3;
    
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant SECONDS_PER_YEAR = 365 days;
    
    // ═══════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════
    
    event BuildingMinted(
        address indexed buyer,
        uint256 indexed buildingId,
        uint256 amount,
        uint256 totalCost
    );
    
    event YieldClaimed(
        address indexed holder,
        uint256 indexed buildingId,
        uint256 yieldAmount
    );
    
    event PLUAlertUpdated(
        uint256 indexed buildingId,
        string newAlert
    );
    
    // ═══════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════
    
    constructor(address _usdc) ERC1155("https://api.parsecity.io/metadata/{id}.json") Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        
        // Loft Saint-Germain - 150 USDC - 4% yield
        buildings[LOFT_SAINT_GERMAIN] = Building({
            name: "Loft Saint-Germain",
            pricePerToken: 150 * 1e6,
            yieldPercentage: 400,
            totalSupply: 1000,
            mintedSupply: 0,
            pluAlert: unicode"Zone protégée, travaux interdits. Stabilité max.",
            isActive: true
        });
        
        // Le Bistrot Central - 100 USDC - 8% yield (risque plus élevé)
        buildings[LE_BISTROT_CENTRAL] = Building({
            name: "Le Bistrot Central",
            pricePerToken: 100 * 1e6,
            yieldPercentage: 800,
            totalSupply: 2000,
            mintedSupply: 0,
            pluAlert: unicode"Travaux de rue en 2026. Risque de vacance temporaire.",
            isActive: true
        });
        
        // Eco-Tower 2030 - 250 USDC - 6% yield
        buildings[ECO_TOWER_2030] = Building({
            name: "Eco-Tower 2030",
            pricePerToken: 250 * 1e6,
            yieldPercentage: 600,
            totalSupply: 500,
            mintedSupply: 0,
            pluAlert: unicode"Neuf. Exonération taxe foncière. Score Éco A+.",
            isActive: true
        });
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // MINTING
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Achète des parts d'un bâtiment avec USDC
     * @param buildingId ID du bâtiment (1, 2, ou 3)
     * @param amount Nombre de tokens à acheter
     */
    function mintBuilding(uint256 buildingId, uint256 amount) external nonReentrant {
        Building storage building = buildings[buildingId];
        
        require(building.isActive, "Building not active");
        require(amount > 0, "Amount must be > 0");
        require(
            building.mintedSupply + amount <= building.totalSupply,
            "Exceeds total supply"
        );
        
        uint256 totalCost = building.pricePerToken * amount;
        
        // Transfer USDC du buyer vers ce contrat
        require(
            usdc.transferFrom(msg.sender, address(this), totalCost),
            "USDC transfer failed"
        );
        
        // Mint les tokens ERC-1155
        _mint(msg.sender, buildingId, amount, "");
        
        building.mintedSupply += amount;
        lastClaimTime[buildingId][msg.sender] = block.timestamp;
        
        emit BuildingMinted(msg.sender, buildingId, amount, totalCost);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // YIELD CLAIMING
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Calcule les yields disponibles pour un holder
     * @param buildingId ID du bâtiment
     * @param holder Adresse du détenteur
     * @return Montant de yield disponible en USDC
     */
    function calculateYield(uint256 buildingId, address holder) public view returns (uint256) {
        Building memory building = buildings[buildingId];
        uint256 balance = balanceOf(holder, buildingId);
        
        if (balance == 0) return 0;
        
        uint256 timeHeld = block.timestamp - lastClaimTime[buildingId][holder];
        uint256 investedAmount = balance * building.pricePerToken;
        
        // Yield = (investedAmount * yieldPercentage * timeHeld) / (BASIS_POINTS * SECONDS_PER_YEAR)
        uint256 yieldAmount = (investedAmount * building.yieldPercentage * timeHeld) 
                              / (BASIS_POINTS * SECONDS_PER_YEAR);
        
        return yieldAmount;
    }
    
    /**
     * @notice Claim les yields accumulés
     * @param buildingId ID du bâtiment
     */
    function claimYield(uint256 buildingId) external nonReentrant {
        uint256 yieldAmount = calculateYield(buildingId, msg.sender);
        
        require(yieldAmount > 0, "No yield to claim");
        require(
            usdc.balanceOf(address(this)) >= yieldAmount,
            "Insufficient contract USDC balance"
        );
        
        lastClaimTime[buildingId][msg.sender] = block.timestamp;
        
        require(usdc.transfer(msg.sender, yieldAmount), "Yield transfer failed");
        
        emit YieldClaimed(msg.sender, buildingId, yieldAmount);
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    /**
     * @notice Met à jour l'alerte PLU d'un bâtiment (oracle IA)
     */
    function updatePLUAlert(uint256 buildingId, string calldata newAlert) external onlyOwner {
        buildings[buildingId].pluAlert = newAlert;
        emit PLUAlertUpdated(buildingId, newAlert);
    }
    
    /**
     * @notice Active/désactive un bâtiment pour le minting
     */
    function toggleBuildingActive(uint256 buildingId) external onlyOwner {
        buildings[buildingId].isActive = !buildings[buildingId].isActive;
    }
    
    /**
     * @notice Ajoute des USDC au contrat pour payer les yields
     */
    function fundYieldPool(uint256 amount) external onlyOwner {
        require(usdc.transferFrom(msg.sender, address(this), amount), "Funding failed");
    }
    
    /**
     * @notice Urgence: retrait USDC (seulement owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(usdc.transfer(owner(), balance), "Withdrawal failed");
    }
    
    // ═══════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════
    
    function getBuildingInfo(uint256 buildingId) external view returns (
        string memory name,
        uint256 pricePerToken,
        uint256 yieldPercentage,
        uint256 totalSupply,
        uint256 mintedSupply,
        string memory pluAlert,
        bool isActive
    ) {
        Building memory b = buildings[buildingId];
        return (
            b.name,
            b.pricePerToken,
            b.yieldPercentage,
            b.totalSupply,
            b.mintedSupply,
            b.pluAlert,
            b.isActive
        );
    }
    
    function getHolderStats(uint256 buildingId, address holder) external view returns (
        uint256 balance,
        uint256 investedAmount,
        uint256 pendingYield,
        uint256 annualYield
    ) {
        Building memory b = buildings[buildingId];
        balance = balanceOf(holder, buildingId);
        investedAmount = balance * b.pricePerToken;
        pendingYield = calculateYield(buildingId, holder);
        annualYield = (investedAmount * b.yieldPercentage) / BASIS_POINTS;
        
        return (balance, investedAmount, pendingYield, annualYield);
    }
}