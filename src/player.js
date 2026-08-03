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
        this.pendingStepCount = 0;
        this.facing = 1;

        this.image = new Image();
        this.image.src = "./assets/kid.png";
    }

    resetEffects() {
        this.speed = this.baseSpeed;
        this.turboTimer = 0;
        this.pendingStepCount = 0;
    }

    activateTurbo(duration = 8) {
        this.turboTimer = duration;
        this.speed = this.baseSpeed * 1.5;
    }

    move(dx, dy, maze, maximumSteps = 1, canPassWalls = false) {
        if (this.moving) {
            return;
        }

        let nextX = Math.round(this.x);
        let nextY = Math.round(this.y);
        let movedSteps = 0;

        for (let step = 0; step < maximumSteps; step++) {
            const candidateX = nextX + dx;
            const candidateY = nextY + dy;

            const insideMaze =
                candidateX >= 0 &&
                candidateY >= 0 &&
                candidateX < maze.width &&
                candidateY < maze.height;

            if (!insideMaze || (!canPassWalls && !maze.isFloor(candidateX, candidateY))) {
                break;
            }

            nextX = candidateX;
            nextY = candidateY;
            movedSteps += 1;
        }

        if (movedSteps === 0) {
            return;
        }

        this.targetX = nextX;
        this.targetY = nextY;
        this.moving = true;
        this.pendingStepCount = movedSteps;

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
