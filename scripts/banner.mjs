// Draws the pixel-art Dragon Isles banner for the GitHub profile README.
// Everything is plotted on a small grid and written out as an SVG of merged pixel runs, with
// a few SMIL animations (drifting clouds, a pulsing beacon, twinkling stars, flickering
// lanterns and the dragon flying across). Run: node scripts/banner.mjs
import { writeFileSync } from "node:fs";

const W = 256, H = 128, S = 5; // grid size and pixel scale
const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();

// ---------- a canvas of pixels ----------
const layer = () => ({ px: new Map() });
const put = (L, x, y, c) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H || !c) return; L.px.set(y * W + x, c); };
const rect = (L, x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(L, x + i, y + j, c); };
const hline = (L, x0, x1, y, c) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) put(L, x, y, c); };
const disc = (L, cx, cy, r, c) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) put(L, cx + x, cy + y, c); };
const line = (L, x0, y0, x1, y1, c) => {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) put(L, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
};
// emit merged horizontal runs of one colour as <rect>s
const emit = (L, extra = "") => {
  const rows = new Map();
  for (const [k, c] of L.px) { const y = Math.floor(k / W), x = k % W; if (!rows.has(y)) rows.set(y, []); rows.get(y).push([x, c]); }
  let out = "";
  for (const [y, cells] of [...rows].sort((a, b) => a[0] - b[0])) {
    cells.sort((a, b) => a[0] - b[0]);
    let i = 0;
    while (i < cells.length) {
      let j = i;
      while (j + 1 < cells.length && cells[j + 1][0] === cells[j][0] + 1 && cells[j + 1][1] === cells[i][1]) j++;
      out += `<rect x="${cells[i][0]}" y="${y}" width="${j - i + 1}" height="1" fill="${cells[i][1]}"/>`;
      i = j + 1;
    }
  }
  return `<g${extra}>${out}</g>`;
};

// ---------- palette ----------
const P = {
  sky: ["#1f1d45", "#2b2a5c", "#3d3470", "#5a3d78", "#7d4a7c", "#a85a78", "#cf7a74", "#e8a07a", "#f4c08a"],
  star: "#fff3d6",
  far: ["#8f86a8", "#a198b8"], farTop: "#b4a9c6",
  mid: ["#55645a", "#62735f", "#4a5750"], midTop: ["#5e9a48", "#4c8240"],
  sea: ["#f7ebe4", "#efdcd6", "#e4c9c6", "#d7b5b6"],
  rock: ["#2e1d1a", "#4a2f2a", "#6b4636", "#83563f"], grass: ["#6fb24a", "#58993f", "#3f7a34"], root: "#3a2a1c",
  wall: "#efe2c2", wallShade: "#d8c6a0", red: "#b8322a", redDeep: "#7e1d18", roof: ["#2f6b5b", "#245447", "#1a3d34"], gold: "#e0b04e", goldDeep: "#a87a2a",
  lantern: "#ff8a3a", lanternDeep: "#c2481e", plank: "#8a6038", rope: "#5a3c22",
  dragon: { body: "#c4302a", dark: "#8a1c18", belly: "#f0c45a", spine: "#e8a83a", horn: "#f4dca0", eye: "#ffffff", pupil: "#1a1010", whisker: "#f0c45a" },
  paper: "#f3e6c8", paperShade: "#e6d3ad", ink: "#2a1d16", inkRed: "#b8322a", frame: "#3d1f10", frameGold: "#d9a441",
};

// ---------- static scene ----------
const bg = layer();
// dusk sky in dithered bands
const bandH = 10;
for (let y = 0; y < 96; y++) {
  const b = Math.floor(y / bandH), f = (y % bandH) / bandH, c0 = P.sky[Math.min(P.sky.length - 1, b)], c1 = P.sky[Math.min(P.sky.length - 1, b + 1)];
  for (let x = 0; x < W; x++) put(bg, x, y, f >= 0.9 ? ((x + y) % 2 ? c1 : c0) : f >= 0.8 ? ((x % 4 === y % 4) ? c1 : c0) : c0);
}
// far karst pillars
const farPillar = (x, top, w) => {
  for (let y = top; y < 100; y++) {
    const wob = Math.round(Math.sin((y + x) * 0.35) * 0.8);
    hline(bg, x + wob, x + w - 1 + wob, y, P.far[(y >> 3) % 2]);
  }
  hline(bg, x + 1, x + w - 2, top - 1, P.farTop);
};
for (const [x, top, w] of [[2, 40, 9], [18, 52, 7], [60, 36, 8], [78, 58, 6], [170, 44, 7], [190, 30, 10], [232, 48, 8], [246, 38, 9], [100, 62, 6], [148, 64, 6]]) farPillar(x, top, w);
// mid pillars with grassy caps
const midPillar = (x, top, w) => {
  for (let y = top; y < 104; y++) {
    const wob = Math.round(Math.sin(y * 0.5 + x) * 1);
    hline(bg, x + wob, x + w - 1 + wob, y, P.mid[((y >> 2) + (x & 1)) % 3]);
    if (y % 9 === 0) hline(bg, x + wob, x + w - 1 + wob, y, "#3e4a44");
  }
  hline(bg, x - 1, x + w, top, P.midTop[0]); hline(bg, x, x + w - 1, top + 1, P.midTop[1]);
  for (let i = 0; i < w; i += 3) put(bg, x + i, top - 1, P.midTop[0]);
  for (let k = 0; k < 2; k++) { const tx = x + 1 + Math.floor(rnd() * (w - 2)); line(bg, tx, top - 1, tx, top - 4, "#2f5a2a"); put(bg, tx - 1, top - 3, "#2f5a2a"); put(bg, tx + 1, top - 3, "#2f5a2a"); }
};
for (const [x, top, w] of [[8, 70, 11], [70, 74, 10], [176, 72, 12], [236, 66, 13], [118, 86, 9]]) midPillar(x, top, w);

// cloud sea
for (let y = 88; y < H; y++) for (let x = 0; x < W; x++) {
  const crest = 90 + Math.round(Math.sin(x * 0.11) * 2 + Math.sin(x * 0.037 + 1) * 3);
  if (y < crest) continue;
  const d = y - crest;
  put(bg, x, y, d < 4 ? P.sea[0] : d < 6 ? P.sea[x % 5 === 0 ? 1 : 0] : d < 12 ? P.sea[1] : d < 14 ? P.sea[x % 4 === 0 ? 2 : 1] : d < 22 ? P.sea[2] : P.sea[3]);
}

// ---------- islands ----------
const isle = (L, cx, top, w, depth) => {
  // grass lip
  hline(L, cx - w / 2, cx + w / 2, top, P.grass[0]);
  hline(L, cx - w / 2 - 1, cx + w / 2 + 1, top + 1, P.grass[1]);
  hline(L, cx - w / 2, cx + w / 2, top + 2, P.grass[2]);
  for (let x = cx - w / 2; x <= cx + w / 2; x += 2) if (rnd() < 0.6) put(L, x, top - 1, P.grass[0]);
  // inverted rocky cone
  for (let y = top + 3; y < top + depth; y++) {
    const t = (y - top) / depth, half = (w / 2 + 1) * (1 - t * t * 0.95);
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
      const edge = x - (cx - half) < 1.5 || cx + half - x < 1.5;
      const strata = (y + Math.round(Math.sin(x * 0.4) * 1.5)) % 5 === 0;
      put(L, x, y, edge ? P.rock[0] : strata ? P.rock[1] : x < cx - half * 0.35 ? P.rock[3] : P.rock[2]);
    }
  }
  // dangling roots and a little waterfall
  for (let k = 0; k < Math.max(3, w / 8); k++) { const rx = cx - w / 3 + rnd() * (w * 0.66), ry = top + 4 + rnd() * depth * 0.4; line(L, rx, ry, rx + (rnd() - 0.5) * 3, ry + 4 + rnd() * 6, P.root); }
};
const fore = layer();
// rope bridges first, so islands sit on top of their ends
const bridge = (x0, y0, x1, y1, sag) => {
  for (let x = x0; x <= x1; x++) {
    const t = (x - x0) / (x1 - x0), y = y0 + (y1 - y0) * t + Math.sin(Math.PI * t) * sag;
    put(fore, x, y, x % 3 === 0 ? P.rope : P.plank);
    put(fore, x, y - 4 + Math.sin(Math.PI * t) * 0.6, P.rope);
    if (x % 6 === 0) line(fore, x, y - 4, x, y, P.rope);
  }
};
bridge(58, 66, 98, 56, 6);
bridge(158, 56, 198, 70, 6);

// left island: Career pagoda
isle(fore, 42, 66, 34, 26);
for (let k = 0; k < 4; k++) {
  const w = 12 - k * 2, y = 62 - k * 7, x = 42 - w / 2;
  rect(fore, x, y - 4, w, 4, P.wall); put(fore, x, y - 4, P.red); put(fore, x + w - 1, y - 4, P.red);
  hline(fore, x - 3, x + w + 2, y - 5, P.roof[0]); hline(fore, x - 2, x + w + 1, y - 6, P.roof[1]);
  put(fore, x - 4, y - 6, P.gold); put(fore, x + w + 3, y - 6, P.gold);
  if (k === 0) rect(fore, 41, 58, 2, 4, P.red);
}
line(fore, 42, 34, 42, 30, P.gold);

// right island: Community pavilion
isle(fore, 214, 70, 34, 24);
rect(fore, 204, 61, 20, 1, P.roof[2]);
for (const x of [205, 210, 218, 223]) rect(fore, x, 62, 1, 7, P.red);
rect(fore, 210, 66, 9, 2, P.roof[0]); // mahjong table
hline(fore, 199, 229, 60, P.roof[0]); hline(fore, 201, 227, 59, P.roof[1]); hline(fore, 204, 224, 58, P.roof[1]); hline(fore, 207, 221, 57, P.roof[2]);
put(fore, 198, 59, P.gold); put(fore, 230, 59, P.gold); line(fore, 214, 56, 214, 53, P.gold);

// centre island: About me hall
isle(fore, 128, 56, 66, 34);
// stone base and steps
rect(fore, 106, 54, 44, 2, "#b3aa9b"); rect(fore, 122, 56, 12, 1, "#9a9284");
// walls with red pillars and a lattice door
rect(fore, 109, 43, 38, 11, P.wall); rect(fore, 109, 51, 38, 3, P.wallShade);
for (const x of [109, 116, 139, 146]) rect(fore, x, 43, 2, 11, P.red);
rect(fore, 124, 45, 8, 9, P.redDeep);
for (let y = 46; y < 54; y += 2) hline(fore, 125, 130, y, P.red);
rect(fore, 119, 46, 3, 3, "#5a3a2a"); rect(fore, 134, 46, 3, 3, "#5a3a2a");
// plaque
rect(fore, 124, 40, 8, 3, P.redDeep); hline(fore, 125, 130, 41, P.gold);
// lower roof with upturned eaves
for (let i = 0; i < 4; i++) hline(fore, 102 + i * 2 - (i === 0 ? 2 : 0), 154 - i * 2 + (i === 0 ? 2 : 0), 42 - i, P.roof[i % 2 ? 1 : 0]);
put(fore, 99, 41, P.roof[0]); put(fore, 98, 40, P.gold); put(fore, 157, 41, P.roof[0]); put(fore, 158, 40, P.gold);
hline(fore, 102, 154, 43, P.roof[2]);
// upper storey and roof
rect(fore, 116, 31, 24, 7, P.wall); for (const x of [116, 127, 128, 139]) rect(fore, x, 31, 1, 7, P.red);
rect(fore, 120, 33, 4, 3, "#5a3a2a"); rect(fore, 132, 33, 4, 3, "#5a3a2a");
for (let i = 0; i < 5; i++) hline(fore, 108 + i * 2, 148 - i * 2, 30 - i, P.roof[i % 2 ? 1 : 0]);
put(fore, 105, 29, P.roof[0]); put(fore, 104, 28, P.gold); put(fore, 151, 29, P.roof[0]); put(fore, 152, 28, P.gold);
hline(fore, 118, 138, 25, P.roof[2]); rect(fore, 126, 22, 4, 3, P.gold); put(fore, 127, 21, P.gold); put(fore, 128, 21, P.gold);
// trees on the island
for (const [tx, th] of [[100, 6], [156, 7], [152, 5]]) { line(fore, tx, 55, tx, 55 - th, "#4a2f1a"); disc(fore, tx, 55 - th, 3, P.grass[2]); disc(fore, tx - 1, 54 - th, 2, P.grass[1]); put(fore, tx + 1, 53 - th, "#f2a7b8"); }

// ---------- animated layers ----------
const parts = [];
// beacon from the hall's ridge
{
  const L = layer();
  // a soft gold glow that pulses, around a solid bright core
  const glow = layer(), core = layer();
  for (let y = 0; y < 21; y++) { const w = 2 + Math.floor((21 - y) / 8); hline(glow, 128 - w, 127 + w, y, y % 2 ? "#f2b84e" : "#f6c766"); hline(core, 127, 128, y, "#fffbe8"); put(core, 126, y, "#ffe9a8"); put(core, 129, y, "#ffe9a8"); }
  parts.push(emit(glow, ` opacity="0.7"><animate attributeName="opacity" values="0.35;0.8;0.35" dur="3.2s" repeatCount="indefinite"/`) + emit(core));
}
// twinkling stars
{
  const stars = [[14, 6], [40, 12], [66, 4], [92, 15], [150, 7], [178, 13], [204, 5], [230, 11], [248, 3], [30, 22], [214, 20], [86, 24]];
  stars.forEach(([x, y], i) => {
    const L = layer(); put(L, x, y, P.star); if (i % 3 === 0) { put(L, x - 1, y, "#cfc6e8"); put(L, x + 1, y, "#cfc6e8"); put(L, x, y - 1, "#cfc6e8"); put(L, x, y + 1, "#cfc6e8"); }
    parts.unshift(emit(L, `><animate attributeName="opacity" values="1;0.2;1" dur="${2 + (i % 4) * 0.7}s" begin="${(i * 0.37).toFixed(2)}s" repeatCount="indefinite"/`));
  });
}
// lanterns under the eaves
for (const [x, y] of [[104, 44], [151, 44], [112, 32], [143, 32]]) {
  const L = layer(); put(L, x, y, P.rope); rect(L, x - 1, y + 1, 3, 3, P.lantern); hline(L, x - 1, x + 1, y + 2, P.lanternDeep); put(L, x, y + 4, P.gold);
  parts.push(emit(L, `><animate attributeName="opacity" values="1;0.75;1;0.9;1" dur="1.7s" repeatCount="indefinite"/`));
}
// drifting clouds: each drawn twice a screen apart so the loop is seamless
const cloud = (L, x, y, w) => {
  for (let k = 0; k < w; k += 4) disc(L, x + k, y - (k % 8 === 0 ? 2 : 1), 3, "#fbf2ee");
  hline(L, x - 2, x + w + 1, y + 2, "#ecd9d6"); hline(L, x - 1, x + w, y + 1, "#fbf2ee");
};
const cloudsBack = layer(), cloudsFront = layer();
for (const [x, y, w] of [[20, 30, 16], [140, 18, 12], [205, 38, 18]]) { cloud(cloudsBack, x, y, w); cloud(cloudsBack, x - W, y, w); }
for (const [x, y, w] of [[60, 84, 22], [190, 88, 26]]) { cloud(cloudsFront, x, y, w); cloud(cloudsFront, x - W, y, w); }
const drift = (dur) => `><animateTransform attributeName="transform" type="translate" from="0 0" to="${W} 0" dur="${dur}s" repeatCount="indefinite"/`;

// ---------- the dragon (four wing-beat frames of its body wave) ----------
const OX = 100, OY = 20;
const dragonFrame = (phase) => {
  const L = layer(), d = P.dragon, len = 84;
  const pts = [];
  // drawn with its head at (OX, OY) so the trailing body stays on the grid; the flight path
  // subtracts the same offset
  for (let i = 0; i <= len; i++) pts.push([OX - i, OY + Math.sin(i * 0.14 + phase) * 6 * Math.min(1, i / 14 + 0.25)]);
  // tail flame
  const [tx, ty] = pts[len];
  rect(L, tx - 3, ty - 1, 3, 3, d.spine); put(L, tx - 4, ty - 2, d.belly); put(L, tx - 4, ty + 2, d.belly); put(L, tx - 5, ty, d.belly);
  for (let i = len; i >= 0; i--) {
    const [x, y] = pts[i], r = i < 8 ? 3 : i > len - 14 ? 2 : 3;
    disc(L, x, y, r, d.body);
    put(L, x, y + r, d.belly); put(L, x, y + r - 1, i % 3 ? d.belly : d.dark);
    if (i % 5 === 0 && i > 6) { put(L, x, y - r - 1, d.spine); put(L, x, y - r - 2, d.spine); }
    if (i % 3 === 0) put(L, x, y - r + 1, d.dark);
  }
  // legs with gold claws
  for (const i of [16, 50]) { const [x, y] = pts[i]; line(L, x, y + 3, x + 3, y + 7, d.body); line(L, x - 1, y + 3, x + 2, y + 7, d.dark); hline(L, x + 2, x + 5, y + 8, d.horn); }
  // head: snout, jaw, eye, horns, whiskers and mane
  const [hx, hy] = pts[0];
  rect(L, hx - 1, hy - 4, 9, 7, d.body); rect(L, hx + 8, hy - 2, 5, 4, d.body); rect(L, hx + 8, hy + 2, 4, 2, d.dark);
  hline(L, hx + 1, hx + 11, hy + 3, d.belly); put(L, hx + 12, hy - 2, d.dark);
  rect(L, hx + 3, hy - 3, 2, 2, d.eye); put(L, hx + 4, hy - 2, d.pupil);
  line(L, hx + 1, hy - 5, hx - 4, hy - 11, d.horn); line(L, hx + 4, hy - 5, hx + 2, hy - 11, d.horn); put(L, hx - 5, hy - 11, d.horn); put(L, hx + 3, hy - 12, d.horn);
  line(L, hx + 12, hy + 1, hx + 18, hy + 4 + Math.round(Math.sin(phase) * 1.5), d.whisker);
  line(L, hx + 12, hy - 1, hx + 19, hy - 4 - Math.round(Math.cos(phase) * 1.5), d.whisker);
  for (let k = 0; k < 7; k++) { put(L, hx - 2 - k, hy - 4 - (k % 2), d.spine); put(L, hx - 2 - k, hy - 5 - (k % 3 === 0 ? 1 : 0), d.belly); }
  return L;
};
const frames = [0, 1, 2, 3].map((k) => dragonFrame((k * Math.PI) / 2));
const frameAnim = (k) => `><animate attributeName="opacity" values="${[0, 1, 2, 3].map((j) => (j === k ? 1 : 0)).join(";")};${k === 0 ? 1 : 0}" keyTimes="0;0.25;0.5;0.75;1" calcMode="discrete" dur="0.8s" repeatCount="indefinite"/`;
const dragon = `<g><animateTransform attributeName="transform" type="translate" values="${-30 - OX} ${80 - OY};${150 - OX} ${74 - OY};${345 - OX} ${80 - OY};${345 - OX} ${80 - OY}" keyTimes="0;0.5;0.88;1" dur="15s" repeatCount="indefinite"/>${frames.map((f, k) => emit(f, frameAnim(k))).join("")}</g>`;

// ---------- the dialogue box ----------
const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"], B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"], D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"], F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"], H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"], J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"], L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"], N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"], P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"], R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"], T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"], V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "10101", "01010"], X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"], Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"], ",": ["00000", "00000", "00000", "00000", "00110", "00100", "01000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"], "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"], "@": ["01110", "10001", "10111", "10101", "10111", "10000", "01110"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"], "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"], "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
};
const text = (L, x, y, str, c) => {
  for (const ch of str) {
    const g = FONT[ch] || FONT[" "];
    g.forEach((row, j) => [...row].forEach((b, i) => b === "1" && put(L, x + i, y + j, c)));
    x += 6;
  }
};
const box = layer();
const bx = 20, by = 98, bw = 216, bh = 27;
rect(box, bx, by, bw, bh, P.frame); rect(box, bx + 1, by + 1, bw - 2, bh - 2, P.frameGold); rect(box, bx + 2, by + 2, bw - 4, bh - 4, P.paper);
hline(box, bx + 3, bx + bw - 4, by + bh - 4, P.paperShade);
// seal with a tiny dragon head
rect(box, bx + 5, by + 5, 17, 17, P.inkRed); rect(box, bx + 6, by + 6, 15, 15, "#c94236");
rect(box, bx + 9, by + 11, 6, 5, P.gold); rect(box, bx + 15, by + 13, 3, 3, P.gold); put(box, bx + 12, by + 12, P.ink);
line(box, bx + 10, by + 10, bx + 8, by + 7, P.paper); line(box, bx + 12, by + 10, bx + 12, by + 7, P.paper); hline(box, bx + 10, bx + 17, by + 17, P.paper);
text(box, bx + 27, by + 5, "HEY, I'M EDDIE CHAN!", P.inkRed);
text(box, bx + 27, by + 15, "FDE @ LYRA. EX-ATLASSIAN.", P.ink);
// blinking "more below" arrow
const arrow = layer(); hline(arrow, bx + bw - 12, bx + bw - 6, by + bh - 9, P.inkRed); hline(arrow, bx + bw - 11, bx + bw - 7, by + bh - 8, P.inkRed); hline(arrow, bx + bw - 10, bx + bw - 8, by + bh - 7, P.inkRed); put(arrow, bx + bw - 9, by + bh - 6, P.inkRed);
// title in the corner
const title = layer();
const T = "EDDIE'S DRAGON ISLES";
text(title, 7, 7, T, "#3d1f10"); text(title, 6, 6, T, P.gold);

// ---------- write the SVG ----------
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * S}" height="${H * S}" shape-rendering="crispEdges" role="img" aria-label="Pixel art of Eddie's Dragon Isles: a red dragon flies past floating temple islands above a sea of clouds at dusk">
<title>Eddie's Dragon Isles</title>
${emit(bg)}
${parts.slice(0, 12).join("")}
<g>${emit(cloudsBack, drift(90))}</g>
${parts.slice(12, 13).join("")}
${emit(fore)}
${parts.slice(13).join("")}
${dragon}
${emit(cloudsFront, drift(60))}
${emit(box)}
${emit(arrow, `><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1.1s" repeatCount="indefinite"/`)}
${emit(title)}
</svg>
`;
writeFileSync(new URL("../assets/dragon-isles.svg", import.meta.url), svg);
console.log(`wrote assets/dragon-isles.svg (${(svg.length / 1024).toFixed(0)} KB)`);
