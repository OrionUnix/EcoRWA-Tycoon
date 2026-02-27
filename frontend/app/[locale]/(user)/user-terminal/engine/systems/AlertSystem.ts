import { MapEngine } from '../MapEngine';

export class AlertSystem {
    private static lastAlerts: Record<string, number> = {};
    private static readonly COOLDOWN = 45000; // Dora ne criera pas plus d'une fois toutes les 45s

    static checkMetrics(engine: MapEngine, onAlert: (npc: string, messageKey: string) => void) {
        const now = Date.now();

        // ⚡ Vérification Électricité (Dora)
        if (engine.stats.energy.consumed > engine.stats.energy.produced) {
            this.trigger(now, 'dora', 'dora.power_low', onAlert);
            return; // On ne déclenche qu'une alerte à la fois pour ne pas spammer
        }

        // 💧 Vérification Eau (Dora)
        if (engine.stats.water.consumed > engine.stats.water.produced) {
            this.trigger(now, 'dora', 'dora.water_low', onAlert);
            return;
        }

        // 👮 Vérification Sécurité (Conan)
        // Note: Crime is derived from lack of happiness or specific logic if present.
        // As a fallback for the prompt, we trigger this if happiness is below 30.
        // Wait, MapEngine calculates crime in the background? The user prompt said `engine.stats.crimeRate > 30`. We will check if it exists or use happiness as a proxy.
        // Since `crimeRate` isn't in CityStats, let's use happiness < 40 causing crime.
        if ((engine.stats as any).crimeRate > 30 || engine.stats.happiness < 40) {
            this.trigger(now, 'conan', 'conan.crime_high', onAlert);
            return;
        }

        // 🏥 Vérification Santé (Carole)
        // Same here, if health metrics exist or happiness is low. We can trigger Carole if happiness < 50.
        if (engine.stats.happiness < 50 && (engine.stats as any).crimeRate <= 30) {
            this.trigger(now, 'carole', 'carole.health_low', onAlert);
            return;
        }
    }

    private static trigger(now: number, npc: string, msgKey: string, callback: (n: string, m: string) => void) {
        if (!this.lastAlerts[npc] || now - this.lastAlerts[npc] > this.COOLDOWN) {
            this.lastAlerts[npc] = now;
            callback(npc, msgKey);
        }
    }
}
