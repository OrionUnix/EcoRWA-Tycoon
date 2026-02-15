import * as PIXI from 'pixi.js';
import * as particles from '@pixi/particle-emitter';

export class ParticleSystem {
    private static emitters: particles.Emitter[] = [];
    private static container: PIXI.Container | null = null;
    private static lastTime: number = Date.now();

    static init(container: PIXI.Container) {
        this.container = container;
        this.emitters = [];
        this.lastTime = Date.now();
    }

    static update() {
        if (!this.container) return;

        const now = Date.now();
        const delta = (now - this.lastTime) * 0.001;
        this.lastTime = now;

        for (let i = this.emitters.length - 1; i >= 0; i--) {
            this.emitters[i].update(delta);
            // Nettoyage automatique si fini
            // Note: @pixi/particle-emitter ne détruit pas auto, il faut check
        }
    }

    static spawnPlacementDust(x: number, y: number) {
        if (!this.container) return;

        const config: particles.EmitterConfigV3 = {
            lifetime: { min: 0.5, max: 1.0 },
            frequency: 0.05,
            spawnChance: 1,
            particlesPerWave: 10,
            emitterLifetime: 0.2,
            maxParticles: 50,
            pos: { x: 0, y: 0 },
            addAtBack: false,
            behaviors: [
                {
                    type: 'alpha',
                    config: {
                        alpha: {
                            list: [
                                { value: 0.8, time: 0 },
                                { value: 0, time: 1 }
                            ],
                        },
                    }
                },
                {
                    type: 'scale',
                    config: {
                        scale: {
                            list: [
                                { value: 0.5, time: 0 },
                                { value: 1.5, time: 1 }
                            ],
                        },
                    }
                },
                {
                    type: 'color',
                    config: {
                        color: {
                            list: [
                                { value: "ffffff", time: 0 },
                                { value: "888888", time: 1 }
                            ],
                        },
                    }
                },
                {
                    type: 'moveSpeed',
                    config: {
                        speed: {
                            list: [
                                { value: 100, time: 0 },
                                { value: 10, time: 1 }
                            ],
                            isStepped: false
                        },
                    }
                }
            ]
        };

        // Création simple d'une texture de particule (rond blanc flou)
        // Idéalement on la mettrait en cache
        const texture = PIXI.Texture.WHITE;

        const emitter = new particles.Emitter(this.container as any, particles.upgradeConfig(config, [texture]));
        emitter.updateOwnerPos(x, y);
        emitter.playOnceAndDestroy(); // Helper pratique si dispo, sinon on gère manuel

        // On ne l'ajoute pas à la liste update si playOnceAndDestroy gère tout,
        // mais @pixi/particle-emitter nécessite souvent un update manuel.
        // On va assumer qu'il faut l'update.
        this.emitters.push(emitter);

        // Cleanup manuel après lifetime
        setTimeout(() => {
            emitter.destroy();
            const idx = this.emitters.indexOf(emitter);
            if (idx > -1) this.emitters.splice(idx, 1);
        }, 1000);
    }
}
