import { Maze } from "./maze.js";
import { Renderer } from "./renderer.js";
import { Player } from "./player.js";
import { Enemy } from "./enemy.js";
import { Achievements } from "./achievements.js";

const $ = id =>
    document.getElementById(id);


/* =========================================================
   DOM
   ========================================================= */

const canvas = $("game");
const timer = $("timer");
const stars = $("stars-display");
const carrotsDisplay = $("carrots-display");

const overlay = $("overlay");
const title = $("message-title");
const message = $("message-text");

const starMessage =
    $("star-message");

const unlockMessage =
    $("unlock-message");

const restart =
    $("restart-button");

const galleryButton =
    $("gallery-button");

const gallery =
    $("gallery-screen");

const closeGallery =
    $("close-gallery-button");

const galleryProgress =
    $("gallery-progress");

const galleryStars =
    $("gallery-stars");

const galleryGrid =
    $("gallery-grid");

const viewer =
    $("photo-viewer");

const closePhoto =
    $("close-photo-button");

const largePhoto =
    $("large-photo");

const largeTitle =
    $("large-photo-title");

const largeCaption =
    $("large-photo-caption");

const toiletPersonality =
    $("toilet-personality");

const personalityName =
    $("personality-name");

const personalityDescription =
    $("personality-description");

const startEscapeButton =
    $("start-escape-button");

const rabbitShop =
    $("rabbit-shop");

const shopCarrots =
    $("shop-carrots");

const shopItems =
    $("shop-items");

const shopMessage =
    $("shop-message");

const nextMazeButton =
    $("next-maze-button");


/* =========================================================
   GAME OBJECTS
   ========================================================= */

const renderer =
    new Renderer(canvas);

const maze =
    new Maze(21, 13);

const achievements =
    new Achievements();

const game = {
    maze,

    exit: null,
    carrot: null,

    pendingCarrot: false,

    bananas: [],

    player:
        new Player(1, 1),

    enemy:
        new Enemy(19, 11),

    state:
        "waiting",

    startTime: 0,
    elapsedTime: 0,

    shieldActive: false,

    invisible: false,
    invisibilityTimer: 0,
    lastSeenPosition: null,

    teleportPauseStart: 0
};

let previous =
    performance.now();


/* =========================================================
   STREAK UI
   ========================================================= */

let streakDisplay = null;


function createStreakUI() {
    streakDisplay =
        document.createElement(
            "div"
        );

    streakDisplay.id =
        "streak-display";

    const headerActions =
        document.querySelector(
            ".header-actions"
        );

    /*
     * Put streak beside stars
     * and carrots.
     */
    headerActions.insertBefore(
        streakDisplay,
        galleryButton
    );

    const style =
        document.createElement(
            "style"
        );

    style.textContent = `
        #streak-display {
            min-width: 72px;

            padding: 10px 12px;

            border: 2px solid #8b3d21;
            border-radius: 10px;

            color: #ffd0a0;
            background: #35160c;

            text-align: center;
            font-size: 18px;
            font-weight: 900;

            white-space: nowrap;
        }

        @media (pointer: coarse) {
            #streak-display {
                min-width: 64px;

                padding: 8px 9px;

                font-size: 15px;
            }
        }

        @media (pointer: coarse) and (orientation: landscape) {
            #streak-display {
                min-width: 52px;

                padding: 4px 6px;

                font-size: 12px;
            }
        }
    `;

    document.head.append(
        style
    );

    updateStreakUI();
}


function updateStreakUI() {
    if (!streakDisplay) {
        return;
    }

    streakDisplay.textContent =
        `🔥 ${achievements.currentStreak}`;

    streakDisplay.title =
        `Current streak: ${achievements.currentStreak} — Best: ${achievements.bestStreak}`;
}


/* =========================================================
   POWER-UP UI
   ========================================================= */

let powerupBar = null;

const powerupButtons =
    new Map();

let teleportPrompt = null;


function createPowerupUI() {
    const style =
        document.createElement(
            "style"
        );

    style.textContent = `
        #powerup-bar {
            position: fixed;
            left: 50%;
            bottom: max(10px, env(safe-area-inset-bottom));
            transform: translateX(-50%);
            z-index: 55;

            display: flex;
            gap: 6px;

            padding: 6px;

            border: 2px solid #354250;
            border-radius: 14px;

            background: rgba(8, 13, 18, 0.88);

            pointer-events: auto;
        }

        #powerup-bar button {
            position: relative;

            width: 54px;
            height: 48px;

            padding: 0;

            border: 2px solid #546372;
            border-radius: 11px;

            color: white;
            background: #1b2935;

            font-size: 25px;

            box-shadow: 0 4px 0 #05080b;

            touch-action: none;
        }

        #powerup-bar button:disabled {
            opacity: 0.35;
        }

        .powerup-count {
            position: absolute;
            right: 2px;
            bottom: 1px;

            min-width: 16px;

            padding: 1px 4px;

            border-radius: 8px;

            color: white;
            background: #000;

            font-size: 10px;
            font-weight: 900;
        }

        #teleport-prompt {
            position: absolute;
            left: 50%;
            top: 18px;
            z-index: 75;

            transform: translateX(-50%);

            width: min(440px, 88%);

            padding: 12px 16px;

            border: 3px solid #9a6cff;
            border-radius: 16px;

            color: #fff;
            background: rgba(25, 12, 45, 0.96);

            text-align: center;
            font-size: 18px;
            font-weight: 900;

            box-shadow:
                0 12px 35px
                rgba(0, 0, 0, 0.65);

            pointer-events: auto;
        }

        #teleport-prompt small {
            display: block;

            margin-top: 5px;

            color: #d8c8ff;

            font-size: 12px;
            font-weight: 600;
        }

        #cancel-teleport-button {
            margin-top: 9px;

            padding: 7px 13px;

            color: #fff;
            background: #493666;

            font-size: 12px;

            box-shadow: 0 3px 0 #160c24;
        }

        .teleport-selecting {
            cursor: crosshair;
        }

        @media (pointer: coarse) and (orientation: landscape) {
            #powerup-bar {
                bottom: 5px;
                gap: 4px;
                padding: 4px;
            }

            #powerup-bar button {
                width: 42px;
                height: 38px;

                font-size: 20px;
            }

            #teleport-prompt {
                top: 8px;

                width: min(390px, 65%);

                padding: 8px 12px;

                font-size: 14px;
            }

            #teleport-prompt small {
                font-size: 10px;
            }

            #cancel-teleport-button {
                margin-top: 5px;
                padding: 5px 10px;
            }
        }
    `;

    document.head.append(
        style
    );

    powerupBar =
        document.createElement(
            "div"
        );

    powerupBar.id =
        "powerup-bar";

    achievements.shopItems.forEach(
        (
            item,
            index
        ) => {
            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.dataset.item =
                item.id;

            button.title =
                `${index + 1}: ${item.name}`;

            button.innerHTML =
                `${item.icon}<span class="powerup-count">0</span>`;

            button.addEventListener(
                "pointerdown",
                event => {
                    event.preventDefault();
                    event.stopPropagation();

                    usePowerup(
                        item.id
                    );
                }
            );

            powerupButtons.set(
                item.id,
                button
            );

            powerupBar.append(
                button
            );
        }
    );

    document.body.append(
        powerupBar
    );

    createTeleportPrompt();

    updatePowerupUI();
}


function createTeleportPrompt() {
    teleportPrompt =
        document.createElement(
            "div"
        );

    teleportPrompt.id =
        "teleport-prompt";

    teleportPrompt.classList.add(
        "hidden"
    );

    teleportPrompt.innerHTML = `
        🌀 WHERE DO YOU WANT TO TELEPORT?
        <small>
            Tap any open floor tile in the maze.
        </small>
        <button
            id="cancel-teleport-button"
            type="button"
        >
            CANCEL
        </button>
    `;

    const canvasContainer =
        document.querySelector(
            ".canvas-container"
        );

    canvasContainer.append(
        teleportPrompt
    );

    const cancelButton =
        $("cancel-teleport-button");

    cancelButton.addEventListener(
        "pointerdown",
        event => {
            event.preventDefault();
            event.stopPropagation();

            cancelTeleport();
        }
    );
}


function updatePowerupUI() {
    for (
        const item
        of achievements.shopItems
    ) {
        const button =
            powerupButtons.get(
                item.id
            );

        if (!button) {
            continue;
        }

        const count =
            achievements
                .getItemCount(
                    item.id
                );

        const countElement =
            button.querySelector(
                ".powerup-count"
            );

        countElement.textContent =
            count;

        button.disabled =
            count <= 0 ||
            game.state !==
                "playing";
    }
}


/* =========================================================
   HELPERS
   ========================================================= */

function resetEntity(
    entity,
    x,
    y
) {
    entity.x = x;
    entity.y = y;

    entity.targetX = x;
    entity.targetY = y;

    entity.moving = false;
}


function updateStars() {
    stars.textContent =
        `⭐ ${achievements.totalStars}`;
}


function updateCarrots() {
    if (game.pendingCarrot) {
        carrotsDisplay.textContent =
            `🥕 ${achievements.carrots} +1`;
    } else {
        carrotsDisplay.textContent =
            `🥕 ${achievements.carrots}`;
    }
}


/* =========================================================
   CARROT
   ========================================================= */

function placeCarrot() {
    const possibleTiles = [];

    for (
        let y = 0;
        y < maze.height;
        y++
    ) {
        for (
            let x = 0;
            x < maze.width;
            x++
        ) {
            if (
                !maze.isFloor(
                    x,
                    y
                )
            ) {
                continue;
            }

            if (
                x === 1 &&
                y === 1
            ) {
                continue;
            }

            if (
                game.exit &&
                x === game.exit.x &&
                y === game.exit.y
            ) {
                continue;
            }

            const distance =
                Math.abs(x - 1) +
                Math.abs(y - 1);

            if (distance < 4) {
                continue;
            }

            possibleTiles.push({
                x,
                y
            });
        }
    }

    if (
        possibleTiles.length ===
        0
    ) {
        game.carrot = null;
        return;
    }

    game.carrot =
        possibleTiles[
            Math.floor(
                Math.random() *
                possibleTiles.length
            )
        ];
}


/* =========================================================
   RESET RUN
   ========================================================= */

function resetRunEffects() {
    game.bananas = [];

    game.shieldActive =
        false;

    game.invisible =
        false;

    game.invisibilityTimer =
        0;

    game.lastSeenPosition =
        null;

    game.teleportPauseStart =
        0;

    game.player.resetEffects();

    game.enemy.resetEffects();

    hideTeleportPrompt();
}


/* =========================================================
   LEVEL
   ========================================================= */

function generateLevel() {
    rabbitShop.classList.add(
        "hidden"
    );

    overlay.classList.add(
        "hidden"
    );

    toiletPersonality.classList.add(
        "hidden"
    );

    game.pendingCarrot =
        false;

    updateCarrots();

    maze.generate();

    game.enemy.choosePersonality();

    game.exit =
        maze.findFurthest(
            1,
            1
        );

    placeCarrot();

    resetEntity(
        game.player,
        1,
        1
    );

    resetEntity(
        game.enemy,
        game.exit.x,
        game.exit.y
    );

    resetRunEffects();

    game.state =
        "waiting";

    game.elapsedTime =
        0;

    timer.textContent =
        "Time: 0.0";

    starMessage.classList.add(
        "hidden"
    );

    unlockMessage.classList.add(
        "hidden"
    );

    renderer.stopDefeatAnimation();

    renderer.cameraX =
        canvas.width / 2;

    renderer.cameraY =
        canvas.height / 2;

    personalityName.textContent =
        game.enemy
            .personality
            .name;

    personalityDescription.textContent =
        game.enemy
            .personality
            .description ||
        "Can you escape before it catches you?";

    toiletPersonality.classList.remove(
        "hidden"
    );

    updatePowerupUI();
}


/* =========================================================
   START
   ========================================================= */

startEscapeButton.addEventListener(
    "click",
    () => {
        toiletPersonality.classList.add(
            "hidden"
        );

        game.state =
            "playing";

        game.startTime =
            performance.now();

        game.elapsedTime =
            0;

        timer.textContent =
            "Time: 0.0";

        updatePowerupUI();
    }
);


/* =========================================================
   POWER UPS
   ========================================================= */

function usePowerup(
    itemId
) {
    if (
        game.state !==
        "playing"
    ) {
        return;
    }

    if (
        achievements
            .getItemCount(
                itemId
            ) <= 0
    ) {
        return;
    }

    if (
        itemId ===
        "banana"
    ) {
        game.bananas.push({
            x:
                Math.round(
                    game.player.x
                ),

            y:
                Math.round(
                    game.player.y
                )
        });

        achievements.useItem(
            itemId
        );
    }

    else if (
        itemId ===
        "turboShoes"
    ) {
        game.player.activateTurbo(
            8
        );

        achievements.useItem(
            itemId
        );
    }

    else if (
        itemId ===
        "freezeBomb"
    ) {
        game.enemy.freeze(
            3
        );

        achievements.useItem(
            itemId
        );
    }

    else if (
        itemId ===
        "shield"
    ) {
        if (
            game.shieldActive
        ) {
            return;
        }

        game.shieldActive =
            true;

        achievements.useItem(
            itemId
        );
    }

    else if (
        itemId ===
        "invisibilityCloak"
    ) {
        game.invisible =
            true;

        game.invisibilityTimer =
            5;

        game.lastSeenPosition = {
            x:
                Math.round(
                    game.player.x
                ),

            y:
                Math.round(
                    game.player.y
                )
        };

        achievements.useItem(
            itemId
        );
    }

    else if (
        itemId ===
        "teleport"
    ) {
        beginTeleport();

        return;
    }

    updatePowerupUI();
}


/* =========================================================
   TELEPORT
   ========================================================= */

function beginTeleport() {
    game.state =
        "teleporting";

    game.teleportPauseStart =
        performance.now();

    teleportPrompt.classList.remove(
        "hidden"
    );

    canvas.classList.add(
        "teleport-selecting"
    );

    updatePowerupUI();
}


function hideTeleportPrompt() {
    if (teleportPrompt) {
        teleportPrompt.classList.add(
            "hidden"
        );
    }

    canvas.classList.remove(
        "teleport-selecting"
    );
}


function resumeAfterTeleportPause() {
    if (
        !game.teleportPauseStart
    ) {
        return;
    }

    const pausedFor =
        performance.now() -
        game.teleportPauseStart;

    game.startTime +=
        pausedFor;

    game.teleportPauseStart =
        0;
}


function cancelTeleport() {
    if (
        game.state !==
        "teleporting"
    ) {
        return;
    }

    resumeAfterTeleportPause();

    game.state =
        "playing";

    hideTeleportPrompt();

    updatePowerupUI();
}


function finishTeleport(
    x,
    y
) {
    if (
        game.state !==
        "teleporting"
    ) {
        return;
    }

    if (
        !maze.isFloor(
            x,
            y
        )
    ) {
        return;
    }

    const enemyDistance =
        Math.hypot(
            x - game.enemy.x,
            y - game.enemy.y
        );

    if (
        enemyDistance <
        1.5
    ) {
        return;
    }

    if (
        x ===
            Math.round(
                game.player.x
            ) &&
        y ===
            Math.round(
                game.player.y
            )
    ) {
        return;
    }

    resetEntity(
        game.player,
        x,
        y
    );

    achievements.useItem(
        "teleport"
    );

    resumeAfterTeleportPause();

    game.state =
        "playing";

    hideTeleportPrompt();

    renderer.triggerShake(
        7,
        0.25
    );

    updatePowerupUI();
}


canvas.addEventListener(
    "pointerdown",
    event => {
        if (
            game.state !==
            "teleporting"
        ) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const rect =
            canvas
                .getBoundingClientRect();

        const screenX =
            (
                event.clientX -
                rect.left
            ) *
            (
                canvas.width /
                rect.width
            );

        const screenY =
            (
                event.clientY -
                rect.top
            ) *
            (
                canvas.height /
                rect.height
            );

        const ox =
            canvas.width / 2 -
            renderer.cameraX *
                renderer.zoom;

        const oy =
            canvas.height / 2 -
            renderer.cameraY *
                renderer.zoom;

        const worldX =
            (
                screenX -
                ox
            ) /
            renderer.zoom;

        const worldY =
            (
                screenY -
                oy
            ) /
            renderer.zoom;

        const tileWidth =
            canvas.width /
            maze.width;

        const tileHeight =
            canvas.height /
            maze.height;

        const tileX =
            Math.floor(
                worldX /
                tileWidth
            );

        const tileY =
            Math.floor(
                worldY /
                tileHeight
            );

        if (
            tileX < 0 ||
            tileY < 0 ||
            tileX >=
                maze.width ||
            tileY >=
                maze.height
        ) {
            return;
        }

        finishTeleport(
            tileX,
            tileY
        );
    }
);


/* =========================================================
   RESULT / DEFEAT
   ========================================================= */

function showResult(
    resultTitle,
    text,
    caught = false
) {
    game.state =
        "finished";

    hideTeleportPrompt();

    updatePowerupUI();

    title.textContent =
        resultTitle;

    if (caught) {
        const streakResult =
            achievements.recordDefeat();

        updateStreakUI();

        game.pendingCarrot =
            false;

        updateCarrots();

        if (
            streakResult
                .previousStreak >= 2
        ) {
            message.textContent =
                `${text} 🔥 Your ${streakResult.previousStreak}-win streak is over!`;
        } else {
            message.textContent =
                text;
        }

        renderer.triggerShake(
            22,
            1.4
        );

        renderer.startDefeatAnimation();

        setTimeout(
            () => {
                renderer.stopDefeatAnimation();

                overlay.classList.remove(
                    "hidden"
                );
            },
            1500
        );

        return;
    }

    message.textContent =
        text;

    overlay.classList.remove(
        "hidden"
    );
}


/* =========================================================
   SHOP
   ========================================================= */

function renderRabbitShop() {
    shopCarrots.textContent =
        `🥕 ${achievements.carrots}`;

    shopItems.innerHTML =
        "";

    achievements.shopItems.forEach(
        item => {
            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "shop-item";

            const icon =
                document.createElement(
                    "div"
                );

            icon.className =
                "shop-item-icon";

            icon.textContent =
                item.icon;

            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "shop-item-info";

            const itemName =
                document.createElement(
                    "span"
                );

            itemName.className =
                "shop-item-name";

            itemName.textContent =
                item.name;

            const description =
                document.createElement(
                    "span"
                );

            description.className =
                "shop-item-description";

            description.textContent =
                item.description;

            const bottom =
                document.createElement(
                    "div"
                );

            bottom.className =
                "shop-item-bottom";

            const owned =
                document.createElement(
                    "span"
                );

            owned.className =
                "shop-item-owned";

            owned.textContent =
                `Owned: ${achievements.getItemCount(
                    item.id
                )}`;

            const buyButton =
                document.createElement(
                    "button"
                );

            buyButton.className =
                "shop-buy-button";

            buyButton.textContent =
                `🥕 ${item.price}`;

            buyButton.disabled =
                achievements.carrots <
                item.price;

            buyButton.addEventListener(
                "click",
                () => {
                    const result =
                        achievements.buyItem(
                            item.id
                        );

                    if (
                        result.success
                    ) {
                        updateCarrots();

                        renderRabbitShop();

                        shopMessage.textContent =
                            `${item.icon} ${item.name} added to your backpack!`;

                        updatePowerupUI();
                    } else {
                        shopMessage.textContent =
                            `You need ${item.price} carrots for ${item.name}.`;
                    }
                }
            );

            bottom.append(
                owned,
                buyButton
            );

            info.append(
                itemName,
                description,
                bottom
            );

            card.append(
                icon,
                info
            );

            shopItems.append(
                card
            );
        }
    );
}


function openRabbitShop(
    statusMessage = ""
) {
    game.state =
        "shop";

    hideTeleportPrompt();

    updatePowerupUI();

    overlay.classList.add(
        "hidden"
    );

    toiletPersonality.classList.add(
        "hidden"
    );

    renderRabbitShop();

    shopMessage.textContent =
        statusMessage;

    rabbitShop.classList.remove(
        "hidden"
    );
}


nextMazeButton.addEventListener(
    "click",
    () => {
        rabbitShop.classList.add(
            "hidden"
        );

        generateLevel();
    }
);


/* =========================================================
   WIN
   ========================================================= */

function win() {
    /*
     * Bank maze carrot.
     */
    if (
        game.pendingCarrot
    ) {
        achievements.addCarrot();

        game.pendingCarrot =
            false;
    }

    /*
     * Increase streak and award
     * streak carrot bonus.
     */
    const streakResult =
        achievements.recordWin();

    updateCarrots();
    updateStreakUI();

    const reward =
        achievements.awardStars(
            game.elapsedTime
        );

    updateStars();

    /*
     * Victory screen.
     */
    game.state =
        "victory";

    title.textContent =
        "You Escaped!";

    message.textContent =
        `Escape time: ${game.elapsedTime.toFixed(1)} seconds.`;

    starMessage.textContent =
        `⭐ You earned ${reward.earnedStars} ` +
        `${reward.earnedStars === 1
            ? "star"
            : "stars"}!`;

    starMessage.classList.remove(
        "hidden"
    );

    /*
     * Memory unlock message.
     */
    if (
        reward.newPhotos.length
    ) {
        unlockMessage.textContent =
            `🎉 New memory unlocked: ` +
            `${reward.newPhotos
                .map(
                    photo =>
                        photo.title
                )
                .join(", ")}!`;

        unlockMessage.classList.remove(
            "hidden"
        );
    } else {
        unlockMessage.classList.add(
            "hidden"
        );
    }

    /*
     * Add streak information
     * to the victory screen.
     */
    let streakText =
        `🔥 Win streak: ${streakResult.currentStreak}`;

    if (
        streakResult.bonusCarrots >
        0
    ) {
        streakText +=
            `   🥕 +${streakResult.bonusCarrots} streak bonus`;
    }

    if (
        streakResult.currentStreak ===
        streakResult.bestStreak
    ) {
        streakText +=
            `   🏆 Best: ${streakResult.bestStreak}`;
    }

    message.textContent +=
        `\n${streakText}`;

    /*
     * The button now leads
     * to the rabbit shop.
     */
    restart.textContent =
        "VISIT RABBIT'S SHOP 🐰";

    overlay.classList.remove(
        "hidden"
    );

    updatePowerupUI();
}


/* =========================================================
   UPDATE
   ========================================================= */

function update(
    deltaTime
) {
    if (
        game.state !==
        "playing"
    ) {
        return;
    }

    game.elapsedTime =
        (
            performance.now() -
            game.startTime
        ) /
        1000;

    timer.textContent =
        `Time: ${game.elapsedTime.toFixed(
            1
        )}`;

    game.player.update(
        deltaTime
    );

    let toiletTarget =
        game.player;

    if (
        game.invisible
    ) {
        game.invisibilityTimer -=
            deltaTime;

        if (
            game.invisibilityTimer <=
            0
        ) {
            game.invisible =
                false;

            game.invisibilityTimer =
                0;

            game.lastSeenPosition =
                null;
        } else if (
            game.lastSeenPosition
        ) {
            toiletTarget =
                game.lastSeenPosition;
        }
    }

    game.enemy.update(
        deltaTime,
        maze,
        toiletTarget
    );

    if (
        game.carrot
    ) {
        const carrotDistance =
            Math.hypot(
                game.player.x -
                    game.carrot.x,

                game.player.y -
                    game.carrot.y
            );

        if (
            carrotDistance <
            0.35
        ) {
            game.carrot =
                null;

            game.pendingCarrot =
                true;

            updateCarrots();
        }
    }

    for (
        let index =
            game.bananas.length -
            1;

        index >= 0;

        index--
    ) {
        const banana =
            game.bananas[index];

        const distance =
            Math.hypot(
                game.enemy.x -
                    banana.x,

                game.enemy.y -
                    banana.y
            );

        if (
            distance <
            0.4
        ) {
            game.enemy.slow(
                3,
                0.45
            );

            game.bananas.splice(
                index,
                1
            );
        }
    }

    const enemyDistance =
        Math.hypot(
            game.player.x -
                game.enemy.x,

            game.player.y -
                game.enemy.y
        );

    const exitDistance =
        Math.hypot(
            game.player.x -
                game.exit.x,

            game.player.y -
                game.exit.y
        );

    if (
        enemyDistance <
        0.55
    ) {
        if (
            game.shieldActive
        ) {
            game.shieldActive =
                false;

            resetEntity(
                game.enemy,
                game.exit.x,
                game.exit.y
            );

            renderer.triggerShake(
                10,
                0.35
            );
        } else {
            showResult(
                "Caught!",
                "The toilet caught the 67 Kid.",
                true
            );
        }
    } else if (
        exitDistance <
        0.25
    ) {
        win();
    }
}


/* =========================================================
   LOOP
   ========================================================= */

function loop(now) {
    const deltaTime =
        Math.min(
            (
                now -
                previous
            ) /
                1000,

            0.05
        );

    previous =
        now;

    update(
        deltaTime
    );

    renderer.render(
        game
    );

    requestAnimationFrame(
        loop
    );
}


/* =========================================================
   MOVEMENT
   ========================================================= */

function move(direction) {
    if (
        game.state !==
        "playing"
    ) {
        return;
    }

    const directions = {
        up: [0, -1],
        down: [0, 1],
        left: [-1, 0],
        right: [1, 0]
    };

    const movement =
        directions[
            direction
        ];

    if (movement) {
        game.player.move(
            movement[0],
            movement[1],
            maze
        );
    }
}


/* =========================================================
   KEYBOARD
   ========================================================= */

addEventListener(
    "keydown",
    event => {
        const key =
            event.key
                .toLowerCase();

        if (
            key === "escape" &&
            game.state ===
                "teleporting"
        ) {
            event.preventDefault();

            cancelTeleport();

            return;
        }

        const keyMap = {
            arrowup: "up",
            w: "up",

            arrowdown:
                "down",
            s: "down",

            arrowleft:
                "left",
            a: "left",

            arrowright:
                "right",
            d: "right"
        };

        if (
            keyMap[key]
        ) {
            event.preventDefault();

            move(
                keyMap[key]
            );
        }

        const powerupKeys = {
            "1":
                "banana",

            "2":
                "turboShoes",

            "3":
                "freezeBomb",

            "4":
                "shield",

            "5":
                "invisibilityCloak",

            "6":
                "teleport"
        };

        if (
            powerupKeys[key]
        ) {
            event.preventDefault();

            usePowerup(
                powerupKeys[key]
            );
        }

        if (
            key === "r"
        ) {
            generateLevel();
        }

        if (
            key === "escape"
        ) {
            viewer.classList.add(
                "hidden"
            );

            gallery.classList.add(
                "hidden"
            );
        }
    }
);


/* =========================================================
   TOUCH
   ========================================================= */

const touchControls =
    document.querySelector(
        ".touch-controls"
    );

const touchButtons =
    document.querySelectorAll(
        ".touch-controls button[data-dir]"
    );

touchButtons.forEach(
    button => {
        button.addEventListener(
            "pointerdown",
            event => {
                event.preventDefault();
                event.stopPropagation();

                move(
                    button.dataset.dir
                );
            }
        );

        button.addEventListener(
            "contextmenu",
            event => {
                event.preventDefault();
            }
        );
    }
);

if (touchControls) {
    touchControls.addEventListener(
        "touchstart",
        event => {
            event.preventDefault();
        },
        {
            passive: false
        }
    );

    touchControls.addEventListener(
        "touchmove",
        event => {
            event.preventDefault();
        },
        {
            passive: false
        }
    );
}


/* =========================================================
   RESTART
   ========================================================= */

restart.onclick =
    () => {
        /*
         * After victory:
         * go to the rabbit shop.
         */
        if (
            game.state ===
            "victory"
        ) {
            overlay.classList.add(
                "hidden"
            );

            /*
             * Restore the button text
             * for future defeats.
             */
            restart.textContent =
                "Play Again";

            openRabbitShop();

            return;
        }

        /*
         * After being caught:
         * start another maze normally.
         */
        generateLevel();
    };


/* =========================================================
   GALLERY
   ========================================================= */

function renderGallery() {
    galleryGrid.innerHTML =
        "";

    galleryProgress.textContent =
        `${achievements.unlockedCount} of ` +
        `${achievements.photos.length} unlocked — ` +
        `${achievements.getRemainingCount()} remaining`;

    galleryStars.textContent =
        achievements.unlockedCount >=
        achievements.photos.length

            ? `⭐ ${achievements.totalStars} — All memories unlocked!`

            : `⭐ ${achievements.totalStars} — ` +
              `${achievements.getStarsTowardNextPhoto()} ` +
              `of ${achievements.starsPerPhoto} stars toward the next memory`;

    achievements.photos.forEach(
        (
            photo,
            index
        ) => {
            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "gallery-card";

            if (
                achievements.isUnlocked(
                    index
                )
            ) {
                const image =
                    document.createElement(
                        "img"
                    );

                image.src =
                    photo.file;

                image.alt =
                    photo.title;

                image.onerror =
                    () => {
                        image.style.display =
                            "none";
                    };

                const heading =
                    document.createElement(
                        "h3"
                    );

                heading.textContent =
                    photo.title;

                card.append(
                    image,
                    heading
                );

                card.onclick =
                    () => {
                        largePhoto.src =
                            photo.file;

                        largeTitle.textContent =
                            photo.title;

                        largeCaption.textContent =
                            photo.caption;

                        viewer.classList.remove(
                            "hidden"
                        );
                    };
            } else {
                card.classList.add(
                    "locked"
                );

                const placeholder =
                    document.createElement(
                        "div"
                    );

                placeholder.className =
                    "locked-placeholder";

                placeholder.textContent =
                    `Memory ${index + 1}`;

                const heading =
                    document.createElement(
                        "h3"
                    );

                heading.textContent =
                    "Locked";

                card.append(
                    placeholder,
                    heading
                );
            }

            galleryGrid.append(
                card
            );
        }
    );
}


galleryButton.onclick =
    () => {
        renderGallery();

        gallery.classList.remove(
            "hidden"
        );
    };


closeGallery.onclick =
    () => {
        gallery.classList.add(
            "hidden"
        );
    };


closePhoto.onclick =
    () => {
        viewer.classList.add(
            "hidden"
        );
    };


viewer.onclick =
    event => {
        if (
            event.target ===
            viewer
        ) {
            viewer.classList.add(
                "hidden"
            );
        }
    };


/* =========================================================
   INITIALISE
   ========================================================= */

createStreakUI();
createPowerupUI();

updateStars();
updateCarrots();
updateStreakUI();

generateLevel();

requestAnimationFrame(
    loop
);