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
    }
];

export function rollToiletGear(level) {
    if (level < 2) return [];
    const available = TOILET_GEAR.filter(item => item.minLevel <= level);
    const count = level >= 8 ? 2 : 1;
    const result = [];
    while (result.length < count && available.length) {
        result.push(available.splice(Math.floor(Math.random() * available.length), 1)[0]);
    }
    return result;
}
