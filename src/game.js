import { Maze } from "./maze.js";
import { Renderer } from "./renderer.js";
import { Player } from "./player.js";
import { Enemy } from "./enemy.js";
import { Achievements } from "./achievements.js";
import { RunSystem } from "./run-system.js";
import { rollToiletGear } from "./toilet-gear.js";
import { CHARACTERS } from "./characters.js";

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

const rewardScreen = $("reward-screen");
const rewardChoices = $("reward-choices");
const rewardRunStats = $("reward-run-stats");
const runStats = $("run-stats");
const characterSelection = $("character-selection");
const characterChoices = $("character-choices");
const victoryCharacterImage = $("victory-character-image");


/* =========================================================
   GAME OBJECTS
   ========================================================= */

const renderer =
    new Renderer(canvas);

const maze =
    new Maze(21, 13);

const achievements =
    new Achievements();

const run = new RunSystem();

const game = {
    maze,

    exit: null,
    carrot: null,

    pendingCarrot: false,

    bananas: [],
    sewerHatches: [],

    player:
        new Player(1, 1),

    enemy:
        new Enemy(19, 11),

    state:
        "waiting",

    startTime: 0,
    elapsedTime: 0,

    shieldCharges: 0,
    wallCutterTimer: 0,
    playerTrapTimer: 0,

    invisible: false,
    invisibilityTimer: 0,
    lastSeenPosition: null,

    teleportPauseStart: 0,
    run,
    enemyGear: [],
    enemyStartDelay: 0,
    laser: null,
    plunger: null,
    plungerCooldown: 0,
    magneticFlush: null,
    magneticFlushCooldown: 0,
    springSeatCooldown: 0,
    enemyArmorHits: 0,
    doubleFlushPhase: "cooldown",
    doubleFlushTimer: 0,
    decoyDuck: null,
    decoyDuckCooldown: 0,
    character: CHARACTERS[0],
    lastPlayerStepKey: "1,1"
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

    if ("pendingStepCount" in entity) {
        entity.pendingStepCount = 0;
    }
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

function hasEnemyGear(id) {
    return game.enemyGear.some(item => item.id === id);
}

function hasActiveEnemyArmor() {
    return hasEnemyGear("armor") && game.enemyArmorHits > 0;
}

function absorbEnemyArmorHit() {
    if (!hasActiveEnemyArmor()) return false;
    game.enemyArmorHits -= 1;
    updateRunStats();
    renderer.triggerShake(4, 0.15);
    return true;
}

function getEnemyLevelSpeedBonus() {
    return Math.max(0, run.level - 1) * 0.02;
}

function rewardStackCount(id) {
    return run.rewards.filter(reward => reward.id === id).length;
}

function getPlayerBaseSpeed(runnerBonus = run.total("runner")) {
    return 7 * game.character.speedMultiplier * (1 + runnerBonus);
}

function getRunShieldCharges(extraCharges = 0) {
    if (run.total("goldenShield") > 0) {
        return 2;
    }

    return Math.floor(run.total("shield") + extraCharges);
}

function formatRewardValue(reward, total = reward.value) {
    const headStartMultiplier = game.character.headStartMultiplier || 1;
    const formats = {
        runner: value => `+${Math.round(value * 100)}% player speed`,
        headStart: value => `+${(value * headStartMultiplier).toFixed(1)}s effective head start`,
        shield: value => `+${Math.floor(value)} shield charge${value === 1 ? "" : "s"} per maze`,
        goldenShield: value => `+${Math.floor(value)} shield charges per maze`,
        carrotLuck: value => `+${Math.floor(value)} carrot${value === 1 ? "" : "s"} per victory`,
        toiletSlow: value =>
            `−${Math.round(Math.min(0.35, value) * 100)}% toilet speed`,
        extraFreeze: value => `+${value.toFixed(1)}s Freeze Bomb duration`
    };
    return formats[reward.id](total);
}

function formatProjectedRewardValue(reward) {
    if (reward.id === "runner") {
        const projectedSpeed = getPlayerBaseSpeed(
            run.total("runner") + reward.value
        );
        const projectedPercent = Math.round((projectedSpeed / 7 - 1) * 100);
        return `${projectedPercent >= 0 ? "+" : ""}${projectedPercent}% final speed (${projectedSpeed.toFixed(2)} tiles/s)`;
    }

    if (reward.id === "shield" || reward.id === "goldenShield") {
        const charges = reward.id === "goldenShield"
            ? 2
            : getRunShieldCharges(reward.value);
        return `${charges} shield charge${charges === 1 ? "" : "s"} per maze`;
    }

    const projectedTotal = run.total(reward.id) + reward.value;
    const formattedValue = formatRewardValue(reward, projectedTotal);

    if (reward.id === "toiletSlow" && projectedTotal >= 0.35) {
        return `${formattedValue} (MAX)`;
    }

    return formattedValue;
}

function formatRewardSelectionValue(reward) {
    if (reward.id !== "toiletSlow") {
        return formatRewardValue(reward);
    }

    const currentApplied = Math.min(0.35, run.total("toiletSlow"));
    const projectedApplied = Math.min(
        0.35,
        run.total("toiletSlow") + reward.value
    );
    const effectiveGain = projectedApplied - currentApplied;

    if (effectiveGain <= 0.0001) {
        return "Cap already reached — no additional slowdown";
    }

    const cappedLabel = effectiveGain < reward.value ? " (capped)" : "";
    return `−${Math.round(effectiveGain * 100)}% additional toilet speed${cappedLabel}`;
}

function updateRunStats() {
    const speed = Math.round((getPlayerBaseSpeed() / 7 - 1) * 100);
    const headStart =
        run.total("headStart") * (game.character.headStartMultiplier || 1);
    const shieldStacks =
        run.total("goldenShield") > 0
            ? 1
            : rewardStackCount("shield");
    const carrots = Math.floor(run.total("carrotLuck"));
    const slow = Math.min(35, Math.round(run.total("toiletSlow") * 100));
    const freeze = run.total("extraFreeze");
    const rows = [
        ["👟 Player speed", `${speed >= 0 ? "+" : ""}${speed}%`, rewardStackCount("runner")],
        ["⏳ Head start", `${headStart.toFixed(1)}s`, rewardStackCount("headStart")],
        ["🛡️ Shields", `${game.shieldCharges} ready`, shieldStacks],
        ["🥕 Win bonus", `+${carrots}`, rewardStackCount("carrotLuck")],
        ["🧻 Toilet speed", `−${slow}%`, rewardStackCount("toiletSlow")],
        ["❄️ Freeze Bomb", `${(3 + freeze).toFixed(1)}s`, rewardStackCount("extraFreeze")]
    ].filter(([, , stacks]) => stacks > 0);
    const toiletEquipment = game.enemyGear.length
        ? game.enemyGear.map(item => {
            const status = item.id === "armor"
                ? ` · ${game.enemyArmorHits} hit${game.enemyArmorHits === 1 ? "" : "s"} left`
                : "";
            return `
            <div class="toilet-equipment-item" title="${item.description}">
                <span>${item.icon} ${item.name}${status}</span>
            </div>
        `;
        }).join("")
        : `<div class="run-stat-empty">None this level</div>`;

    runStats.innerHTML = `
        <div class="run-character">${game.character.name} · ${game.character.ability}</div>
        <div class="run-character-perk">${game.character.stats.join(" · ")}</div>
        <div class="run-stats-title">RUN LEVEL ${run.level}</div>
        <div class="run-stats-subtitle">${run.rewards.length} reward${run.rewards.length === 1 ? "" : "s"} stacked</div>
        ${rows.length ? rows.map(([label, value, stacks]) => `
            <div class="run-stat">
                <span>${label}${stacks ? ` <span class="run-stat-stack">×${stacks}</span>` : ""}</span>
                <span class="run-stat-value">${value}</span>
            </div>
        `).join("") : `<div class="run-stat-empty">Choose a reward after your first escape.</div>`}
        <div class="toilet-equipment-title">TOILET EQUIPMENT · +${Math.round(getEnemyLevelSpeedBonus() * 100)}% LEVEL SPEED</div>
        <div class="toilet-equipment-list">${toiletEquipment}</div>
    `;

    rewardRunStats.innerHTML = runStats.innerHTML;
}

function renderCharacterChoices() {
    characterChoices.innerHTML = "";

    for (const character of CHARACTERS) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "character-card";
        button.innerHTML = `
            <img src="${character.portrait}" alt="${character.name}">
            <span class="character-name">${character.name}</span>
            <span class="character-ability">${character.ability}</span>
            <span class="character-tagline">${character.tagline}</span>
            <span class="character-stats">${character.stats.map(stat => `<span>${stat}</span>`).join("")}</span>
            <span class="character-select-label">PLAY AS ${character.name.toUpperCase()}</span>
        `;
        button.addEventListener("click", () => selectCharacter(character));
        characterChoices.append(button);
    }
}

function showCharacterSelection() {
    game.state = "character-select";
    overlay.classList.add("hidden");
    toiletPersonality.classList.add("hidden");
    rabbitShop.classList.add("hidden");
    rewardScreen.classList.add("hidden");
    characterSelection.classList.remove("hidden");
    renderCharacterChoices();
    updatePowerupUI();
}

function selectCharacter(character) {
    game.character = character;
    game.player.image.src = character.portrait;
    characterSelection.classList.add("hidden");
    generateLevel();
}

function showRewardChoices() {
    game.state = "reward";
    overlay.classList.add("hidden");
    rewardChoices.innerHTML = "";

    const excludedRewardIds = [];
    if (run.total("toiletSlow") >= 0.3499) {
        excludedRewardIds.push("toiletSlow");
    }

    for (
        const reward of run.createChoices(
            3,
            game.character.lootProfile || "normal",
            excludedRewardIds
        )
    ) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "reward-card";
        button.style.setProperty("--rarity", reward.rarity.color);
        button.innerHTML = `
            <span class="reward-icon">${reward.icon}</span>
            <span class="reward-rarity">${reward.rarity.name}</span>
            <span class="reward-name">${reward.name}</span>
            <span class="reward-description">${reward.description}</span>
            <span class="reward-stat">
                ${formatRewardSelectionValue(reward)}
                <span class="reward-total">After picking: ${formatProjectedRewardValue(reward)}</span>
            </span>
        `;
        button.addEventListener("click", () => {
            run.choose(reward);
            updateRunStats();
            rewardScreen.classList.add("hidden");
            restart.textContent = "Play Again";
            openRabbitShop(`${reward.icon} ${reward.name} added for this run!`);
        });
        rewardChoices.append(button);
    }

    rewardScreen.classList.remove("hidden");
}

function triggerLaser() {
    const horizontal = Math.random() < 0.5;
    game.laser = {
        phase: "warning",
        timer: 0.9,
        cooldown: 0,
        horizontal,
        coordinate: horizontal ? Math.round(game.player.y) : Math.round(game.player.x)
    };
}

function updateLaser(deltaTime) {
    if (!hasEnemyGear("laser")) return;

    if (game.enemyStartDelay > 0 || game.enemy.isHarmless()) {
        return;
    }

    if (!game.laser) {
        game.laser = { phase: "cooldown", timer: 3.5, cooldown: 0 };
    }

    game.laser.timer -= deltaTime;
    if (game.laser.timer > 0) return;

    if (game.laser.phase === "cooldown") {
        triggerLaser();
        return;
    }

    if (game.laser.phase === "warning") {
        game.laser.phase = "firing";
        game.laser.timer = 0.22;

        const hit = game.laser.horizontal
            ? Math.abs(game.player.y - game.laser.coordinate) < 0.32
            : Math.abs(game.player.x - game.laser.coordinate) < 0.32;

        if (hit) {
            if (game.shieldCharges > 0) {
                game.shieldCharges -= 1;
                updateRunStats();
            } else {
                showResult("Zapped!", "The toilet's laser caught the 67 Kid.", true);
            }
        }
        return;
    }

    game.laser = { phase: "cooldown", timer: 4.2, cooldown: 0 };
}

function findPlungerPath(startX, startY, targetX, targetY) {
    const startKey = `${startX},${startY}`;
    const targetKey = `${targetX},${targetY}`;
    const queue = [{ x: startX, y: startY }];
    const visited = new Set([startKey]);
    const parent = new Map();

    while (queue.length) {
        const current = queue.shift();
        const currentKey = `${current.x},${current.y}`;
        if (currentKey === targetKey) break;

        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const next = { x: current.x + dx, y: current.y + dy };
            const nextKey = `${next.x},${next.y}`;
            if (!visited.has(nextKey) && maze.isFloor(next.x, next.y)) {
                visited.add(nextKey);
                parent.set(nextKey, currentKey);
                queue.push(next);
            }
        }
    }

    if (!visited.has(targetKey)) return [];

    const path = [];
    let key = targetKey;
    while (key !== startKey) {
        const [x, y] = key.split(",").map(Number);
        path.unshift({ x, y });
        key = parent.get(key);
    }
    return path;
}

function updatePlungerCannon(deltaTime) {
    if (!hasEnemyGear("plungerCannon")) return;

    if (game.plunger) {
        game.plunger.life -= deltaTime;
        let remainingMovement = game.plunger.speed * deltaTime;

        while (remainingMovement > 0 && game.plunger.path.length) {
            const target = game.plunger.path[0];
            const dx = target.x - game.plunger.x;
            const dy = target.y - game.plunger.y;
            const distance = Math.hypot(dx, dy);

            if (distance <= remainingMovement) {
                game.plunger.x = target.x;
                game.plunger.y = target.y;
                game.plunger.path.shift();
                remainingMovement -= distance;
            } else {
                game.plunger.x += dx / distance * remainingMovement;
                game.plunger.y += dy / distance * remainingMovement;
                remainingMovement = 0;
            }
        }

        const hitPlayer = Math.hypot(
            game.player.x - game.plunger.x,
            game.player.y - game.plunger.y
        ) < 0.38;

        if (hitPlayer) {
            game.plunger = null;
            if (game.shieldCharges > 0) {
                game.shieldCharges -= 1;
                updateRunStats();
            } else {
                showResult("Plunged!", "The toilet's Plunger Cannon caught the 67 Kid.", true);
            }
        } else if (!game.plunger.path.length || game.plunger.life <= 0) {
            game.plunger = null;
        }
        return;
    }

    if (game.enemyStartDelay > 0 || game.enemy.isHarmless()) return;

    game.plungerCooldown -= deltaTime;
    if (game.plungerCooldown > 0) return;

    const startX = Math.round(game.enemy.x);
    const startY = Math.round(game.enemy.y);
    const path = findPlungerPath(
        startX,
        startY,
        Math.round(game.player.x),
        Math.round(game.player.y)
    );
    if (!path.length) {
        game.plungerCooldown = 1;
        return;
    }

    const toiletSpeed =
        game.enemy.speed *
        game.enemy.slowMultiplier *
        game.enemy.gearSpeedMultiplier *
        game.enemy.burstSpeedMultiplier;
    game.plunger = {
        x: startX,
        y: startY,
        path,
        speed: Math.max(6, toiletSpeed * 1.4),
        life: 8
    };
    game.plungerCooldown = 5;
}

function pullPlayerTowardToilet() {
    if (game.player.moving) return false;

    const dx = game.enemy.x - game.player.x;
    const dy = game.enemy.y - game.player.y;
    const directions = Math.abs(dx) >= Math.abs(dy)
        ? [[Math.sign(dx), 0], [0, Math.sign(dy)]]
        : [[0, Math.sign(dy)], [Math.sign(dx), 0]];

    for (const [moveX, moveY] of directions) {
        if ((moveX || moveY) && maze.isFloor(
            Math.round(game.player.x) + moveX,
            Math.round(game.player.y) + moveY
        )) {
            game.player.move(moveX, moveY, maze);
            return true;
        }
    }
    return false;
}

function updateMagneticFlush(deltaTime) {
    if (!hasEnemyGear("magneticFlush")) return;
    if (game.enemyStartDelay > 0 || game.enemy.isHarmless()) return;

    if (game.magneticFlush) {
        game.magneticFlush.timer -= deltaTime;
        if (game.magneticFlush.timer <= 0 && pullPlayerTowardToilet()) {
            game.magneticFlush = null;
            game.magneticFlushCooldown = 6.5;
            renderer.triggerShake(5, 0.2);
        }
        return;
    }

    game.magneticFlushCooldown -= deltaTime;
    if (game.magneticFlushCooldown <= 0) {
        game.magneticFlush = { timer: 0.9 };
    }
}

function updateSpringSeat(deltaTime) {
    if (!hasEnemyGear("springSeat") || game.enemy.ghostMode) return;
    if (game.enemyStartDelay > 0 || game.enemy.isHarmless()) return;

    game.springSeatCooldown -= deltaTime;
    if (
        game.springSeatCooldown > 0 ||
        Math.abs(game.enemy.x - Math.round(game.enemy.x)) > 0.08 ||
        Math.abs(game.enemy.y - Math.round(game.enemy.y)) > 0.08
    ) return;

    const startX = Math.round(game.enemy.x);
    const startY = Math.round(game.enemy.y);
    const jumps = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        .map(([dx, dy]) => ({
            x: startX + dx * 2,
            y: startY + dy * 2,
            wallX: startX + dx,
            wallY: startY + dy
        }))
        .filter(jump =>
            !maze.isFloor(jump.wallX, jump.wallY) &&
            maze.isFloor(jump.x, jump.y)
        )
        .sort((a, b) =>
            Math.hypot(a.x - game.player.x, a.y - game.player.y) -
            Math.hypot(b.x - game.player.x, b.y - game.player.y)
        );

    if (jumps.length) {
        resetEntity(game.enemy, jumps[0].x, jumps[0].y);
        renderer.triggerShake(6, 0.18);
    }
    game.springSeatCooldown = 5.5;
}

function updateDoubleFlush(deltaTime) {
    if (!hasEnemyGear("doubleFlush")) return;

    game.doubleFlushTimer -= deltaTime;
    if (game.doubleFlushTimer > 0) return;

    if (game.doubleFlushPhase === "cooldown") {
        game.doubleFlushPhase = "warning";
        game.doubleFlushTimer = 0.9;
        return;
    }

    if (game.doubleFlushPhase === "warning") {
        game.doubleFlushPhase = "active";
        game.doubleFlushTimer = 1.5;
        game.enemy.burstSpeedMultiplier = 1.6;
        return;
    }

    game.doubleFlushPhase = "cooldown";
    game.doubleFlushTimer = 6.5;
    game.enemy.burstSpeedMultiplier = 1;
}

function chooseDecoyLocation() {
    const candidates = [];
    for (let y = 1; y < maze.height - 1; y++) {
        for (let x = 1; x < maze.width - 1; x++) {
            if (
                maze.isFloor(x, y) &&
                Math.hypot(x - game.player.x, y - game.player.y) > 3 &&
                Math.hypot(x - game.enemy.x, y - game.enemy.y) > 4
            ) candidates.push({ x, y });
        }
    }
    return candidates[Math.floor(Math.random() * candidates.length)] || null;
}

function updateDecoyDuck(deltaTime) {
    if (!hasEnemyGear("decoyDuck")) return;

    if (game.decoyDuck) {
        game.decoyDuck.timer -= deltaTime;
        if (game.decoyDuck.timer <= 0) {
            game.decoyDuck = null;
            game.decoyDuckCooldown = 7;
        }
        return;
    }

    game.decoyDuckCooldown -= deltaTime;
    if (game.decoyDuckCooldown <= 0) {
        const location = chooseDecoyLocation();
        if (location) game.decoyDuck = { ...location, timer: 2.5 };
        else game.decoyDuckCooldown = 1;
    }
}

function placeSewerHatches() {
    game.sewerHatches = [];
    if (!hasEnemyGear("sewerHatch")) return;

    const candidates = [];
    for (let y = 1; y < maze.height - 1; y++) {
        for (let x = 1; x < maze.width - 1; x++) {
            if (
                maze.isFloor(x, y) &&
                Math.hypot(x - 1, y - 1) > 3 &&
                Math.hypot(x - game.exit.x, y - game.exit.y) > 2 &&
                (!game.carrot || x !== game.carrot.x || y !== game.carrot.y)
            ) candidates.push({ x, y, active: true });
        }
    }

    while (game.sewerHatches.length < 3 && candidates.length) {
        game.sewerHatches.push(
            candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0]
        );
    }
}

function checkSewerHatchTrap() {
    if (game.playerTrapTimer > 0) return;
    const hatch = game.sewerHatches.find(item =>
        item.active &&
        Math.hypot(game.player.x - item.x, game.player.y - item.y) < 0.28
    );
    if (!hatch) return;

    hatch.active = false;
    game.playerTrapTimer = 1.5;
    resetEntity(game.player, Math.round(game.player.x), Math.round(game.player.y));
    renderer.triggerShake(5, 0.2);
}

function checkCharacterStepPerk() {
    if (game.player.moving) return;

    const stepKey = `${Math.round(game.player.x)},${Math.round(game.player.y)}`;
    if (stepKey === game.lastPlayerStepKey) return;

    game.lastPlayerStepKey = stepKey;

    const completedSteps = Math.max(
        1,
        game.player.pendingStepCount || 0
    );
    game.player.pendingStepCount = 0;

    let sneakyTriggered = false;
    for (let step = 0; step < completedSteps; step++) {
        if (
            game.character.sneakyChance &&
            Math.random() < game.character.sneakyChance
        ) {
            sneakyTriggered = true;
        }
    }

    if (sneakyTriggered) {
        game.invisible = true;
        game.invisibilityTimer = Math.max(game.invisibilityTimer, 1);
        game.lastSeenPosition = {
            x: Math.round(game.player.x),
            y: Math.round(game.player.y)
        };
        game.enemy.confuse(1);
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
    game.sewerHatches = [];

    game.shieldCharges = 0;
    game.wallCutterTimer = 0;
    game.playerTrapTimer = 0;

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

    game.enemy.gearSpeedMultiplier =
        (hasEnemyGear("turboTank") ? 1.12 : 1) *
        (hasEnemyGear("ghost") ? 0.75 : 1) *
        (1 + getEnemyLevelSpeedBonus()) *
        (1 - Math.min(0.35, run.total("toiletSlow")));

    game.enemy.ghostMode = hasEnemyGear("ghost");

    game.player.baseSpeed = getPlayerBaseSpeed();
    game.player.speed = game.player.baseSpeed;
    game.shieldCharges = getRunShieldCharges();
    game.enemyStartDelay =
        run.total("headStart") * (game.character.headStartMultiplier || 1);
    game.laser = null;
    game.plunger = null;
    game.plungerCooldown = 2.5;
    game.magneticFlush = null;
    game.magneticFlushCooldown = 3.5;
    game.springSeatCooldown = 3.5;
    game.enemyArmorHits = hasEnemyGear("armor") ? 3 : 0;
    game.doubleFlushPhase = "cooldown";
    game.doubleFlushTimer = 4;
    game.decoyDuck = null;
    game.decoyDuckCooldown = 4;
    game.lastPlayerStepKey = "1,1";

    updateRunStats();

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
    game.enemyGear = rollToiletGear(run.level);

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
    placeSewerHatches();
    updateRunStats();

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

    const personalityLines = [
        game.enemy.personality.description ||
            "Can you escape before it catches you?",
        `Run level ${run.level}. Toilet level-speed bonus: +${Math.round(getEnemyLevelSpeedBonus() * 100)}%.`
    ];

    if (game.enemyGear.length) {
        personalityLines.push(
            "EQUIPMENT:",
            ...game.enemyGear.map(
                item => `${item.icon} ${item.name} — ${item.description}`
            )
        );
    } else {
        personalityLines.push("No equipment this time.");
    }

    personalityDescription.textContent = personalityLines.join("\n");

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
        if (absorbEnemyArmorHit()) {
            achievements.useItem(itemId);
            updatePowerupUI();
            return;
        }

        game.enemy.freeze(
            3 + run.total("extraFreeze")
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
            game.shieldCharges > 0
        ) {
            return;
        }

        game.shieldCharges += 1;

        achievements.useItem(
            itemId
        );

        updateRunStats();
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
        "wallCutter"
    ) {
        game.wallCutterTimer = Math.max(game.wallCutterTimer, 2);
        achievements.useItem(itemId);
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

    game.lastPlayerStepKey = `${x},${y}`;

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

    victoryCharacterImage.classList.add("hidden");

    hideTeleportPrompt();

    updatePowerupUI();

    title.textContent =
        resultTitle;

    if (caught) {
        const streakResult =
            achievements.recordDefeat();

        run.reset();
        game.enemyGear = [];
        game.shieldCharges = 0;
        updateRunStats();

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

    const runBonusCarrots = Math.floor(run.total("carrotLuck"));
    for (let index = 0; index < runBonusCarrots; index++) {
        achievements.addCarrot();
    }

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

    victoryCharacterImage.src = game.character.victory;
    victoryCharacterImage.alt = `${game.character.name} celebrating`;
    victoryCharacterImage.classList.remove("hidden");

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
        "CHOOSE A RUN REWARD →";

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

    game.wallCutterTimer = Math.max(0, game.wallCutterTimer - deltaTime);
    game.playerTrapTimer = Math.max(0, game.playerTrapTimer - deltaTime);

    if (game.playerTrapTimer <= 0) {
        game.player.update(deltaTime);
    }

    checkSewerHatchTrap();

    checkCharacterStepPerk();

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

    if (hasEnemyGear("tracking")) {
        toiletTarget = game.player;
    }

    const enemyWaiting = game.enemyStartDelay > 0;
    game.enemyStartDelay = Math.max(0, game.enemyStartDelay - deltaTime);
    game.enemy.update(
        deltaTime,
        maze,
        toiletTarget,
        enemyWaiting
    );

    updateLaser(deltaTime);
    updatePlungerCannon(deltaTime);
    updateMagneticFlush(deltaTime);
    updateSpringSeat(deltaTime);
    updateDoubleFlush(deltaTime);
    updateDecoyDuck(deltaTime);

    if (game.state !== "playing") {
        return;
    }

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
            if (absorbEnemyArmorHit()) {
                game.bananas.splice(index, 1);
                continue;
            }

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
        0.55 &&
        !game.enemy.isHarmless()
    ) {
        if (
            game.shieldCharges > 0 &&
            !hasEnemyGear("wreckingBall")
        ) {
            game.shieldCharges -= 1;

            updateRunStats();

            resetEntity(
                game.enemy,
                1,
                1
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
        "playing" ||
        game.playerTrapTimer > 0
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
            maze,
            hasEnemyGear("overflowed") && Math.random() < 0.25
                ? 2
                : 1,
            game.wallCutterTimer > 0
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
                "wallCutter"
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
            if (achievements.currentStreak > 0) {
                achievements.recordDefeat();
                updateStreakUI();
            }
            run.reset();
            game.shieldCharges = 0;
            updateRunStats();
            showCharacterSelection();
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

            showRewardChoices();

            return;
        }

        /*
         * After being caught:
         * start another maze normally.
         */
        showCharacterSelection();
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
showCharacterSelection();

requestAnimationFrame(
    loop
);
