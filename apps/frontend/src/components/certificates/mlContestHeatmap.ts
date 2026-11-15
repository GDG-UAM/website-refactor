/**
 * Seeded heatmap for the ML Contest certificate. The same seed always gives the same
 * pattern, and "GDG / UAM / ML / 2026" plus a trophy are left empty so they read in negative space.
 */

export interface HeatCell {
    x: number;
    y: number;
    /** Intensity, 0..1 */
    v: number;
    /** Dominant cluster, 0..3 (indexes the Google colors) */
    c: number;
}

// 5x7 letters and a 13x11 trophy
const GLYPHS: Record<string, string[]> = {
    G: [".###.", "#...#", "#....", "#.###", "#...#", "#...#", ".####"],
    D: ["###..", "#..#.", "#...#", "#...#", "#...#", "#..#.", "###.."],
    U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
    M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
    L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
    "0": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
    "6": ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."],
    trophy: [
        "..#########..",
        "##.#######.##",
        "#..#######..#",
        "#..#######..#",
        ".#..#####..#.",
        "..##.###.##..",
        ".....###.....",
        "......#......",
        "......#......",
        "....#####....",
        "...#######..."
    ]
};

// Every line has an odd width (17, 17, 11, 23, 13), so an odd column count centers them all exactly
const LINES = [[..."GDG"], [..."UAM"], [..."ML"], [..."2026"], ["trophy"]];
const LETTER_GAP = 1;
const LINE_GAP = 2;
const MARGIN_X = 3;
const MARGIN_Y = 2;

const lineWidth = (line: string[]) => line.reduce((w, key) => w + GLYPHS[key][0].length, 0) + (line.length - 1) * LETTER_GAP;
const lineHeight = (line: string[]) => GLYPHS[line[0]].length;

const COLS = Math.max(...LINES.map(lineWidth)) + 2 * MARGIN_X;
const ROWS = LINES.reduce((h, line) => h + lineHeight(line), 0) + (LINES.length - 1) * LINE_GAP + 2 * MARGIN_Y;

const HOLES = new Set<string>();
let top = MARGIN_Y;
for (const line of LINES) {
    let left = (COLS - lineWidth(line)) / 2;
    for (const key of line) {
        GLYPHS[key].forEach((row, ry) =>
            [...row].forEach((px, rx) => {
                if (px === "#") HOLES.add(`${left + rx},${top + ry}`);
            })
        );
        left += GLYPHS[key][0].length + LETTER_GAP;
    }
    top += lineHeight(line) + LINE_GAP;
}

function hash(text: string): number {
    let h = 2166136261;
    for (const ch of text) {
        h ^= ch.codePointAt(0)!;
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** mulberry32 */
function rng(seed: number) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

export function buildHeatmap(seedText: string) {
    const seed = hash(seedText);
    const random = rng(seed);
    // ~7 clusters per 24x24 area
    const blobs = Array.from({ length: Math.round((7 * COLS * ROWS) / 576) }, (_, i) => ({
        x: random() * COLS,
        y: random() * ROWS,
        radius: 3 + random() * 4,
        weight: 0.5 + random() * 0.5,
        cluster: i % 4
    }));

    const cells: HeatCell[] = [];
    let max = 0;
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            let sum = 0;
            let best = 0;
            let c = 0;
            for (const b of blobs) {
                const k = b.weight * Math.exp(-((x + 0.5 - b.x) ** 2 + (y + 0.5 - b.y) ** 2) / (2 * b.radius * b.radius));
                sum += k;
                if (k > best) {
                    best = k;
                    c = b.cluster;
                }
            }
            max = Math.max(max, sum);
            if (!HOLES.has(`${x},${y}`)) cells.push({ x, y, v: sum, c });
        }
    }
    for (const cell of cells) cell.v /= max;

    return { cols: COLS, rows: ROWS, seed, cells };
}
