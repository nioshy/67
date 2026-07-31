import { Maze } from "./maze.js";
import { Renderer } from "./renderer.js";
import { Player } from "./player.js";
import { Enemy } from "./enemy.js";
import { Achievements } from "./achievements.js";

const $ = id =>
    document.getElementById(id);


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const canvas =
    $("game");

const timer =
    $("timer");

const stars =
    $("stars-display");

const carrotsDisplay =
    $("carrots-display");

const overlay =
    $("overlay");

const title =
    $("message-title");

const message =
    $("message-text");

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


/* Toilet personality screen */

const toiletPersonality =
    $("toilet-personality");

const personalityName =
    $("personality-name");

const personalityDescription =
    $("personality-description");

const startEscapeButton =
    $("start-escape-button");


/* Rabbit shop */

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

    player:
        new Player(1, 1),

    enemy:
        new Enemy(19, 11),

    state:
        "playing",

    startTime: 0,

    elapsedTime: 0
};

let previous =
    performance.now();


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
    carrotsDisplay.textContent =
        `🥕 ${achievements.carrots}`;
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

            /*
             * Don't place it on
             * the player's start.
             */
            if (
                x === 1 &&
                y === 1
            ) {
                continue;
            }

            /*
             * Don't place it
             * on the exit.
             */
            if (
                game.exit &&
                x === game.exit.x &&
                y === game.exit.y
            ) {
                continue;
            }

            /*
             * Keep it a little
             * away from the start.
             */
            const distanceFromStart =
                Math.abs(
                    x - 1
                ) +
                Math.abs(
                    y - 1
                );

            if (
                distanceFromStart <
                4
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
   LEVEL GENERATION
   ========================================================= */

function generateLevel() {
    /*
     * Make sure other overlays
     * are closed first.
     */
    rabbitShop.classList.add(
        "hidden"
    );

    overlay.classList.add(
        "hidden"
    );

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

    /*
     * The maze exists,
     * but gameplay has not
     * started yet.
     */
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

    /*
     * Show this maze's
     * toilet personality.
     */
    personalityName.textContent =
        game.enemy.personality.name;

    personalityDescription.textContent =
        game.enemy.personality.description ||
        "Can you escape before it catches you?";

    toiletPersonality.classList.remove(
        "hidden"
    );
}


/* =========================================================
   START MAZE
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
    }
);


/* =========================================================
   RESULTS
   ========================================================= */

function showResult(
    resultTitle,
    text,
    caught = false
) {
    game.state =
        "finished";

    title.textContent =
        resultTitle;

    message.textContent =
        text;

    if (caught) {
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
    /*
     * Current carrot balance.
     */
    shopCarrots.textContent =
        `🥕 ${achievements.carrots}`;

    /*
     * Remove old shop cards.
     */
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


            /* Icon */

            const icon =
                document.createElement(
                    "div"
                );

            icon.className =
                "shop-item-icon";

            icon.textContent =
                item.icon;


            /* Information */

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


            /* Bottom row */

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

            /*
             * Disable only if
             * the player cannot afford it.
             */
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
                        shopMessage.textContent =
                            `${item.icon} ${item.name} added to your backpack!`;

                        updateCarrots();

                        /*
                         * Re-render so the
                         * carrot balance,
                         * inventory number
                         * and disabled buttons
                         * all update immediately.
                         */
                        renderRabbitShop();

                        /*
                         * renderRabbitShop()
                         * clears the message,
                         * so restore it.
                         */
                        shopMessage.textContent =
                            `${item.icon} ${item.name} added to your backpack!`;
                    } else if (
                        result.reason ===
                        "not-enough-carrots"
                    ) {
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

    /*
     * Make sure other screens
     * aren't sitting above it.
     */
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
    } else {
        const starsNeeded =
            achievements
                .getStarsNeededForNextPhoto();

        if (starsNeeded) {
            unlockMessage.textContent =
                `${starsNeeded} more ` +
                `${starsNeeded === 1
                    ? "star"
                    : "stars"} ` +
                `until the next memory.`;

            unlockMessage.classList.remove(
                "hidden"
            );
        }
    }

    /*
     * Instead of the old
     * victory overlay,
     * go directly to
     * the rabbit shop.
     */
    openRabbitShop();
}


/* =========================================================
   UPDATE GAME
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
        ) / 1000;

    timer.textContent =
        `Time: ${game.elapsedTime.toFixed(
            1
        )}`;

    game.player.update(
        deltaTime
    );

    game.enemy.update(
        deltaTime,
        maze,
        game.player
    );


    /* Carrot collection */

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
            achievements.addCarrot();

            game.carrot =
                null;

            updateCarrots();
        }
    }


    /* Toilet collision */

    const enemyDistance =
        Math.hypot(
            game.player.x -
                game.enemy.x,

            game.player.y -
                game.enemy.y
        );


    /* Exit collision */

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
        showResult(
            "Caught!",
            "The toilet caught the 67 Kid.",
            true
        );
    } else if (
        exitDistance <
        0.25
    ) {
        win();
    }
}


/* =========================================================
   MAIN RENDER LOOP
   ========================================================= */

function loop(
    now
) {
    const deltaTime =
        Math.min(
            (
                now -
                previous
            ) / 1000,
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

function move(
    direction
) {
    if (
        game.state !==
        "playing"
    ) {
        return;
    }

    const directions = {
        up:
            [0, -1],

        down:
            [0, 1],

        left:
            [-1, 0],

        right:
            [1, 0]
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
   KEYBOARD CONTROLS
   ========================================================= */

addEventListener(
    "keydown",
    event => {
        const key =
            event.key.toLowerCase();

        const keyMap = {
            arrowup:
                "up",

            w:
                "up",

            arrowdown:
                "down",

            s:
                "down",

            arrowleft:
                "left",

            a:
                "left",

            arrowright:
                "right",

            d:
                "right"
        };

        if (
            keyMap[key]
        ) {
            event.preventDefault();

            move(
                keyMap[key]
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
   TOUCH CONTROLS
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

                if (
                    button.setPointerCapture
                ) {
                    try {
                        button.setPointerCapture(
                            event.pointerId
                        );
                    } catch {
                        /*
                         * Some Safari
                         * versions reject
                         * pointer capture.
                         */
                    }
                }
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


if (
    touchControls
) {
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


    touchControls.addEventListener(
        "dblclick",
        event => {
            event.preventDefault();
        }
    );
}


/* =========================================================
   RESTART AFTER DEFEAT
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

            ? `⭐ ${achievements.totalStars} — ` +
              `All memories unlocked!`

            : `⭐ ${achievements.totalStars} — ` +
              `${achievements.getStarsTowardNextPhoto()} ` +
              `of ${achievements.starsPerPhoto} stars ` +
              `toward the next memory`;


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
   START GAME
   ========================================================= */

updateStars();

updateCarrots();

generateLevel();

requestAnimationFrame(
    loop
);