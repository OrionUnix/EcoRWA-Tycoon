import * as PIXI from 'pixi.js';

// ═══════════════════════════════════════════════════════════
// ParticleSystem — Implémentation native PixiJS v8
// Remplace @pixi/particle-emitter (v7, incompatible PixiJS v8)
// Utilise de simples PIXI.Graphics animés via ticker
// ═══════════════════════════════════════════════════════════

interface Particle {
    gfx: PIXI.Graphics;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    alpha: number;
    scale: number;
}

export class ParticleSystem {
    private static particles: Particle[] = [];
    private static container: PIXI.Container | null = null;
    private static lastTime: number = Date.now();

    static init(container: PIXI.Container) {
        this.container = container;
        this.particles = [];
        this.lastTime = Date.now();
    }

    static update() {
        if (!this.container) return;

        const now = Date.now();
        const delta = (now - this.lastTime) * 0.001; // en secondes
        this.lastTime = now;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= delta;

            if (p.life <= 0) {
                // Particule morte : retirer du container et de la liste
                this.container.removeChild(p.gfx);
                p.gfx.destroy();
                this.particles.splice(i, 1);
                continue;
            }

            // Progression de la vie (1 = début, 0 = fin)
            const t = p.life / p.maxLife;

            // Mouvement
            p.gfx.x += p.vx * delta;
            p.gfx.y += p.vy * delta;

            // Décélération (friction simple)
            p.vx *= 0.92;
            p.vy *= 0.92;

            // Alpha : fondu de 0.8 → 0
            p.gfx.alpha = 0.8 * t;

            // Scale : grandit légèrement
            const s = (0.3 + (1 - t) * 0.7) * p.scale;
            p.gfx.scale.set(s);
        }
    }

    /**
     * Effet poussière lors de la pose d'un bâtiment/route
     */
    static spawnPlacementDust(x: number, y: number) {
        if (!this.container) return;

        const COUNT = 12;

        for (let i = 0; i < COUNT; i++) {
            const angle = (Math.PI * 2 * i) / COUNT + (Math.random() - 0.5) * 0.5;
            const speed = 40 + Math.random() * 80;

            // Cercle blanc/gris simple
            const gfx = new PIXI.Graphics();
            gfx.circle(0, 0, 4 + Math.random() * 4);
            gfx.fill({ color: Math.random() > 0.5 ? 0xffffff : 0xaaaaaa, alpha: 0.8 });

            gfx.x = x + (Math.random() - 0.5) * 16;
            gfx.y = y + (Math.random() - 0.5) * 8;
            gfx.alpha = 0.8;

            this.container.addChild(gfx);

            const life = 0.4 + Math.random() * 0.5;

            this.particles.push({
                gfx,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed * 0.5, // Aplati pour rendu iso
                life,
                maxLife: life,
                alpha: 0.8,
                scale: 1,
            });
        }
    }

    /**
     * Nettoie toutes les particules (ex: lors d'un reset de carte)
     */
    static clear() {
        if (this.container) {
            for (const p of this.particles) {
                this.container.removeChild(p.gfx);
                p.gfx.destroy();
            }
        }
        this.particles = [];
    }
}
