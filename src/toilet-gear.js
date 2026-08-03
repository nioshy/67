export const TOILET_GEAR = [
    {
        id: "armor",
        icon: "🛡️",
        name: "Chrome Armor",
        description: "Ignores bananas and Freeze Bombs.",
        minLevel: 2
    },
    {
        id: "laser",
        icon: "🔴",
        name: "Laser Goggles",
        description: "Periodically fires a warned laser toward you.",
        minLevel: 2
    },
    {
        id: "turboTank",
        icon: "🔥",
        name: "Turbo Tank",
        description: "Moves 12% faster.",
        minLevel: 3
    },
    {
        id: "tracking",
        icon: "📡",
        name: "Tracking Antenna",
        description: "Invisibility cannot fool it.",
        minLevel: 4
    },
    {
        id: "wreckingBall",
        icon: "🔨",
        name: "Wrecking Ball",
        description: "Physical catches smash through shields. Lasers do not.",
        minLevel: 6
    },
    {
        id: "ghost",
        icon: "👻",
        name: "Ghost Toilet",
        description: "Passes through walls, but moves 25% slower.",
        minLevel: 8
    },
    {
        id: "overflowed",
        icon: "🌊",
        name: "Overflowed Toilet",
        description: "Wet floors give every move a 25% chance to slide one extra tile.",
        minLevel: 6
    }
];

export function rollToiletGear(level) {
    if (level < 2) return [];
    const available = TOILET_GEAR.filter(item => item.minLevel <= level);
    const count = 1 + Math.floor(level / 5);
    const result = [];
    while (result.length < count && available.length) {
        result.push(available.splice(Math.floor(Math.random() * available.length), 1)[0]);
    }
    return result;
}
