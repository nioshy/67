export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.targetX = x;
        this.targetY = y;

        this.baseSpeed = 7;
        this.speed = this.baseSpeed;

        this.turboTimer = 0;

        this.moving = false;
        this.facing = 1;

        this.image = new Image();
        this.image.src = "./assets/kid.png";
    }

    resetEffects() {
        this.speed = this.baseSpeed;
        this.turboTimer = 0;
    }

    activateTurbo(duration = 8) {
        this.turboTimer = duration;
        this.speed = 10.5;
    }

    move(dx, dy, maze) {
        if (this.moving) {
            return;
        }

        const nextX =
            Math.round(this.x) + dx;

        const nextY =
            Math.round(this.y) + dy;

        if (!maze.isFloor(nextX, nextY)) {
            return;
        }

        this.targetX = nextX;
        this.targetY = nextY;
        this.moving = true;

        if (dx !== 0) {
            this.facing = dx;
        }
    }

    update(deltaTime) {
        if (this.turboTimer > 0) {
            this.turboTimer -= deltaTime;

            if (this.turboTimer <= 0) {
                this.turboTimer = 0;
                this.speed = this.baseSpeed;
            }
        }

        if (!this.moving) {
            return;
        }

        const dx =
            this.targetX - this.x;

        const dy =
            this.targetY - this.y;

        const distance =
            Math.hypot(dx, dy);

        if (distance < 0.01) {
            this.x = this.targetX;
            this.y = this.targetY;

            this.moving = false;

            return;
        }

        const movement =
            Math.min(
                this.speed * deltaTime,
                distance
            );

        this.x +=
            (dx / distance) *
            movement;

        this.y +=
            (dy / distance) *
            movement;
    }
}