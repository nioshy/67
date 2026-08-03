export class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.targetX = x;
        this.targetY = y;

        this.speed = 3.5;

        this.personality = null;

        this.moving = false;

        this.freezeTimer = 0;
        this.confusedTimer = 0;
        this.slowTimer = 0;
        this.slowMultiplier = 1;
        this.gearSpeedMultiplier = 1;
        this.ghostMode = false;

        this.image = new Image();
        this.image.src = "./assets/toilet.png";

        this.choosePersonality();
    }

    choosePersonality() {
        const personalities = [
            {
                name:
                    "😴 Sleepy Toilet",

                speed: 2.2,

                description:
                    "It's half asleep. This should be easy..."
            },

            {
                name:
                    "😐 Normal Toilet",

                speed: 3.0,

                description:
                    "A perfectly ordinary murderous toilet."
            },

            {
                name:
                    "😈 Angry Toilet",

                speed: 3.8,

                maxSpeed: 5,

                acceleration: 0.05,

                description:
                    "It's getting angrier and angrier... RUN!"
            },

            {
                name:
                    "🚀 Turbo Toilet",

                speed: 4,

                description:
                    "Maximum flush power. Good luck!"
            }
        ];

        this.personality =
            personalities[
                Math.floor(
                    Math.random() *
                    personalities.length
                )
            ];

        this.speed =
            this.personality.speed;

        this.resetEffects();
    }

    resetEffects() {
        this.freezeTimer = 0;
        this.confusedTimer = 0;
        this.slowTimer = 0;
        this.slowMultiplier = 1;
        this.gearSpeedMultiplier = 1;
        this.ghostMode = false;
    }

    freeze(duration = 3) {
        this.freezeTimer =
            Math.max(
                this.freezeTimer,
                duration
            );
    }

    confuse(duration = 1) {
        this.confusedTimer =
            Math.max(
                this.confusedTimer,
                duration
            );
    }

    slow(
        duration = 3,
        multiplier = 0.45
    ) {
        this.slowTimer =
            Math.max(
                this.slowTimer,
                duration
            );

        this.slowMultiplier =
            multiplier;
    }

    isHarmless() {
        return (
            this.confusedTimer > 0 ||
            this.freezeTimer > 0 ||
            this.slowTimer > 0
        );
    }

    update(
        deltaTime,
        maze,
        player,
        movementPaused = false
    ) {
        const wasConfused = this.confusedTimer > 0;
        const wasFrozen = this.freezeTimer > 0;

        this.confusedTimer = Math.max(
            0,
            this.confusedTimer - deltaTime
        );
        this.freezeTimer = Math.max(
            0,
            this.freezeTimer - deltaTime
        );

        if (this.slowTimer > 0) {
            this.slowTimer = Math.max(
                0,
                this.slowTimer - deltaTime
            );

            if (this.slowTimer === 0) {
                this.slowMultiplier = 1;
            }
        }

        /* Freeze and confusion stop movement, but every status
         * timer continues to count down concurrently. */
        if (wasConfused || wasFrozen || movementPaused) {
            return;
        }

        /*
         * Angry Toilet becomes
         * progressively faster.
         */
        if (
            this.personality?.name ===
            "😈 Angry Toilet"
        ) {
            this.speed =
                Math.min(
                    this.speed +
                        this.personality
                            .acceleration *
                        deltaTime,

                    this.personality
                        .maxSpeed
                );
        }

        if (this.ghostMode) {
            this.#advanceGhost(
                deltaTime,
                player
            );

            return;
        }

        if (this.moving) {
            this.#advance(
                deltaTime
            );

            return;
        }

        const nextStep =
            this.#findNextStep(
                maze,
                player
            );

        if (!nextStep) {
            return;
        }

        this.targetX =
            nextStep.x;

        this.targetY =
            nextStep.y;

        this.moving = true;
    }

    #advance(deltaTime) {
        const dx =
            this.targetX -
            this.x;

        const dy =
            this.targetY -
            this.y;

        const distance =
            Math.hypot(
                dx,
                dy
            );

        if (distance < 0.01) {
            this.x =
                this.targetX;

            this.y =
                this.targetY;

            this.moving =
                false;

            return;
        }

        const effectiveSpeed =
            this.speed *
            this.slowMultiplier *
            this.gearSpeedMultiplier;

        const movement =
            Math.min(
                effectiveSpeed *
                    deltaTime,

                distance
            );

        this.x +=
            (dx / distance) *
            movement;

        this.y +=
            (dy / distance) *
            movement;
    }

    #advanceGhost(deltaTime, player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.hypot(dx, dy);

        this.targetX = player.x;
        this.targetY = player.y;
        this.moving = distance >= 0.01;

        if (!this.moving) {
            return;
        }

        const movement = Math.min(
            this.speed *
                this.slowMultiplier *
                this.gearSpeedMultiplier *
                deltaTime,
            distance
        );

        this.x += dx / distance * movement;
        this.y += dy / distance * movement;
    }

    #findNextStep(
        maze,
        player
    ) {
        const startX =
            Math.round(this.x);

        const startY =
            Math.round(this.y);

        const targetX =
            Math.round(player.x);

        const targetY =
            Math.round(player.y);

        const queue = [
            {
                x: startX,
                y: startY
            }
        ];

        const visited =
            new Set([
                `${startX},${startY}`
            ]);

        const parent =
            new Map();

        const directions = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ];

        while (
            queue.length > 0
        ) {
            const current =
                queue.shift();

            if (
                current.x ===
                    targetX &&
                current.y ===
                    targetY
            ) {
                break;
            }

            for (
                const [
                    dx,
                    dy
                ]
                of directions
            ) {
                const nextX =
                    current.x + dx;

                const nextY =
                    current.y + dy;

                const key =
                    `${nextX},${nextY}`;

                if (
                    nextX < 0 ||
                    nextY < 0 ||
                    nextX >=
                        maze.width ||
                    nextY >=
                        maze.height
                ) {
                    continue;
                }

                if (
                    !maze.isFloor(
                        nextX,
                        nextY
                    )
                ) {
                    continue;
                }

                if (
                    visited.has(
                        key
                    )
                ) {
                    continue;
                }

                visited.add(
                    key
                );

                parent.set(
                    key,
                    current
                );

                queue.push({
                    x: nextX,
                    y: nextY
                });
            }
        }

        const targetKey =
            `${targetX},${targetY}`;

        if (
            targetX !== startX ||
            targetY !== startY
        ) {
            if (
                !parent.has(
                    targetKey
                )
            ) {
                return null;
            }
        }

        let step = {
            x: targetX,
            y: targetY
        };

        while (true) {
            const previous =
                parent.get(
                    `${step.x},${step.y}`
                );

            if (!previous) {
                return null;
            }

            if (
                previous.x ===
                    startX &&
                previous.y ===
                    startY
            ) {
                return step;
            }

            step =
                previous;
        }
    }
}
