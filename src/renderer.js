export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx =
            canvas.getContext("2d");

        this.zoom = 1.15;
        this.targetZoom = 1.15;

        this.cameraX =
            canvas.width / 2;

        this.cameraY =
            canvas.height / 2;

        this.shakeStrength = 0;
        this.shakeEndTime = 0;

        this.defeatImage =
            new Image();

        this.defeatImage.src =
            "./assets/defeat.png";

        this.defeatAnimation = {
            active: false,
            startTime: 0,
            duration: 1500
        };
    }

    triggerShake(
        strength = 12,
        duration = 0.45
    ) {
        this.shakeStrength =
            strength;

        this.shakeEndTime =
            performance.now() +
            duration * 1000;
    }

    startDefeatAnimation() {
        this.defeatAnimation.active =
            true;

        this.defeatAnimation.startTime =
            performance.now();
    }

    stopDefeatAnimation() {
        this.defeatAnimation.active =
            false;
    }

    render(game) {
        const ctx =
            this.ctx;

        ctx.setTransform(
            1,
            0,
            0,
            1,
            0,
            0
        );

        ctx.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        this.updateCamera(game);
        this.updateZoom(game);

        const shake =
            this.getShakeOffset();

        const ox =
            this.canvas.width / 2 -
            this.cameraX *
                this.zoom +
            shake.x;

        const oy =
            this.canvas.height / 2 -
            this.cameraY *
                this.zoom +
            shake.y;

        ctx.save();

        ctx.setTransform(
            this.zoom,
            0,
            0,
            this.zoom,
            ox,
            oy
        );

        this.drawFloor(game);
        this.drawWalls(game);
        this.drawExit(game);

        this.drawCarrot(game);
        this.drawBananas(game);

        this.drawPlayer(game);
        this.drawEnemy(game);

        ctx.restore();

        this.drawDarkEdges();
        this.drawDefeatAnimation();
    }

    updateCamera(game) {
        if (!game.player) {
            return;
        }

        const tw =
            this.canvas.width /
            game.maze.width;

        const th =
            this.canvas.height /
            game.maze.height;

        const tx =
            (game.player.x + 0.5) *
            tw;

        const ty =
            (game.player.y + 0.5) *
            th;

        this.cameraX +=
            (tx - this.cameraX) *
            0.1;

        this.cameraY +=
            (ty - this.cameraY) *
            0.1;

        const hw =
            this.canvas.width /
            this.zoom /
            2;

        const hh =
            this.canvas.height /
            this.zoom /
            2;

        this.cameraX =
            Math.max(
                hw,
                Math.min(
                    this.canvas.width -
                        hw,

                    this.cameraX
                )
            );

        this.cameraY =
            Math.max(
                hh,
                Math.min(
                    this.canvas.height -
                        hh,

                    this.cameraY
                )
            );
    }

    updateZoom(game) {
        if (
            !game.player ||
            !game.enemy
        ) {
            return;
        }

        const d =
            Math.hypot(
                game.player.x -
                    game.enemy.x,

                game.player.y -
                    game.enemy.y
            );

        this.targetZoom =
            d > 8
                ? 1.1
                : d > 5
                  ? 1.18
                  : d > 3
                    ? 1.28
                    : 1.4;

        this.zoom +=
            (
                this.targetZoom -
                this.zoom
            ) *
            0.06;
    }

    getShakeOffset() {
        if (
            performance.now() >
            this.shakeEndTime
        ) {
            this.shakeStrength = 0;

            return {
                x: 0,
                y: 0
            };
        }

        return {
            x:
                (
                    Math.random() *
                        2 -
                    1
                ) *
                this.shakeStrength,

            y:
                (
                    Math.random() *
                        2 -
                    1
                ) *
                this.shakeStrength
        };
    }

    tile(
        game,
        x,
        y
    ) {
        return {
            x:
                x *
                this.canvas.width /
                game.maze.width,

            y:
                y *
                this.canvas.height /
                game.maze.height,

            w:
                this.canvas.width /
                game.maze.width,

            h:
                this.canvas.height /
                game.maze.height
        };
    }

    drawFloor(game) {
        this.ctx.fillStyle =
            "#151414";

        this.ctx.fillRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        for (
            let y = 0;
            y < game.maze.height;
            y++
        ) {
            for (
                let x = 0;
                x < game.maze.width;
                x++
            ) {
                if (
                    game.maze
                        .grid[y][x]
                ) {
                    continue;
                }

                const t =
                    this.tile(
                        game,
                        x,
                        y
                    );

                const g =
                    this.ctx
                        .createLinearGradient(
                            t.x,
                            t.y,
                            t.x,
                            t.y + t.h
                        );

                g.addColorStop(
                    0,
                    "#3b332a"
                );

                g.addColorStop(
                    1,
                    "#262019"
                );

                this.ctx.fillStyle =
                    g;

                this.ctx.fillRect(
                    t.x,
                    t.y,
                    t.w + 1,
                    t.h + 1
                );
            }
        }
    }

    drawWalls(game) {
        for (
            let y = 0;
            y < game.maze.height;
            y++
        ) {
            for (
                let x = 0;
                x < game.maze.width;
                x++
            ) {
                if (
                    !game.maze
                        .grid[y][x]
                ) {
                    continue;
                }

                const t =
                    this.tile(
                        game,
                        x,
                        y
                    );

                const g =
                    this.ctx
                        .createLinearGradient(
                            t.x,
                            t.y,
                            t.x,
                            t.y + t.h
                        );

                g.addColorStop(
                    0,
                    "#89929d"
                );

                g.addColorStop(
                    0.2,
                    "#606b77"
                );

                g.addColorStop(
                    1,
                    "#252d36"
                );

                this.ctx.fillStyle =
                    g;

                this.ctx.fillRect(
                    t.x,
                    t.y,
                    t.w + 1,
                    t.h + 1
                );

                this.ctx.fillStyle =
                    "rgba(255,255,255,.17)";

                this.ctx.fillRect(
                    t.x + 3,
                    t.y + 3,
                    t.w - 6,
                    4
                );

                this.ctx.strokeStyle =
                    "#151b21";

                this.ctx.lineWidth = 2;

                this.ctx.strokeRect(
                    t.x + 1,
                    t.y + 1,
                    t.w - 2,
                    t.h - 2
                );
            }
        }
    }

    drawExit(game) {
        if (!game.exit) {
            return;
        }

        const t =
            this.tile(
                game,
                game.exit.x,
                game.exit.y
            );

        const p =
            0.5 +
            0.5 *
                Math.sin(
                    performance.now() *
                        0.004
                );

        this.ctx.save();

        this.ctx.shadowColor =
            "#33ff44";

        this.ctx.shadowBlur =
            18 + p * 12;

        this.ctx.fillStyle =
            "#0d8b22";

        this.ctx.fillRect(
            t.x + 6,
            t.y + 6,
            t.w - 12,
            t.h - 12
        );

        this.ctx.strokeStyle =
            "#8eff8e";

        this.ctx.lineWidth = 3;

        this.ctx.strokeRect(
            t.x + 6,
            t.y + 6,
            t.w - 12,
            t.h - 12
        );

        this.ctx.fillStyle =
            "#fff";

        this.ctx.font =
            `900 ${Math.max(
                11,
                t.h * 0.21
            )}px system-ui`;

        this.ctx.textAlign =
            "center";

        this.ctx.textBaseline =
            "middle";

        this.ctx.fillText(
            "EXIT",
            t.x + t.w / 2,
            t.y + t.h / 2
        );

        this.ctx.restore();
    }

    drawCarrot(game) {
        if (!game.carrot) {
            return;
        }

        const t =
            this.tile(
                game,
                game.carrot.x,
                game.carrot.y
            );

        const bob =
            Math.sin(
                performance.now() *
                    0.006
            ) * 3;

        this.ctx.save();

        this.ctx.shadowColor =
            "rgba(255,150,30,.9)";

        this.ctx.shadowBlur = 14;

        this.ctx.font =
            `${Math.max(
                24,
                t.h * 0.65
            )}px system-ui`;

        this.ctx.textAlign =
            "center";

        this.ctx.textBaseline =
            "middle";

        this.ctx.fillText(
            "🥕",
            t.x + t.w / 2,
            t.y + t.h / 2 +
                bob
        );

        this.ctx.restore();
    }

    drawBananas(game) {
        if (!game.bananas) {
            return;
        }

        for (
            const banana
            of game.bananas
        ) {
            const t =
                this.tile(
                    game,
                    banana.x,
                    banana.y
                );

            this.ctx.save();

            this.ctx.font =
                `${Math.max(
                    22,
                    t.h * 0.55
                )}px system-ui`;

            this.ctx.textAlign =
                "center";

            this.ctx.textBaseline =
                "middle";

            this.ctx.fillText(
                "🍌",
                t.x + t.w / 2,
                t.y + t.h / 2
            );

            this.ctx.restore();
        }
    }

    drawEntity(
        game,
        e,
        img,
        maxW,
        maxH,
        bob = 0,
        flip = 1,
        alpha = 1
    ) {
        const tw =
            this.canvas.width /
            game.maze.width;

        const th =
            this.canvas.height /
            game.maze.height;

        const cx =
            (e.x + 0.5) *
            tw;

        const cy =
            (e.y + 0.5) *
            th;

        this.ctx.save();

        this.ctx.globalAlpha =
            alpha;

        this.ctx.fillStyle =
            "rgba(0,0,0,.45)";

        this.ctx.beginPath();

        this.ctx.ellipse(
            cx,
            cy + th * 0.31,
            tw * 0.28,
            th * 0.1,
            0,
            0,
            Math.PI * 2
        );

        this.ctx.fill();

        if (
            img.complete &&
            img.naturalWidth
        ) {
            const s =
                Math.min(
                    tw *
                        maxW /
                        img.naturalWidth,

                    th *
                        maxH /
                        img.naturalHeight
                );

            const w =
                img.naturalWidth *
                s;

            const h =
                img.naturalHeight *
                s;

            this.ctx.translate(
                cx,
                cy + bob
            );

            this.ctx.scale(
                flip,
                1
            );

            this.ctx.drawImage(
                img,
                -w / 2,
                -h * 0.58,
                w,
                h
            );
        }

        this.ctx.restore();
    }

    drawPlayer(game) {
        const p =
            game.player;

        if (!p) {
            return;
        }

        const alpha =
            game.invisible
                ? 0.32
                : 1;

        this.drawEntity(
            game,
            p,
            p.image,
            0.9,
            1.15,
            p.moving
                ? Math.sin(
                      performance.now() *
                          0.018
                  ) * 2
                : 0,
            p.facing,
            alpha
        );

        const t =
            this.tile(
                game,
                p.x,
                p.y
            );

        const cx =
            t.x + t.w / 2;

        const cy =
            t.y + t.h / 2;

        if (game.shieldActive) {
            this.ctx.save();

            this.ctx.strokeStyle =
                "#4fdcff";

            this.ctx.lineWidth = 4;

            this.ctx.shadowColor =
                "#4fdcff";

            this.ctx.shadowBlur = 15;

            this.ctx.beginPath();

            this.ctx.arc(
                cx,
                cy,
                Math.min(
                    t.w,
                    t.h
                ) * 0.46,
                0,
                Math.PI * 2
            );

            this.ctx.stroke();

            this.ctx.restore();
        }

        if (
            p.turboTimer > 0
        ) {
            this.ctx.save();

            this.ctx.fillStyle =
                "#ffe04b";

            this.ctx.font =
                `${Math.max(
                    14,
                    t.h * 0.3
                )}px system-ui`;

            this.ctx.textAlign =
                "center";

            this.ctx.fillText(
                "⚡",
                cx,
                t.y
            );

            this.ctx.restore();
        }
    }

    drawEnemy(game) {
        const e =
            game.enemy;

        if (!e) {
            return;
        }

        this.drawEntity(
            game,
            e,
            e.image,
            1.25,
            1.35,
            Math.sin(
                performance.now() *
                    0.01
            ) * 2,
            1
        );

        if (
            e.freezeTimer > 0
        ) {
            const t =
                this.tile(
                    game,
                    e.x,
                    e.y
                );

            this.ctx.save();

            this.ctx.font =
                `${Math.max(
                    22,
                    t.h * 0.5
                )}px system-ui`;

            this.ctx.textAlign =
                "center";

            this.ctx.fillText(
                "❄️",
                t.x + t.w / 2,
                t.y + 5
            );

            this.ctx.restore();
        }
    }

    drawDarkEdges() {
        const g =
            this.ctx
                .createRadialGradient(
                    this.canvas.width /
                        2,

                    this.canvas.height /
                        2,

                    this.canvas.height *
                        0.2,

                    this.canvas.width /
                        2,

                    this.canvas.height /
                        2,

                    this.canvas.width *
                        0.68
                );

        g.addColorStop(
            0,
            "rgba(0,0,0,0)"
        );

        g.addColorStop(
            1,
            "rgba(0,0,0,.48)"
        );

        this.ctx.fillStyle = g;

        this.ctx.fillRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );
    }

    drawDefeatAnimation() {
        if (
            !this.defeatAnimation
                .active ||
            !this.defeatImage
                .complete ||
            !this.defeatImage
                .naturalWidth
        ) {
            return;
        }

        const elapsed =
            performance.now() -
            this.defeatAnimation
                .startTime;

        const progress =
            Math.min(
                elapsed /
                    this
                        .defeatAnimation
                        .duration,
                1
            );

        const ctx =
            this.ctx;

        const cx =
            this.canvas.width /
            2;

        const cy =
            this.canvas.height /
            2;

        const wx =
            Math.sin(
                elapsed * 0.025
            ) *
            55 *
            (1 -
                progress *
                    0.5);

        const wy =
            Math.cos(
                elapsed * 0.031
            ) *
            35 *
            (1 -
                progress *
                    0.5);

        const rot =
            Math.sin(
                elapsed * 0.022
            ) *
            0.22 *
            (1 -
                progress *
                    0.4);

        const scale =
            0.2 +
            Math.min(
                progress * 4,
                1
            ) *
                0.9;

        const maxW =
            this.canvas.width *
            0.58;

        const maxH =
            this.canvas.height *
            0.78;

        const imgScale =
            Math.min(
                maxW /
                    this
                        .defeatImage
                        .naturalWidth,

                maxH /
                    this
                        .defeatImage
                        .naturalHeight
            );

        const w =
            this.defeatImage
                .naturalWidth *
            imgScale;

        const h =
            this.defeatImage
                .naturalHeight *
            imgScale;

        ctx.save();

        ctx.setTransform(
            1,
            0,
            0,
            1,
            0,
            0
        );

        ctx.fillStyle =
            "rgba(45,0,0,.5)";

        ctx.fillRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );

        ctx.translate(
            cx + wx,
            cy + wy
        );

        ctx.rotate(rot);

        ctx.scale(
            scale,
            scale
        );

        ctx.shadowColor =
            "rgba(0,0,0,.85)";

        ctx.shadowBlur =
            30;

        ctx.drawImage(
            this.defeatImage,
            -w / 2,
            -h / 2,
            w,
            h
        );

        ctx.restore();
    }
}