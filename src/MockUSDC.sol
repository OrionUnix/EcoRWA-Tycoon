// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice Token de test pour EcoRWA Tycoon (Avalanche Fuji)
 *
 * ⚠️ SÉCURITÉ : mint() est restreint à onlyOwner.
 *    Les joueurs NE PEUVENT PAS se minter des tokens.
 *    La seule façon d'obtenir des USDC est via le Faucet (EcoRWAFaucet).
 */
contract MockUSDC is ERC20, Ownable {

    constructor() ERC20("USD Coin", "USDC") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 1e6); // 1M USDC initial pour le déploiement
    }
    
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    /**
     * @notice Seul le propriétaire (Admin) peut minter de nouveaux USDC.
     * @dev Utilisé pour alimenter le pool du Faucet ou le ParseCityVault.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
