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

    /*
     * Carrot collected this maze,
     * but not banked until escape.
     */
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
    lastSeenPosition: null
};

let previous =
    performance.now();


/* =========================================================
   POWER-UP UI
   ========================================================= */

let powerupBar = null;

const powerupButtons =
    new Map();


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
   BASIC HELPERS
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
   RESET POWER-UP EFFECTS
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

    game.player.resetEffects();

    game.enemy.resetEffects();
}


/* =========================================================
   GENERATE LEVEL
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

    /*
     * A carrot from a failed /
     * abandoned maze is lost.
     */
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
   START LEVEL
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
   POWER-UPS
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

    /*
     * BANANA
     */
    if (
        itemId ===
        "banana"
    ) {
        const x =
            Math.round(
                game.player.x
            );

        const y =
            Math.round(
                game.player.y
            );

        game.bananas.push({
            x,
            y
        });
    }


    /*
     * TURBO SHOES
     */
    else if (
        itemId ===
        "turboShoes"
    ) {
        game.player
            .activateTurbo(
                8
            );
    }


    /*
     * FREEZE BOMB
     */
    else if (
        itemId ===
        "freezeBomb"
    ) {
        game.enemy.freeze(
            3
        );
    }


    /*
     * SHIELD
     */
    else if (
        itemId ===
        "shield"
    ) {
        /*
         * Don't waste another
         * shield if one is
         * already active.
         */
        if (
            game.shieldActive
        ) {
            return;
        }

        game.shieldActive =
            true;
    }


    /*
     * INVISIBILITY
     */
    else if (
        itemId ===
        "invisibilityCloak"
    ) {
        game.invisible =
            true;

        game.invisibilityTimer =
            5;

        /*
         * Toilet remembers the
         * last place it saw us.
         */
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
    }


    /*
     * TELEPORT
     */
    else if (
        itemId ===
        "teleport"
    ) {
        teleportPlayer();
    }


    /*
     * Consume item only after
     * successful activation.
     */
    achievements.useItem(
        itemId
    );

    updatePowerupUI();
}


function teleportPlayer() {
    const possibleTiles = [];

    const enemyX =
        Math.round(
            game.enemy.x
        );

    const enemyY =
        Math.round(
            game.enemy.y
        );

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

            const distanceFromEnemy =
                Math.abs(
                    x - enemyX
                ) +
                Math.abs(
                    y - enemyY
                );

            if (
                distanceFromEnemy <
                6
            ) {
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
        return;
    }

    const destination =
        possibleTiles[
            Math.floor(
                Math.random() *
                possibleTiles.length
            )
        ];

    resetEntity(
        game.player,
        destination.x,
        destination.y
    );

    renderer.triggerShake(
        6,
        0.2
    );
}


/* =========================================================
   DEFEAT / RESULTS
   ========================================================= */

function showResult(
    resultTitle,
    text,
    caught = false
) {
    game.state =
        "finished";

    updatePowerupUI();

    title.textContent =
        resultTitle;

    message.textContent =
        text;

    if (caught) {
        /*
         * Pending carrot is lost.
         */
        game.pendingCarrot =
            false;

        updateCarrots();

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

    overlay.classList.remove(
        "hidden"
    );
}


/* =========================================================
   RABBIT SHOP
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


function openRabbitShop() {
    game.state =
        "shop";

    updatePowerupUI();

    overlay.classList.add(
        "hidden"
    );

    toiletPersonality.classList.add(
        "hidden"
    );

    shopMessage.textContent =
        "";

    renderRabbitShop();

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
     * Bank the maze carrot only
     * if the player escaped.
     */
    if (
        game.pendingCarrot
    ) {
        achievements.addCarrot();

        game.pendingCarrot =
            false;

        updateCarrots();
    }

    const reward =
        achievements.awardStars(
            game.elapsedTime
        );

    updateStars();

    starMessage.textContent =
        `You earned ${reward.earnedStars} ` +
        `${reward.earnedStars === 1
            ? "star"
            : "stars"}!`;

    starMessage.classList.remove(
        "hidden"
    );

    if (
        reward.newPhotos.length
    ) {
        unlockMessage.textContent =
            `New memory unlocked: ` +
            `${reward.newPhotos
                .map(
                    photo =>
                        photo.title
                )
                .join(", ")}!`;

        unlockMessage.classList.remove(
            "hidden"
        );
    }

    openRabbitShop();
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


    /*
     * INVISIBILITY
     */

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
            /*
             * Toilet keeps chasing
             * the last position where
             * it saw the kid.
             */
            toiletTarget =
                game.lastSeenPosition;
        }
    }


    game.enemy.update(
        deltaTime,
        maze,
        toiletTarget
    );


    /*
     * CARROT COLLECTION
     */

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


    /*
     * BANANA COLLISIONS
     */

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


    /*
     * TOILET COLLISION
     */

    const enemyDistance =
        Math.hypot(
            game.player.x -
                game.enemy.x,

            game.player.y -
                game.enemy.y
        );


    /*
     * EXIT COLLISION
     */

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

            /*
             * Push toilet back
             * to give the kid
             * a chance to escape.
             */
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


        /*
         * Power-up shortcuts
         *
         * 1 Banana
         * 2 Turbo
         * 3 Freeze
         * 4 Shield
         * 5 Cloak
         * 6 Teleport
         */

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
   TOUCH MOVEMENT
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
    generateLevel;


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
   START
   ========================================================= */

createPowerupUI();

updateStars();
updateCarrots();

generateLevel();

requestAnimationFrame(
    loop
);