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
        values: [1, 1, 1, 1, 1]
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

function weightedRarity(level) {
    const luck = Math.min(14, Math.max(0, level - 1) * 0.8);
    const weights = RARITIES.map((rarity, index) =>
        index === 0 ? Math.max(25, rarity.weight - luck) : rarity.weight + luck * index / 10
    );
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

    createChoices(count = 3) {
        const pool = [...REWARDS];
        const choices = [];
        while (choices.length < count && pool.length) {
            const reward = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
            const rarity = weightedRarity(this.level);
            const rarityIndex = RARITIES.findIndex(item => item.id === rarity.id);
            choices.push({ ...reward, rarity, value: reward.values[rarityIndex] });
        }
        return choices;
    }

    choose(reward) {
        this.rewards.push(reward);
        this.level += 1;
    }

    total(id) {
        return this.rewards
            .filter(reward => reward.id === id)
            .reduce((sum, reward) => sum + reward.value, 0);
    }
}
