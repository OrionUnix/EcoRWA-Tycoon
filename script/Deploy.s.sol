// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Utilisation des imports nommés pour satisfaire le Linter Foundry
import {Script, console} from "forge-std/Script.sol";
import {ParseCityVault} from "../src/ParseCityVault.sol";

contract DeployScript is Script {
    function run() external {
        // Récupération de la clé privée depuis les variables d'environnement (recommandé)
        // ou utilisation de vm.startBroadcast() pour signer avec le compte par défaut de Forge
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Adresse du token USDC sur Avalanche Fuji
        address usdc = 0x91d5F6B2458ea9f060EDAD50794cc79E7Ec30cE0;
        
        // Déploiement du contrat
        ParseCityVault vault = new ParseCityVault(usdc);
        
        console.log("-----------------------------------------");
        console.log("ParseCityVault deployed at:", address(vault));
        console.log("Owner address:", msg.sender);
        console.log("-----------------------------------------");
        
        vm.stopBroadcast();
    }
}