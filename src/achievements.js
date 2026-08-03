// src/achievements.js

export class Achievements {
    constructor() {
        this.storageKey =
            "67-kid-achievement-progress";

        this.starsPerPhoto = 5;

        this.photos = [];

        const numberOfPhotos = 40;

        for (
            let number = 1;
            number <= numberOfPhotos;
            number++
        ) {
            const fileNumber =
                String(number).padStart(
                    2,
                    "0"
                );

            this.photos.push({
                title:
                    `Holiday Memory ${number}`,

                caption:
                    "A family holiday memory.",

                file:
                    `./assets/holidays/${fileNumber}.jpg`
            });
        }

        /*
         * Rabbit shop catalogue
         */
        this.shopItems = [
            {
                id: "banana",
                name: "Banana Skin",
                icon: "🍌",
                price: 3,
                description:
                    "Drop it behind you to slow the toilet."
            },
            {
                id: "turboShoes",
                name: "Turbo Shoes",
                icon: "👟",
                price: 5,
                description:
                    "Run faster for a short time."
            },
            {
                id: "freezeBomb",
                name: "Freeze Bomb",
                icon: "🧊",
                price: 8,
                description:
                    "Freeze the toilet for a few seconds."
            },
            {
                id: "shield",
                name: "Shield",
                icon: "🛡️",
                price: 10,
                description:
                    "Protect yourself from one toilet attack."
            },
            {
                id: "invisibilityCloak",
                name: "Invisibility Cloak",
                icon: "🥷",
                price: 12,
                description:
                    "The toilet loses sight of you for a few seconds."
            },
            {
                id: "wallCutter",
                name: "Wall Cutter",
                icon: "✂️",
                price: 15,
                description:
                    "Pass through maze walls for 2 seconds."
            }
        ];

        const savedProgress =
            this.load();

        this.totalStars =
            savedProgress.totalStars;

        this.unlockedCount =
            savedProgress.unlockedCount;

        this.carrots =
            savedProgress.carrots;

        this.inventory =
            savedProgress.inventory;

        this.currentStreak =
            savedProgress.currentStreak;

        this.bestStreak =
            savedProgress.bestStreak;
    }


    /* =====================================================
       INVENTORY
       ===================================================== */

    getEmptyInventory() {
        return {
            banana: 0,
            turboShoes: 0,
            freezeBomb: 0,
            shield: 0,
            invisibilityCloak: 0,
            wallCutter: 0
        };
    }


    /* =====================================================
       LOAD / SAVE
       ===================================================== */

    load() {
        try {
            const savedText =
                localStorage.getItem(
                    this.storageKey
                );

            if (!savedText) {
                return {
                    totalStars: 0,
                    unlockedCount: 0,
                    carrots: 0,
                    currentStreak: 0,
                    bestStreak: 0,
                    inventory:
                        this.getEmptyInventory()
                };
            }

            const saved =
                JSON.parse(savedText);

            const savedInventory =
                saved.inventory || {};

            const inventory =
                this.getEmptyInventory();

            for (
                const itemId
                of Object.keys(inventory)
            ) {
                inventory[itemId] =
                    Math.max(
                        0,
                        Number(
                            savedInventory[itemId]
                        ) || 0
                    );
            }

            if (!("wallCutter" in savedInventory) && savedInventory.teleport) {
                inventory.wallCutter = Math.max(0, Number(savedInventory.teleport) || 0);
            }

            return {
                totalStars:
                    Math.max(
                        0,
                        Number(
                            saved.totalStars
                        ) || 0
                    ),

                unlockedCount:
                    Math.min(
                        this.photos.length,
                        Math.max(
                            0,
                            Number(
                                saved.unlockedCount
                            ) || 0
                        )
                    ),

                carrots:
                    Math.max(
                        0,
                        Number(
                            saved.carrots
                        ) || 0
                    ),

                currentStreak:
                    Math.max(
                        0,
                        Number(
                            saved.currentStreak
                        ) || 0
                    ),

                bestStreak:
                    Math.max(
                        0,
                        Number(
                            saved.bestStreak
                        ) || 0
                    ),

                inventory
            };
        } catch (error) {
            console.warn(
                "Could not load achievement progress.",
                error
            );

            return {
                totalStars: 0,
                unlockedCount: 0,
                carrots: 0,
                currentStreak: 0,
                bestStreak: 0,
                inventory:
                    this.getEmptyInventory()
            };
        }
    }


    save() {
        try {
            localStorage.setItem(
                this.storageKey,

                JSON.stringify({
                    totalStars:
                        this.totalStars,

                    unlockedCount:
                        this.unlockedCount,

                    carrots:
                        this.carrots,

                    currentStreak:
                        this.currentStreak,

                    bestStreak:
                        this.bestStreak,

                    inventory:
                        this.inventory
                })
            );
        } catch (error) {
            console.warn(
                "Could not save achievement progress.",
                error
            );
        }
    }


    /* =====================================================
       CARROTS
       ===================================================== */

    addCarrot() {
        this.carrots += 1;

        this.save();
    }


    spendCarrots(amount) {
        if (
            this.carrots <
            amount
        ) {
            return false;
        }

        this.carrots -=
            amount;

        this.save();

        return true;
    }


    /* =====================================================
       WIN STREAKS
       ===================================================== */

    recordWin() {
        this.currentStreak += 1;

        if (
            this.currentStreak >
            this.bestStreak
        ) {
            this.bestStreak =
                this.currentStreak;
        }

        let bonusCarrots = 0;

        /*
         * Streak rewards:
         *
         * 1 win      = +0
         * 2 wins     = +1
         * 3-4 wins   = +2
         * 5+ wins    = +3
         */

        if (
            this.currentStreak >= 5
        ) {
            bonusCarrots = 3;
        } else if (
            this.currentStreak >= 3
        ) {
            bonusCarrots = 2;
        } else if (
            this.currentStreak >= 2
        ) {
            bonusCarrots = 1;
        }

        this.carrots +=
            bonusCarrots;

        this.save();

        return {
            currentStreak:
                this.currentStreak,

            bestStreak:
                this.bestStreak,

            bonusCarrots
        };
    }


    recordDefeat() {
        const previousStreak =
            this.currentStreak;

        this.currentStreak = 0;

        this.save();

        return {
            previousStreak,
            bestStreak:
                this.bestStreak
        };
    }


    /* =====================================================
       SHOP
       ===================================================== */

    getShopItem(itemId) {
        return (
            this.shopItems.find(
                item =>
                    item.id === itemId
            ) || null
        );
    }


    buyItem(itemId) {
        const item =
            this.getShopItem(
                itemId
            );

        if (!item) {
            return {
                success: false,
                reason: "unknown-item"
            };
        }

        if (
            this.carrots <
            item.price
        ) {
            return {
                success: false,
                reason:
                    "not-enough-carrots",
                item
            };
        }

        this.carrots -=
            item.price;

        this.inventory[itemId] =
            (
                this.inventory[itemId] ||
                0
            ) + 1;

        this.save();

        return {
            success: true,
            item
        };
    }


    useItem(itemId) {
        const amount =
            this.inventory[itemId] ||
            0;

        if (amount <= 0) {
            return false;
        }

        this.inventory[itemId] =
            amount - 1;

        this.save();

        return true;
    }


    getItemCount(itemId) {
        return (
            this.inventory[itemId] ||
            0
        );
    }


    /* =====================================================
       STARS / MEMORIES
       ===================================================== */

    awardStars(escapeTime) {
        let earnedStars = 1;

        if (escapeTime < 16) {
            earnedStars += 1;
        }

        if (escapeTime < 12) {
            earnedStars += 1;
        }

        this.totalStars +=
            earnedStars;

        const previousUnlocked =
            this.unlockedCount;

        const unlockedFromStars =
            Math.floor(
                this.totalStars /
                this.starsPerPhoto
            );

        this.unlockedCount =
            Math.min(
                this.photos.length,
                unlockedFromStars
            );

        this.save();

        const newPhotos = [];

        for (
            let index =
                previousUnlocked;

            index <
                this.unlockedCount;

            index++
        ) {
            newPhotos.push(
                this.photos[index]
            );
        }

        return {
            earnedStars,
            newPhotos
        };
    }


    isUnlocked(index) {
        return (
            index <
            this.unlockedCount
        );
    }


    getRemainingCount() {
        return (
            this.photos.length -
            this.unlockedCount
        );
    }


    getStarsTowardNextPhoto() {
        if (
            this.unlockedCount >=
            this.photos.length
        ) {
            return this.starsPerPhoto;
        }

        return (
            this.totalStars %
            this.starsPerPhoto
        );
    }


    getStarsNeededForNextPhoto() {
        if (
            this.unlockedCount >=
            this.photos.length
        ) {
            return 0;
        }

        return (
            this.starsPerPhoto -
            this.getStarsTowardNextPhoto()
        );
    }


    /* =====================================================
       STORAGE TEST
       ===================================================== */

    testStorage() {
        try {
            const testKey =
                "67-kid-storage-test";

            localStorage.setItem(
                testKey,
                "working"
            );

            const result =
                localStorage.getItem(
                    testKey
                );

            localStorage.removeItem(
                testKey
            );

            return (
                result ===
                "working"
            );
        } catch {
            return false;
        }
    }
}
