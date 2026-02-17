import { MapEngine } from '../MapEngine';
import { ZoneType, ZoneData, BuildingType, BuildingData, BUILDING_SPECS, TradeContract } from '../types';

/**
 * EconomySystem
 * Manages tax collection, building maintenance, and trade contracts.
 * Runs periodically (e.g. every week/month).
 */
export class EconomySystem {
    // Tax Rates Multipliers by Level
    private static readonly TAX_RATE_BASE = 10; // $ per citizen/job
    private static readonly LEVEL_MULTIPLIERS: Record<number, number> = {
        1: 1.0,
        2: 2.5,
        3: 6.0,
        4: 15.0
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
        let tradeIncome = 0;

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
                maintenanceCost += specs.maintenance;
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
        });

        // 3. Apply to Player Wallet
        const totalIncome = residentialTax + commercialTax + industrialTax + tradeIncome;
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
                maintenance: 0
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
        map.stats.budget.maintenance = maintenanceCost;

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
