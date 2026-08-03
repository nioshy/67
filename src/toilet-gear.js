export const TOILET_GEAR = [
    {
        id: "armor",
        icon: "🛡️",
        name: "Chrome Armor",
        description: "Blocks three banana or Freeze Bomb hits, then breaks.",
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
        id: "plungerCannon",
        icon: "🪠",
        name: "Plunger Cannon",
        description: "Fires a fast corridor-following plunger. Shields block it.",
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
        id: "magneticFlush",
        icon: "🧲",
        name: "Magnetic Flush",
        description: "Warns, then pulls you one floor tile toward the toilet.",
        minLevel: 5
    },
    {
        id: "springSeat",
        icon: "🦘",
        name: "Spring Seat",
        description: "Occasionally jumps over one wall toward you.",
        minLevel: 7
    },
    {
        id: "doubleFlush",
        icon: "⚡",
        name: "Double Flush",
        description: "After a 0.9s warning, moves 60% faster for 1.5s.",
        minLevel: 5
    },
    {
        id: "sewerHatch",
        icon: "🕳️",
        name: "Sewer Hatch",
        description: "Places floor traps that hold the player for 1.5 seconds.",
        minLevel: 6
    },
    {
        id: "decoyDuck",
        icon: "🦆",
        name: "Decoy Duck",
        description: "Creates a fake toilet for 2.5s while the real one fades.",
        minLevel: 7
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
        const item = available.splice(Math.floor(Math.random() * available.length), 1)[0];
        result.push(item);

        if (item.id === "ghost" || item.id === "springSeat") {
            const incompatibleId = item.id === "ghost" ? "springSeat" : "ghost";
            const incompatibleIndex = available.findIndex(gear => gear.id === incompatibleId);
            if (incompatibleIndex >= 0) available.splice(incompatibleIndex, 1);
        }
    }
    return result;
}
