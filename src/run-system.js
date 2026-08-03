export const RARITIES = [
    { id: "common", name: "Common", color: "#aeb8c2", weight: 55 },
    { id: "uncommon", name: "Uncommon", color: "#58d26f", weight: 26 },
    { id: "rare", name: "Rare", color: "#4fa8ff", weight: 12 },
    { id: "epic", name: "Epic", color: "#bd70ff", weight: 5 },
    { id: "legendary", name: "Legendary", color: "#ffb52e", weight: 2 }
];

const REWARDS = [
    {
        id: "runner",
        icon: "👟",
        name: "Runner's Rhythm",
        description: "Move faster for the rest of this run.",
        values: [0.04, 0.07, 0.1, 0.14, 0.2]
    },
    {
        id: "headStart",
        icon: "⏳",
        name: "Head Start",
        description: "The toilet waits at the start of every maze.",
        values: [0.7, 1.1, 1.6, 2.2, 3]
    },
    {
        id: "shield",
        icon: "🛡️",
        name: "Pocket Shield",
        description: "Start each maze protected from one catch.",
        forcedRarity: "rare",
        repeatable: false,
        values: [1, 1, 1, 1, 1]
    },
    {
        id: "goldenShield",
        icon: "🌟",
        name: "Golden Shield",
        description: "Start each maze protected from two catches.",
        forcedRarity: "legendary",
        repeatable: false,
        values: [2, 2, 2, 2, 2]
    },
    {
        id: "carrotLuck",
        icon: "🥕",
        name: "Lucky Carrot",
        description: "Bank bonus carrots when you escape.",
        values: [1, 1, 2, 3, 5]
    },
    {
        id: "toiletSlow",
        icon: "🧻",
        name: "Tangled Roll",
        description: "All toilets move a little slower this run.",
        values: [0.03, 0.05, 0.08, 0.12, 0.17]
    },
    {
        id: "extraFreeze",
        icon: "❄️",
        name: "Super Freeze",
        description: "Freeze Bombs last longer this run.",
        values: [0.5, 0.9, 1.4, 2, 3]
    }
];

function weightedRarity(level, lootProfile = "normal") {
    const luck = Math.min(14, Math.max(0, level - 1) * 0.8);
    const weights = [
        55 - luck,
        26 + luck * 0.1,
        12 + luck * 0.2,
        5 + luck * 0.3,
        2 + luck * 0.4
    ];

    const profileMultipliers = {
        lucky: [1.15, 1.1, 1.05],
        unlucky: [0.85, 0.9, 0.95]
    };
    const multipliers = profileMultipliers[lootProfile];

    if (multipliers) {
        weights[2] *= multipliers[0];
        weights[3] *= multipliers[1];
        weights[4] *= multipliers[2];
        weights[0] = 100 - weights[1] - weights[2] - weights[3] - weights[4];
    }
    let roll = Math.random() * weights.reduce((sum, value) => sum + value, 0);
    return RARITIES.find((rarity, index) => ((roll -= weights[index]) <= 0)) || RARITIES[0];
}

export class RunSystem {
    constructor() {
        this.reset();
    }

    reset() {
        this.level = 1;
        this.rewards = [];
    }

    createChoices(count = 3, lootProfile = "normal", excludedIds = []) {
        const ownedRewardIds = new Set(this.rewards.map(reward => reward.id));
        const excludedRewardIds = new Set(excludedIds);
        const ownsGoldenShield = ownedRewardIds.has("goldenShield");
        const pool = REWARDS.filter(
            reward =>
                !excludedRewardIds.has(reward.id) &&
                !(ownsGoldenShield && (reward.id === "shield" || reward.id === "goldenShield")) &&
                (reward.repeatable !== false || !ownedRewardIds.has(reward.id))
        );
        const choices = [];
        while (choices.length < count && pool.length) {
            const rarity = weightedRarity(this.level, lootProfile);
            const eligible = pool.filter(
                reward => !reward.forcedRarity || reward.forcedRarity === rarity.id
            );
            const reward = eligible[Math.floor(Math.random() * eligible.length)];
            pool.splice(pool.indexOf(reward), 1);
            const rarityIndex = RARITIES.findIndex(item => item.id === rarity.id);
            choices.push({ ...reward, rarity, value: reward.values[rarityIndex] });
        }
        return choices;
    }

    choose(reward) {
        if (reward.id === "goldenShield") {
            this.rewards = this.rewards.filter(
                ownedReward =>
                    ownedReward.id !== "shield" &&
                    ownedReward.id !== "goldenShield"
            );
        }

        this.rewards.push(reward);
        this.level += 1;
    }

    total(id) {
        return this.rewards
            .filter(reward => reward.id === id)
            .reduce((sum, reward) => sum + reward.value, 0);
    }
}
