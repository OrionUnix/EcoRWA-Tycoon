// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ParseCityVault is ERC1155, Ownable, ReentrancyGuard {
    
    struct Building {
        string name;
        uint256 pricePerToken;
        uint256 yieldPercentage;
        uint256 totalSupply;
        uint256 mintedSupply;
        string pluAlert;
        bool isActive;
    }
    
    IERC20 public usdc;
    mapping(uint256 => Building) public buildings;
    mapping(uint256 => mapping(address => uint256)) public lastClaimTime;
    
    uint256 public constant LOFT_SAINT_GERMAIN = 1;
    uint256 public constant LE_BISTROT_CENTRAL = 2;
    uint256 public constant ECO_TOWER_2030 = 3;
    
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant SECONDS_PER_YEAR = 365 days;
    
    event BuildingMinted(address indexed buyer, uint256 indexed buildingId, uint256 amount, uint256 totalCost);
    event YieldClaimed(address indexed holder, uint256 indexed buildingId, uint256 yieldAmount);
    event PLUAlertUpdated(uint256 indexed buildingId, string newAlert);
    
    constructor(address _usdc) ERC1155("https://api.parsecity.io/metadata/{id}.json") Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        
        buildings[LOFT_SAINT_GERMAIN] = Building({
            name: "Loft Saint-Germain",
            pricePerToken: 150 * 1e6,
            yieldPercentage: 400,
            totalSupply: 1000,
            mintedSupply: 0,
            pluAlert: unicode"Zone protégée, travaux interdits. Stabilité max.",
            isActive: true
        });
        
        buildings[LE_BISTROT_CENTRAL] = Building({
            name: "Le Bistrot Central",
            pricePerToken: 100 * 1e6,
            yieldPercentage: 800,
            totalSupply: 2000,
            mintedSupply: 0,
            pluAlert: unicode"Travaux de rue en 2026. Risque de vacance temporaire.",
            isActive: true
        });
        
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
    
    function mintBuilding(uint256 buildingId, uint256 amount) external nonReentrant {
        Building storage building = buildings[buildingId];
        
        require(building.isActive, "Building not active");
        require(amount > 0, "Amount must be > 0");
        require(building.mintedSupply + amount <= building.totalSupply, "Exceeds total supply");
        
        uint256 totalCost = building.pricePerToken * amount;
        require(usdc.transferFrom(msg.sender, address(this), totalCost), "USDC transfer failed");
        
        _mint(msg.sender, buildingId, amount, "");
        building.mintedSupply += amount;
        lastClaimTime[buildingId][msg.sender] = block.timestamp;
        
        emit BuildingMinted(msg.sender, buildingId, amount, totalCost);
    }
    
    function calculateYield(uint256 buildingId, address holder) public view returns (uint256) {
        Building memory building = buildings[buildingId];
        uint256 balance = balanceOf(holder, buildingId);
        
        if (balance == 0) return 0;
        
        uint256 timeHeld = block.timestamp - lastClaimTime[buildingId][holder];
        uint256 investedAmount = balance * building.pricePerToken;
        
        return (investedAmount * building.yieldPercentage * timeHeld) / (BASIS_POINTS * SECONDS_PER_YEAR);
    }
    
    function claimYield(uint256 buildingId) external nonReentrant {
        uint256 yieldAmount = calculateYield(buildingId, msg.sender);
        
        require(yieldAmount > 0, "No yield to claim");
        require(usdc.balanceOf(address(this)) >= yieldAmount, "Insufficient contract USDC balance");
        
        lastClaimTime[buildingId][msg.sender] = block.timestamp;
        require(usdc.transfer(msg.sender, yieldAmount), "Yield transfer failed");
        
        emit YieldClaimed(msg.sender, buildingId, yieldAmount);
    }
    
    function updatePLUAlert(uint256 buildingId, string calldata newAlert) external onlyOwner {
        buildings[buildingId].pluAlert = newAlert;
        emit PLUAlertUpdated(buildingId, newAlert);
    }
    
    function toggleBuildingActive(uint256 buildingId) external onlyOwner {
        buildings[buildingId].isActive = !buildings[buildingId].isActive;
    }
    
    function fundYieldPool(uint256 amount) external onlyOwner {
        require(usdc.transferFrom(msg.sender, address(this), amount), "Funding failed");
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(usdc.transfer(owner(), balance), "Withdrawal failed");
    }
    
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
        return (b.name, b.pricePerToken, b.yieldPercentage, b.totalSupply, b.mintedSupply, b.pluAlert, b.isActive);
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