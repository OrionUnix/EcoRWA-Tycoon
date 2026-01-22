// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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
    
    event BuildingCreated(uint256 indexed buildingId, string name, uint256 price, uint256 supply);
    event BuildingMinted(address indexed buyer, uint256 indexed buildingId, uint256 amount, uint256 totalCost);
    event YieldClaimed(address indexed holder, uint256 indexed buildingId, uint256 yieldAmount);
    event PluAlertUpdated(uint256 indexed buildingId, string newAlert);

    constructor(address _usdc) 
        ERC1155("https://api.parsecity.io/metadata/{id}.json") 
        Ownable(msg.sender) 
    {
        usdc = IERC20(_usdc);
        
        _setupBuilding(LOFT_SAINT_GERMAIN, "Loft Saint-Germain", 150 * 1e6, 400, 1000, unicode"Zone protégée, travaux interdits.");
        _setupBuilding(LE_BISTROT_CENTRAL, "Le Bistrot Central", 100 * 1e6, 800, 2000, unicode"Travaux de rue en 2026.");
        _setupBuilding(ECO_TOWER_2030, "Eco-Tower 2030", 250 * 1e6, 600, 500, unicode"Neuf. Exonération taxe foncière.");
    }

    function createBuilding(
        uint256 buildingId, 
        string calldata _name,
        uint256 _pricePerToken,
        uint256 _yieldPercentage,
        uint256 _totalSupply,
        string calldata _pluAlert
    ) external onlyOwner {
        require(buildings[buildingId].totalSupply == 0, "ID deja utilise");
        
        buildings[buildingId] = Building({
            name: _name,
            pricePerToken: _pricePerToken,
            yieldPercentage: _yieldPercentage,
            totalSupply: _totalSupply,
            mintedSupply: 0,
            pluAlert: _pluAlert,
            isActive: true
        });

        emit BuildingCreated(buildingId, _name, _pricePerToken, _totalSupply);
    }

    // Changé PLU -> Plu pour le Linter
    function updatePluAlert(uint256 buildingId, string calldata newAlert) external onlyOwner {
        buildings[buildingId].pluAlert = newAlert;
        emit PluAlertUpdated(buildingId, newAlert);
    }
    
    function toggleBuildingActive(uint256 buildingId) external onlyOwner {
        buildings[buildingId].isActive = !buildings[buildingId].isActive;
    }
    
    function fundYieldPool(uint256 amount) external onlyOwner {
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfert echoue");
    }
    
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(usdc.transfer(owner(), balance), "Retrait echoue");
    }

    function mintBuilding(uint256 buildingId, uint256 amount) external nonReentrant {
        Building storage building = buildings[buildingId];
        require(building.isActive, "Batiment non disponible");
        require(amount > 0, "Montant invalide");
        require(building.mintedSupply + amount <= building.totalSupply, "Plus de stock");
        
        uint256 totalCost = building.pricePerToken * amount;
        require(usdc.transferFrom(msg.sender, address(this), totalCost), "Paiement USDC echoue");
        
        building.mintedSupply += amount;
        lastClaimTime[buildingId][msg.sender] = block.timestamp;
        _mint(msg.sender, buildingId, amount, "");
        
        emit BuildingMinted(msg.sender, buildingId, amount, totalCost);
    }
    
    function claimYield(uint256 buildingId) external nonReentrant {
        uint256 yieldAmount = calculateYield(buildingId, msg.sender);
        require(yieldAmount > 0, "Rien a collecter");
        require(usdc.balanceOf(address(this)) >= yieldAmount, "Reserve USDC vide");
        
        lastClaimTime[buildingId][msg.sender] = block.timestamp;
        require(usdc.transfer(msg.sender, yieldAmount), "Transfert yield echoue");
        
        emit YieldClaimed(msg.sender, buildingId, yieldAmount);
    }

    function calculateYield(uint256 buildingId, address holder) public view returns (uint256) {
        Building memory b = buildings[buildingId];
        uint256 balance = balanceOf(holder, buildingId);
        if (balance == 0 || lastClaimTime[buildingId][holder] == 0) return 0;
        
        uint256 timeHeld = block.timestamp - lastClaimTime[buildingId][holder];
        uint256 investedValue = balance * b.pricePerToken;
        return (investedValue * b.yieldPercentage * timeHeld) / (BASIS_POINTS * SECONDS_PER_YEAR);
    }

    function getBuildingInfo(uint256 buildingId) external view returns (
        string memory name, uint256 price, uint256 yield, uint256 supply, uint256 minted, string memory plu, bool active
    ) {
        Building memory b = buildings[buildingId];
        return (b.name, b.pricePerToken, b.yieldPercentage, b.totalSupply, b.mintedSupply, b.pluAlert, b.isActive);
    }

    function _setupBuilding(uint256 id, string memory _n, uint256 _p, uint256 _y, uint256 _s, string memory _plu) internal {
        buildings[id] = Building({
            name: _n, pricePerToken: _p, yieldPercentage: _y, totalSupply: _s, mintedSupply: 0, pluAlert: _plu, isActive: true
        });
    }
}