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

        const savedProgress =
            this.load();

        this.totalStars =
            savedProgress.totalStars;

        this.unlockedCount =
            savedProgress.unlockedCount;
    }

    load() {
        try {
            const savedText =
                localStorage.getItem(
                    this.storageKey
                );

            if (!savedText) {
                return {
                    totalStars: 0,
                    unlockedCount: 0
                };
            }

            const saved =
                JSON.parse(savedText);

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
                    )
            };
        } catch (error) {
            console.warn(
                "Could not load achievement progress.",
                error
            );

            return {
                totalStars: 0,
                unlockedCount: 0
            };
        }
    }

    save() {
        localStorage.setItem(
            this.storageKey,

            JSON.stringify({
                totalStars:
                    this.totalStars,

                unlockedCount:
                    this.unlockedCount
            })
        );
    }

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
}