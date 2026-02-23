import { MapEngine } from '../MapEngine';
import { ZoneType, ZoneData, BuildingType, BuildingData, BUILDING_SPECS, TradeContract } from '../types';

/**
 * EconomySystem
 * Manages tax collection, building maintenance, and trade contracts.
 * Runs periodically (e.g. every week/month).
 */
export class EconomySystem {
    // Tax Rates Multipliers by Level
    private static readonly TAX_RATE_BASE = 10; // $ per citizen/job (Golden Ratio: 1 Inhabitant = 10$/h)
    private static readonly LEVEL_MULTIPLIERS: Record<number, number> = {
        1: 1.0,
        2: 1.0, // Multiplier is 1.0 because the population scale naturally multiplies the tax (10 citizens = 10 * 10 = 100$)
        3: 1.0,
        4: 1.0
    };

    // ✅ NOUVEAU: Taux d'exportation de base par cycle d'économie pour les industries extractives

    public static readonly RESOURCE_EXPORT_RATES: Partial<Record<BuildingType, number>> = {
        [BuildingType.MINE]: 1400,     // Maintenance is 500, Margin: +900/level
        [BuildingType.OIL_RIG]: 2500,  // Maintenance is 1000, Margin: +1500/level
        [BuildingType.OIL_PUMP]: 1500, // Maintenance is 800, Margin: +700/level
        [BuildingType.LUMBER_HUT]: 500, // Maintenance is 200, Margin: +300
        [BuildingType.FISHERMAN]: 300,  // Maintenance is 100, Margin: +200
        [BuildingType.HUNTER_HUT]: 300
    };

    /**
     * Main update loop for economy
     * @param map The game map and state
     */
    public static update(map: MapEngine) {
        let residentialTax = 0;
        let commercialTax = 0;
        let industrialTax = 0;
        let maintenanceCost = 0;
        let maintenanceDetail: Record<string, number> = {};
        let tradeIncome = 0;
        let exportIncome = 0; // ✅ NOUVEAU: Revenus d'exportation minière/agricole

        // 1. Calculate Zone Taxes (Residential, Commercial, Industrial)
        map.zoningLayer.forEach((zone, index) => {
            if (!zone) return;

            const multiplier = this.LEVEL_MULTIPLIERS[zone.level] || 1;
            const amount = Math.floor(zone.population * this.TAX_RATE_BASE * multiplier);

            if (zone.type === ZoneType.RESIDENTIAL) {
                residentialTax += amount;
            } else if (zone.type === ZoneType.COMMERCIAL) {
                commercialTax += amount;
            } else if (zone.type === ZoneType.INDUSTRIAL) {
                industrialTax += amount;
            }
        });

        // 2. Calculate Building Maintenance & Trade Contracts
        map.buildingLayer.forEach((building, index) => {
            if (!building) return;

            const specs = BUILDING_SPECS[building.type];
            if (!specs) return;

            // Maintenance
            if (specs.maintenance) {
                // Feature : Permet de désactiver temporairement un service/bâtiment 
                // Pour l'instant on facture tout ce qui est actif
                if (building.state !== 'CONSTRUCTION') {
                    maintenanceCost += specs.maintenance;

                    const cat = specs.category as string;
                    if (!maintenanceDetail[cat]) maintenanceDetail[cat] = 0;
                    maintenanceDetail[cat] += specs.maintenance;
                }
            }

            // Trade Contracts (Market)
            if (building.type === BuildingType.FOOD_MARKET && building.activeContracts) {
                building.activeContracts.forEach(contract => {
                    if (contract.active) {
                        const resourceKey = contract.resource.toLowerCase();
                        const currentStock = (map.resources as any)[resourceKey] || 0;

                        if (currentStock >= contract.amountPerTick) {
                            // Execute Trade
                            (map.resources as any)[resourceKey] -= contract.amountPerTick;
                            const revenue = contract.amountPerTick * contract.pricePerUnit;
                            tradeIncome += revenue;
                            // console.log(`💰 Trade Executed: Sold ${contract.amountPerTick} ${contract.resource} for ${revenue}$`);
                        }
                    }
                });
            }

            // ✅ NOUVEAU: Exportations directes (Mines, Puits, Bûcheron...)
            if (building.state === 'ACTIVE') {
                const exportRate = EconomySystem.RESOURCE_EXPORT_RATES[building.type];
                if (exportRate) {
                    // Le niveau du bâtiment multiplie le revenu généré
                    const levelMultiplier = building.level || 1;

                    // Si c'est une mine spécifique, on pourrait pondérer, 
                    // mais pour l'instant on se fiera au niveau et au type de base.
                    exportIncome += exportRate * levelMultiplier;
                }
            }
        });

        // 3. Apply to Player Wallet
        const totalIncome = residentialTax + commercialTax + industrialTax + tradeIncome + exportIncome;
        const totalExpenses = maintenanceCost;
        const netProfit = totalIncome - totalExpenses;

        map.resources.money += netProfit;

        // 4. Update Budget Stats for UI
        if (!map.stats.budget) {
            map.stats.budget = {
                income: 0,
                expenses: 0,
                taxIncome: { residential: 0, commercial: 0, industrial: 0 },
                tradeIncome: 0,
                exportIncome: 0, // ✅ NOUVEAU
                maintenance: 0,
                maintenanceDetail: {}
            };
        }

        map.stats.budget.income = totalIncome;
        map.stats.budget.expenses = totalExpenses;
        map.stats.budget.taxIncome = {
            residential: residentialTax,
            commercial: commercialTax,
            industrial: industrialTax
        };
        map.stats.budget.tradeIncome = tradeIncome;
        map.stats.budget.exportIncome = exportIncome; // ✅ NOUVEAU
        map.stats.budget.maintenance = maintenanceCost;
        map.stats.budget.maintenanceDetail = maintenanceDetail;

        console.log(`💵 Economy Tick: Profit ${netProfit} (Inc: ${totalIncome}, Exp: ${totalExpenses})`);
    }

    /**
     * Estimate tax for a specific zone (used in Tooltip)
     */
    public static getTaxEstimate(zone: ZoneData): number {
        const multiplier = this.LEVEL_MULTIPLIERS[zone.level] || 1;
        return Math.floor(zone.population * this.TAX_RATE_BASE * multiplier);
    }
}
