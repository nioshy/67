import { Maze } from "./maze.js";
import { Renderer } from "./renderer.js";
import { Player } from "./player.js";
import { Enemy } from "./enemy.js";
import { Achievements } from "./achievements.js";

const $ = id => document.getElementById(id);

const canvas = $("game");
const timer = $("timer");
const stars = $("stars-display");
const overlay = $("overlay");
const title = $("message-title");
const message = $("message-text");
const starMessage = $("star-message");
const unlockMessage = $("unlock-message");
const restart = $("restart-button");
const galleryButton = $("gallery-button");
const gallery = $("gallery-screen");
const closeGallery = $("close-gallery-button");
const galleryProgress = $("gallery-progress");
const galleryStars = $("gallery-stars");
const galleryGrid = $("gallery-grid");
const viewer = $("photo-viewer");
const closePhoto = $("close-photo-button");
const largePhoto = $("large-photo");
const largeTitle = $("large-photo-title");
const largeCaption = $("large-photo-caption");
const toiletPersonality = $("toilet-personality");
const personalityName = $("personality-name");
const personalityDescription = $("personality-description");
const startEscapeButton = $("start-escape-button");
const renderer = new Renderer(canvas);
const maze = new Maze(21, 13);
const achievements = new Achievements();

const game = {
    maze,
    exit: null,
    player: new Player(1, 1),
    enemy: new Enemy(19, 11),
    state: "playing",
    startTime: 0,
    elapsedTime: 0
};

let previous = performance.now();

function resetEntity(entity, x, y) {
    entity.x = x;
    entity.y = y;
    entity.targetX = x;
    entity.targetY = y;
    entity.moving = false;
}

function updateStars() {
    stars.textContent = `⭐ ${achievements.totalStars}`;
}

function generateLevel() {
    maze.generate();

    game.enemy.choosePersonality();

    game.exit = maze.findFurthest(1, 1);

    resetEntity(game.player, 1, 1);
    resetEntity(
        game.enemy,
        game.exit.x,
        game.exit.y
    );

    /*
     * The level is ready, but nothing moves yet.
     */
    game.state = "waiting";

    game.elapsedTime = 0;

    timer.textContent = "Time: 0.0";

    starMessage.classList.add("hidden");
    unlockMessage.classList.add("hidden");
    overlay.classList.add("hidden");

    renderer.stopDefeatAnimation();

    renderer.cameraX = canvas.width / 2;
    renderer.cameraY = canvas.height / 2;

    /*
     * Show the toilet personality.
     */
    personalityName.textContent =
    game.enemy.personality.name;

    personalityDescription.textContent =
        game.enemy.personality.description ||
        "Can you escape before it catches you?";

    toiletPersonality.classList.remove("hidden");
}

startEscapeButton.addEventListener(
    "click",
    () => {
        toiletPersonality.classList.add("hidden");

        game.state = "playing";
        game.startTime = performance.now();
        game.elapsedTime = 0;

        timer.textContent = "Time: 0.0";
    }
);

function showResult(resultTitle, text, caught = false) {
    game.state = "finished";

    title.textContent = resultTitle;
    message.textContent = text;

    if (caught) {
        renderer.triggerShake(22, 1.4);
        renderer.startDefeatAnimation();

        setTimeout(() => {
            renderer.stopDefeatAnimation();
            overlay.classList.remove("hidden");
        }, 1500);

        return;
    }

    overlay.classList.remove("hidden");
}

function win() {
    const reward = achievements.awardStars(game.elapsedTime);

    updateStars();

    starMessage.textContent =
        `You earned ${reward.earnedStars} ` +
        `${reward.earnedStars === 1 ? "star" : "stars"}!`;

    starMessage.classList.remove("hidden");

    if (reward.newPhotos.length) {
        unlockMessage.textContent =
            `New memory unlocked: ` +
            `${reward.newPhotos.map(photo => photo.title).join(", ")}!`;

        unlockMessage.classList.remove("hidden");
    } else {
        const starsNeeded =
            achievements.getStarsNeededForNextPhoto();

        if (starsNeeded) {
            unlockMessage.textContent =
                `${starsNeeded} more ` +
                `${starsNeeded === 1 ? "star" : "stars"} ` +
                `until the next memory.`;

            unlockMessage.classList.remove("hidden");
        }
    }

    showResult(
        "You Escaped!",
        `Escape time: ${game.elapsedTime.toFixed(1)} seconds.`
    );
}

function update(deltaTime) {
    if (game.state !== "playing") {
        return;
    }

    game.elapsedTime =
        (performance.now() - game.startTime) / 1000;

    timer.textContent =
        `Time: ${game.elapsedTime.toFixed(1)}`;

    game.player.update(deltaTime);
    game.enemy.update(deltaTime, maze, game.player);

    const enemyDistance = Math.hypot(
        game.player.x - game.enemy.x,
        game.player.y - game.enemy.y
    );

    const exitDistance = Math.hypot(
        game.player.x - game.exit.x,
        game.player.y - game.exit.y
    );

    if (enemyDistance < 0.55) {
        showResult(
            "Caught!",
            "The toilet caught the 67 Kid.",
            true
        );
    } else if (exitDistance < 0.25) {
        win();
    }
}

function loop(now) {
    const deltaTime =
        Math.min((now - previous) / 1000, 0.05);

    previous = now;

    update(deltaTime);
    renderer.render(game);

    requestAnimationFrame(loop);
}

function move(direction) {
    if (game.state !== "playing") {
        return;
    }

    const directions = {
        up: [0, -1],
        down: [0, 1],
        left: [-1, 0],
        right: [1, 0]
    };

    const movement = directions[direction];

    if (movement) {
        game.player.move(
            movement[0],
            movement[1],
            maze
        );
    }
}

/* Keyboard controls */

addEventListener("keydown", event => {
    const key = event.key.toLowerCase();

    const keyMap = {
        arrowup: "up",
        w: "up",
        arrowdown: "down",
        s: "down",
        arrowleft: "left",
        a: "left",
        arrowright: "right",
        d: "right"
    };

    if (keyMap[key]) {
        event.preventDefault();
        move(keyMap[key]);
    }

    if (key === "r") {
        generateLevel();
    }

    if (key === "escape") {
        viewer.classList.add("hidden");
        gallery.classList.add("hidden");
    }
});

/* Touch controls */

const touchControls =
    document.querySelector(".touch-controls");

const touchButtons =
    document.querySelectorAll(
        ".touch-controls button[data-dir]"
    );

touchButtons.forEach(button => {
    button.addEventListener(
        "pointerdown",
        event => {
            event.preventDefault();
            event.stopPropagation();

            move(button.dataset.dir);

            if (button.setPointerCapture) {
                try {
                    button.setPointerCapture(
                        event.pointerId
                    );
                } catch {
                    // Some Safari versions may reject capture.
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
});

if (touchControls) {
    touchControls.addEventListener(
        "touchstart",
        event => {
            event.preventDefault();
        },
        { passive: false }
    );

    touchControls.addEventListener(
        "touchmove",
        event => {
            event.preventDefault();
        },
        { passive: false }
    );

    touchControls.addEventListener(
        "dblclick",
        event => {
            event.preventDefault();
        }
    );
}

restart.onclick = generateLevel;

/* Gallery */

function renderGallery() {
    galleryGrid.innerHTML = "";

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

    achievements.photos.forEach((photo, index) => {
        const card =
            document.createElement("article");

        card.className = "gallery-card";

        if (achievements.isUnlocked(index)) {
            const image =
                document.createElement("img");

            image.src = photo.file;
            image.alt = photo.title;

            image.onerror = () => {
                image.style.display = "none";
            };

            const heading =
                document.createElement("h3");

            heading.textContent = photo.title;

            card.append(image, heading);

            card.onclick = () => {
                largePhoto.src = photo.file;
                largeTitle.textContent = photo.title;
                largeCaption.textContent = photo.caption;

                viewer.classList.remove("hidden");
            };
        } else {
            card.classList.add("locked");

            const placeholder =
                document.createElement("div");

            placeholder.className =
                "locked-placeholder";

            placeholder.textContent =
                `Memory ${index + 1}`;

            const heading =
                document.createElement("h3");

            heading.textContent = "Locked";

            card.append(placeholder, heading);
        }

        galleryGrid.append(card);
    });
}

galleryButton.onclick = () => {
    renderGallery();
    gallery.classList.remove("hidden");
};

closeGallery.onclick = () => {
    gallery.classList.add("hidden");
};

closePhoto.onclick = () => {
    viewer.classList.add("hidden");
};

viewer.onclick = event => {
    if (event.target === viewer) {
        viewer.classList.add("hidden");
    }
};

/* Start game */

updateStars();
generateLevel();
requestAnimationFrame(loop);