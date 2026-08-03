export const CHARACTERS = [
    {
        id: "67-kid",
        name: "67 Kid",
        tagline: "A perfectly normal 67 Kid that makes YouTube videos.",
        ability: "Normal YouTube Kid",
        stats: ["Speed: 7.00 tiles/sec", "Standard reward luck", "No special perk"],
        speedMultiplier: 1,
        portrait: "./assets/characters/67-kid/portrait.png",
        victory: "./assets/characters/67-kid/victory.png"
    },
    {
        id: "arthur",
        name: "Arthur",
        tagline: "A surprisingly lucky kid that keeps getting cool stuff.",
        ability: "Lucky Kid",
        stats: ["Speed: −15%", "Rare chance: +15%", "Epic: +10% · Legendary: +5%"],
        speedMultiplier: 0.85,
        lootProfile: "lucky",
        portrait: "./assets/characters/arthur/portrait.png",
        victory: "./assets/characters/arthur/victory.png"
    },
    {
        id: "valder",
        name: "Valder",
        tagline: "A really fast-running kid that can outrun any toilet.",
        ability: "Speedy Kid",
        stats: ["Speed: +15%", "Rare chance: −15%", "Epic: −10% · Legendary: −5%"],
        speedMultiplier: 1.15,
        lootProfile: "unlucky",
        portrait: "./assets/characters/valder/portrait.png",
        victory: "./assets/characters/valder/victory.png"
    },
    {
        id: "napoleon",
        name: "Napoleon",
        tagline: "A sneaky cat that can drink from a toilet. 🤮",
        ability: "Sneaky Cat",
        stats: ["Standard speed", "5% Sneaky chance per step", "Sneaky: invisible for 1.0s"],
        speedMultiplier: 1,
        sneakyChance: 0.05,
        portrait: "./assets/characters/napoleon/portrait.png",
        victory: "./assets/characters/napoleon/victory.png"
    }
];
