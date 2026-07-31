export class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.targetX = x;
        this.targetY = y;

        this.speed = 99;
        this.moving = false;

        this.image = new Image();
        this.image.src = "./assets/toilet.png";
    }

    update(deltaTime, maze, player) {
        if (this.moving) {
            this.#advance(deltaTime);
            return;
        }

        const nextStep = this.#findNextStep(
            maze,
            player
        );

        if (!nextStep) {
            return;
        }

        this.targetX = nextStep.x;
        this.targetY = nextStep.y;
        this.moving = true;
    }

    #advance(deltaTime) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;

        const distance = Math.hypot(dx, dy);

        if (distance < 0.01) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.moving = false;
            return;
        }

        const movement = Math.min(
            this.speed * deltaTime,
            distance
        );

        this.x += (dx / distance) * movement;
        this.y += (dy / distance) * movement;
    }

    #findNextStep(maze, player) {
        const startX = Math.round(this.x);
        const startY = Math.round(this.y);

        const targetX = Math.round(player.x);
        const targetY = Math.round(player.y);

        const queue = [
            {
                x: startX,
                y: startY
            }
        ];

        const visited = new Set([
            `${startX},${startY}`
        ]);

        const parent = new Map();

        const directions = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1]
        ];

        while (queue.length > 0) {
            const current = queue.shift();

            if (
                current.x === targetX &&
                current.y === targetY
            ) {
                break;
            }

            for (const [dx, dy] of directions) {
                const nextX = current.x + dx;
                const nextY = current.y + dy;
                const key = `${nextX},${nextY}`;

                if (
                    nextX < 0 ||
                    nextY < 0 ||
                    nextX >= maze.width ||
                    nextY >= maze.height
                ) {
                    continue;
                }

                if (!maze.isFloor(nextX, nextY)) {
                    continue;
                }

                if (visited.has(key)) {
                    continue;
                }

                visited.add(key);

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
            if (!parent.has(targetKey)) {
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
                previous.x === startX &&
                previous.y === startY
            ) {
                return step;
            }

            step = previous;
        }
    }
}