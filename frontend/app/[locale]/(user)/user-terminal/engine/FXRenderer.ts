import * as PIXI from 'pixi.js';

export class FXRenderer {
    // On garde la texture en mémoire pour ne la générer qu'une seule fois !
    private static smokeTexture: PIXI.Texture | null = null;

    /**
     * Génère une texture de fumée douce (Dégradé Radial)
     */
    private static getSmokeTexture(): PIXI.Texture {
        if (this.smokeTexture) return this.smokeTexture;

        // Création d'un mini-canvas en mémoire (64x64)
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;

        // Création d'un dégradé radial (blanc au centre, transparent sur les bords)
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)'); // Centre dense
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)'); // Milieu flou
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); // Bord transparent

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        // Transformation en texture PixiJS v8
        this.smokeTexture = PIXI.Texture.from(canvas);
        return this.smokeTexture;
    }

    /**
     * Joue l'animation de construction avec des particules douces
     */
    static playConstructionDust(
        parentContainer: PIXI.Container,
        x: number,
        y: number,
        zIndex: number
    ) {
        const dustContainer = new PIXI.Container();
        dustContainer.x = x;
        dustContainer.y = y - 10;
        dustContainer.zIndex = zIndex + 100;
        dustContainer.sortableChildren = false;

        parentContainer.addChild(dustContainer);

        const numParticles = 8;
        const particles: { sprite: PIXI.Sprite, vx: number, vy: number, life: number, maxLife: number, initialAlpha: number }[] = [];

        const texture = this.getSmokeTexture();

        for (let i = 0; i < numParticles; i++) {
            // ON UTILISE UN SPRITE AU LIEU D'UN GRAPHICS !
            const sprite = new PIXI.Sprite(texture);
            sprite.anchor.set(0.5); // Centrer la particule
            sprite.scale.set(0.2 + Math.random() * 0.3); // Petites au début
            sprite.alpha = 0;

            dustContainer.addChild(sprite);

            const angle = Math.random() * Math.PI * 2;
            const speed = 0.2 + Math.random() * 0.5;

            particles.push({
                sprite,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.5, // Monte doucement
                life: 0,
                maxLife: 30 + Math.random() * 20,
                initialAlpha: 0.5 + Math.random() * 0.5
            });
        }

        const update = () => {
            let allDead = true;

            for (const p of particles) {
                if (p.life < p.maxLife) {
                    allDead = false;
                    p.life++;
                    const progress = p.life / p.maxLife;

                    p.sprite.x += p.vx;
                    p.sprite.y += p.vy;
                    p.vy *= 0.95; // Ralentissement (friction)

                    // La fumée grossit en se dissipant
                    p.sprite.scale.set(p.sprite.scale.x + 0.02);

                    // Fade in / Fade out très doux
                    if (progress < 0.2) {
                        p.sprite.alpha = p.initialAlpha * (progress / 0.2);
                    } else {
                        p.sprite.alpha = p.initialAlpha * (1 - Math.pow((progress - 0.2) / 0.8, 2));
                    }
                } else if (p.sprite.alpha > 0) {
                    p.sprite.alpha = 0;
                }
            }

            if (allDead) {
                PIXI.Ticker.shared.remove(update);
                if (!dustContainer.destroyed) {
                    if (dustContainer.parent) {
                        dustContainer.parent.removeChild(dustContainer);
                    }
                    dustContainer.destroy({ children: true });
                }
            }
        };

        PIXI.Ticker.shared.add(update);
    }
}