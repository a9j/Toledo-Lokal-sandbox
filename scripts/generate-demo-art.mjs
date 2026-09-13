/**
 * Draws the demo picture set.
 *
 * The sandbox holds no photographs, and a city of gray boxes reads as broken
 * software rather than as a place. So every seeded thing gets a drawing: a
 * flat, layered scene in the lokal palette, built from shared primitives so
 * fifty pictures look like one set rather than fifty clip art downloads.
 *
 * Output is SVG in public/art, so the browser gets a crisp picture at any size
 * for two or three kilobytes and a seeded row can point at it with an ordinary
 * root relative URL. Run:
 *
 *   node scripts/generate-demo-art.mjs
 *
 * Everything is deterministic: the same key always draws the same scene, so
 * regenerating produces no diff unless this file changed.
 */
import { mkdirSync, writeFileSync, readdirSync, existsSync, unlinkSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'art');
const W = 1200;
const H = 800;

/* ---------------------------------------------------------------- palette */

// The lokal tokens resolved to hex. These pictures sit under a dark scrim on
// heroes and inside a card on lists, so they are painted a little richer than
// the UI surfaces are.
const C = {
  midnight: '#0A1626',
  midnightSoft: '#16294A',
  blue: '#2F7BEE',
  blueDeep: '#1249B4',
  blueGlow: '#66AEFF',
  paleBlue: '#BBD8FB',
  gold: '#FBBE2E',
  amber: '#F2A03D',
  terracotta: '#BE6B3D',
  terracottaDeep: '#8E4A28',
  clay: '#D98F63',
  forest: '#22836B',
  forestDeep: '#12513F',
  sage: '#7FB79F',
  sand: '#E4D9C4',
  cream: '#F7F3EA',
  brick: '#9C5346',
  stone: '#8B93A3',
  stoneLight: '#C3CAD6',
  white: '#FFFFFF',
};

// Four times of day. Choosing between them is most of what keeps a grid of
// cards from looking like one image repeated.
const SKIES = {
  day: { top: '#8FC2F5', bottom: '#DFEDFC', sun: '#FFF0C4', sunAt: [880, 190], stars: 0 },
  dusk: { top: '#2C3E7C', bottom: '#F0A469', sun: '#FFD9A0', sunAt: [300, 330], stars: 0 },
  night: { top: '#060E1C', bottom: '#1B3E6C', sun: '#D7E6FF', sunAt: [960, 170], stars: 70 },
  overcast: { top: '#A5B8CD', bottom: '#E7EDF4', sun: '#FFFFFF', sunAt: [640, 150], stars: 0 },
};

/* -------------------------------------------------------------- utilities */

/** Deterministic PRNG so a key always draws the same picture. */
function rng(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n = (v) => Math.round(v * 10) / 10;
const pick = (r, xs) => xs[Math.floor(r() * xs.length)];
const between = (r, a, b) => a + r() * (b - a);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Cream or midnight, whichever can actually be read on this colour.
 *
 * Signs painted straight onto a facade were coming out in the sign board
 * colour, which is chosen to sit on a board rather than on brick, and half of
 * them disappeared into the wall.
 */
function inkOn(hex) {
  const v = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? '#1B2739' : C.cream;
}

/* ------------------------------------------------------------- primitives */

// A 3:2 canvas, cropped to 16:9 on cards and 4:3 on heroes. Everything that
// matters is kept inside the band both crops keep: y 60 to 740, x 70 to 1130.
const SAFE = { top: 60, bottom: 740, left: 70, right: 1130 };

function sky(kind, r, horizon = 430) {
  const s = SKIES[kind];
  const parts = [
    `<rect width="${W}" height="${H}" fill="url(#sky)"/>`,
    `<circle cx="${s.sunAt[0]}" cy="${s.sunAt[1]}" r="${kind === 'night' ? 52 : 86}" fill="${s.sun}" opacity="${kind === 'overcast' ? 0.35 : 0.9}"/>`,
  ];
  if (kind === 'night') {
    // A crescent, cut by a second circle in the sky colour rather than a mask.
    parts.push(`<circle cx="${s.sunAt[0] - 24}" cy="${s.sunAt[1] - 13}" r="47" fill="${s.top}"/>`);
    for (let i = 0; i < s.stars; i += 1) {
      const x = n(between(r, 20, W - 20));
      const y = n(between(r, 20, horizon - 40));
      parts.push(`<circle cx="${x}" cy="${y}" r="${n(between(r, 1, 2.6))}" fill="#FFFFFF" opacity="${n(between(r, 0.25, 0.85))}"/>`);
    }
  }
  const defs = `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.top}"/><stop offset="1" stop-color="${s.bottom}"/></linearGradient>`;
  return { defs, body: parts.join('') };
}

function clouds(r, count = 3, y0 = 80, y1 = 260, opacity = 0.5) {
  let out = '';
  for (let i = 0; i < count; i += 1) {
    const x = n(between(r, -60, W));
    const y = n(between(r, y0, y1));
    const s = between(r, 0.6, 1.3);
    out += `<g fill="#FFFFFF" opacity="${opacity}" transform="translate(${x} ${y}) scale(${n(s)})">`
      + `<ellipse cx="0" cy="0" rx="86" ry="24"/><ellipse cx="-46" cy="8" rx="52" ry="19"/><ellipse cx="42" cy="10" rx="60" ry="21"/></g>`;
  }
  return out;
}

/** Distant buildings. The layer that says "city" before anything else lands. */
function skylineFar(r, baseY, fill, opacity = 1, count = 16) {
  let x = -40;
  let out = `<g fill="${fill}" opacity="${opacity}">`;
  for (let i = 0; i < count; i += 1) {
    const w = n(between(r, 44, 124));
    const h = n(between(r, 60, 270));
    out += `<rect x="${n(x)}" y="${n(baseY - h)}" width="${w}" height="${h}"/>`;
    if (r() > 0.62) {
      // A spire or a water tower, which is what stops a skyline reading as a bar chart.
      out += `<rect x="${n(x + w / 2 - 5)}" y="${n(baseY - h - 42)}" width="10" height="42"/>`;
    }
    x += w + between(r, 4, 20);
    if (x > W + 40) break;
  }
  return `${out}</g>`;
}

function litWindows(r, x0, y0, x1, y1, colour = C.gold, chance = 0.5, cell = 34) {
  let out = `<g fill="${colour}">`;
  for (let y = y0; y < y1 - 12; y += cell) {
    for (let x = x0; x < x1 - 12; x += cell) {
      if (r() > chance) continue;
      out += `<rect x="${n(x)}" y="${n(y)}" width="${n(cell * 0.5)}" height="${n(cell * 0.62)}" opacity="${n(between(r, 0.35, 0.95))}"/>`;
    }
  }
  return `${out}</g>`;
}

function trees(r, baseY, count, fill, scale = 1, x0 = -40, x1 = W + 40) {
  let out = `<g fill="${fill}">`;
  for (let i = 0; i < count; i += 1) {
    const x = n(between(r, x0, x1));
    const s = between(r, 0.7, 1.25) * scale;
    const h = 160 * s;
    const w = 66 * s;
    out += `<g transform="translate(${x} ${n(baseY)})">`
      + `<rect x="${n(-w * 0.09)}" y="${n(-h * 0.42)}" width="${n(w * 0.18)}" height="${n(h * 0.42)}" opacity="0.85"/>`
      + `<ellipse cx="0" cy="${n(-h * 0.64)}" rx="${n(w * 0.62)}" ry="${n(h * 0.34)}"/>`
      + `<ellipse cx="${n(-w * 0.42)}" cy="${n(-h * 0.44)}" rx="${n(w * 0.44)}" ry="${n(h * 0.24)}"/>`
      + `<ellipse cx="${n(w * 0.44)}" cy="${n(-h * 0.47)}" rx="${n(w * 0.42)}" ry="${n(h * 0.23)}"/>`
      + `</g>`;
  }
  return `${out}</g>`;
}

/** Water with a light path on it, which is what makes a flat band read as wet. */
function water(r, y, colour, glint) {
  let out = `<rect x="0" y="${n(y)}" width="${W}" height="${n(H - y)}" fill="${colour}"/>`;
  out += `<g fill="${glint}" opacity="0.5">`;
  for (let i = 0; i < 24; i += 1) {
    const yy = n(between(r, y + 12, H - 16));
    const w = n(between(r, 40, 250));
    const x = n(between(r, -20, W - 40));
    out += `<rect x="${x}" y="${yy}" width="${w}" height="${n(between(r, 3, 7))}" rx="3" opacity="${n(between(r, 0.2, 0.8))}"/>`;
  }
  return `${out}</g>`;
}

function people(r, baseY, count, fill, scale = 1, x0 = 60, x1 = W - 60) {
  let out = `<g fill="${fill}">`;
  for (let i = 0; i < count; i += 1) {
    const x = n(between(r, x0, x1));
    const s = between(r, 0.85, 1.15) * scale;
    out += `<g transform="translate(${x} ${n(baseY)}) scale(${n(s)})">`
      + `<circle cx="0" cy="-74" r="13"/>`
      + `<path d="M-14 -58 q14 -8 28 0 l6 34 -12 2 -3 22h-10l-3 -22 -12 -2z"/>`
      + `</g>`;
  }
  return `${out}</g>`;
}

function bunting(y, x0, x1, colours, sag = 40) {
  let out = `<path d="M${x0} ${y} Q${(x0 + x1) / 2} ${y + sag} ${x1} ${y}" stroke="${C.midnight}" stroke-opacity="0.4" stroke-width="3" fill="none"/>`;
  const steps = 14;
  for (let i = 0; i < steps; i += 1) {
    const t = (i + 0.5) / steps;
    const x = x0 + (x1 - x0) * t;
    const yy = y + sag * 2 * t * (1 - t);
    out += `<path d="M${n(x - 12)} ${n(yy)} L${n(x + 12)} ${n(yy)} L${n(x)} ${n(yy + 26)} Z" fill="${colours[i % colours.length]}"/>`;
  }
  return out;
}

/** The warm wash and the corner darkening that make the layers sit together. */
function finish() {
  return `<rect width="${W}" height="${H}" fill="url(#glow)"/><rect width="${W}" height="${H}" fill="url(#vig)"/>`;
}

const FINISH_DEFS =
  `<radialGradient id="glow" cx="50%" cy="22%" r="72%">`
  + `<stop offset="0" stop-color="#FFFFFF" stop-opacity="0.16"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>`
  + `<radialGradient id="vig" cx="50%" cy="46%" r="78%">`
  + `<stop offset="0.55" stop-color="#000000" stop-opacity="0"/><stop offset="1" stop-color="#000814" stop-opacity="0.34"/></radialGradient>`;

function svg(defs, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${esc(title)}">`
    + `<title>${esc(title)}</title>`
    + `<defs>${defs}${FINISH_DEFS}</defs>`
    + body
    + finish()
    + `</svg>`;
}

/* ----------------------------------------------------------------- scenes */

/**
 * A shop on a street.
 *
 * Most businesses are one of these, so a dozen of them sit side by side in a
 * list and any repeated geometry shows immediately. The skin and the sign word
 * are chosen per scene; the shape of the building is drawn from the key, so
 * width, roofline, window count, sign style and awning all differ without
 * anybody having to pick them.
 */
function storefront(key, o) {
  const r = rng(key);
  const night = o.time === 'night';
  const s = sky(o.time, r, 400);
  let b = s.body;

  b += clouds(r, night ? 0 : 2, 50, 170, o.time === 'overcast' ? 0.7 : 0.4);
  b += skylineFar(r, 420, night ? '#0C1B33' : C.midnightSoft, night ? 1 : 0.26, 14);

  const GROUND = 690;
  const width = Math.round(between(r, 660, 900));
  const x0 = Math.round(600 - width / 2 + between(r, -40, 40));
  const x1 = x0 + width;
  const top = Math.round(between(r, 140, 195));
  const roof = pick(r, ['flat', 'gable', 'stepped']);
  const signStyle = pick(r, ['board', 'hanging', 'painted']);
  const awning = pick(r, ['striped', 'scalloped', 'none']);
  const winCount = 3 + Math.floor(r() * 3);
  const arched = r() > 0.55;
  const doorRight = r() > 0.4;

  // Neighbours on both sides, cropped by the frame, so the shop is on a street
  // rather than standing alone in a field.
  const lh = Math.round(between(r, 230, 330));
  const rh = Math.round(between(r, 210, 320));
  b += `<rect x="-60" y="${lh}" width="${x0 + 70}" height="${GROUND - lh}" fill="${o.neighbour}" opacity="0.92"/>`;
  b += `<rect x="${x1 - 10}" y="${rh}" width="${W - x1 + 70}" height="${GROUND - rh}" fill="${o.neighbour}" opacity="0.8"/>`;
  b += litWindows(r, -20, lh + 40, x0 - 20, GROUND - 60, night ? C.gold : C.paleBlue, 0.45, 40);
  b += litWindows(r, x1 + 30, rh + 40, W - 10, GROUND - 60, night ? C.gold : C.paleBlue, 0.45, 40);

  // The shop itself.
  b += `<rect x="${x0}" y="${top}" width="${width}" height="${GROUND - top}" fill="${o.facade}"/>`;
  if (roof === 'gable') {
    b += `<path d="M${x0 - 26} ${top} L${(x0 + x1) / 2} ${top - 92} L${x1 + 26} ${top} Z" fill="${o.trim}"/>`;
  } else if (roof === 'stepped') {
    b += `<g fill="${o.trim}">`
      + `<rect x="${x0 - 12}" y="${top - 22}" width="${width + 24}" height="30" rx="4"/>`
      + `<rect x="${x0 + width * 0.24}" y="${top - 52}" width="${n(width * 0.52)}" height="34" rx="4"/>`
      + `<rect x="${x0 + width * 0.42}" y="${top - 78}" width="${n(width * 0.16)}" height="30" rx="4"/></g>`;
  } else {
    b += `<rect x="${x0 - 16}" y="${top - 26}" width="${width + 32}" height="34" rx="6" fill="${o.trim}"/>`;
    b += `<rect x="${x0 - 8}" y="${top + 10}" width="${width + 16}" height="10" fill="${C.midnight}" opacity="0.2"/>`;
  }

  // Upper floor windows.
  const wGap = width / winCount;
  const wW = Math.min(120, wGap * 0.52);
  for (let i = 0; i < winCount; i += 1) {
    const wx = n(x0 + wGap * (i + 0.5) - wW / 2);
    const wy = top + 60;
    const wH = 130;
    if (arched) {
      b += `<path d="M${wx} ${wy + wH} L${wx} ${wy + 34} a${n(wW / 2)} 34 0 0 1 ${n(wW)} 0 L${n(wx + wW)} ${wy + wH} Z" fill="${night ? C.gold : C.paleBlue}" opacity="${night ? 0.85 : 0.7}"/>`;
      b += `<path d="M${wx} ${wy + wH} L${wx} ${wy + 34} a${n(wW / 2)} 34 0 0 1 ${n(wW)} 0 L${n(wx + wW)} ${wy + wH} Z" fill="none" stroke="${o.trim}" stroke-width="7"/>`;
    } else {
      b += `<rect x="${wx}" y="${wy}" width="${n(wW)}" height="${wH}" rx="5" fill="${night ? C.gold : C.paleBlue}" opacity="${night ? 0.85 : 0.7}"/>`;
      b += `<rect x="${wx}" y="${wy}" width="${n(wW)}" height="${wH}" rx="5" fill="none" stroke="${o.trim}" stroke-width="7"/>`;
    }
  }

  // The sign.
  const signY = top + 232;
  if (signStyle === 'board') {
    b += `<rect x="${x0 + 34}" y="${signY}" width="${width - 68}" height="76" rx="8" fill="${o.sign}"/>`;
    b += `<text x="${n((x0 + x1) / 2)}" y="${signY + 54}" text-anchor="middle" font-family="'Space Grotesk','DM Sans',Helvetica,Arial,sans-serif" font-size="46" font-weight="700" letter-spacing="9" fill="${o.signInk}">${esc(o.word)}</text>`;
  } else if (signStyle === 'painted') {
    b += `<rect x="${x0}" y="${signY - 6}" width="${width}" height="88" fill="${C.midnight}" opacity="0.14"/>`;
    b += `<text x="${n((x0 + x1) / 2)}" y="${signY + 56}" text-anchor="middle" font-family="'Space Grotesk','DM Sans',Helvetica,Arial,sans-serif" font-size="52" font-weight="700" letter-spacing="12" fill="${inkOn(o.facade)}" opacity="0.92">${esc(o.word)}</text>`;
  } else {
    // Hanging: a bracket off the facade, which breaks the flat front.
    const hx = doorRight ? x0 + 96 : x1 - 96;
    b += `<rect x="${n(hx - 4)}" y="${signY}" width="8" height="34" fill="${o.trim}"/>`;
    b += `<rect x="${n(hx - 130)}" y="${signY + 30}" width="260" height="74" rx="10" fill="${o.sign}"/>`;
    b += `<text x="${n(hx)}" y="${signY + 80}" text-anchor="middle" font-family="'Space Grotesk','DM Sans',Helvetica,Arial,sans-serif" font-size="38" font-weight="700" letter-spacing="6" fill="${o.signInk}">${esc(o.word)}</text>`;
    b += `<rect x="${x0}" y="${signY + 6}" width="${width}" height="10" fill="${C.midnight}" opacity="0.15"/>`;
  }

  // The awning.
  const ay = signY + 118;
  if (awning !== 'none') {
    const panels = Math.max(6, Math.round(width / 105));
    const pw = (width + 40) / panels;
    for (let i = 0; i < panels; i += 1) {
      const px = x0 - 20 + i * pw;
      if (awning === 'scalloped') {
        b += `<path d="M${n(px)} ${ay} L${n(px + pw)} ${ay} L${n(px + pw)} ${ay + 52} q${n(-pw / 2)} 30 ${n(-pw)} 0 Z" fill="${i % 2 ? o.awningA : o.awningB}"/>`;
      } else {
        b += `<path d="M${n(px)} ${ay} L${n(px + pw)} ${ay} L${n(px + pw)} ${ay + 66} L${n(px)} ${ay + 66} Z" fill="${i % 2 ? o.awningA : o.awningB}"/>`;
      }
    }
    b += `<rect x="${x0 - 20}" y="${ay - 8}" width="${width + 40}" height="12" rx="4" fill="${C.midnight}" opacity="0.25"/>`;
  } else {
    b += `<rect x="${x0 - 10}" y="${ay + 20}" width="${width + 20}" height="14" rx="6" fill="${o.trim}"/>`;
  }

  // Shopfront glass and door.
  const gy = ay + (awning === 'none' ? 52 : 86);
  const glassH = GROUND - gy - 16;
  const doorW = 84;
  const dx = doorRight ? x1 - 40 - doorW : x0 + 40;
  const panes = doorRight
    ? [[x0 + 34, x1 - 150 - x0], []]
    : [[x0 + 150, x1 - 184 - x0], []];
  const [px0, pw0] = panes[0];
  b += `<rect x="${n(px0)}" y="${gy}" width="${n(pw0)}" height="${glassH}" rx="8" fill="${night ? '#2A1F12' : '#20344F'}"/>`;
  b += `<rect x="${n(px0)}" y="${gy}" width="${n(pw0)}" height="${glassH}" rx="8" fill="${night ? C.gold : C.blueGlow}" opacity="${night ? 0.55 : 0.34}"/>`;
  b += `<rect x="${n(px0 + pw0 / 2 - 5)}" y="${gy}" width="10" height="${glassH}" fill="${o.trim}" opacity="0.8"/>`;
  b += `<rect x="${n(dx)}" y="${gy}" width="${doorW}" height="${GROUND - gy}" rx="6" fill="${o.trim}"/>`;
  b += `<rect x="${n(dx + 14)}" y="${gy + 18}" width="${doorW - 28}" height="70" rx="4" fill="${night ? C.gold : C.paleBlue}" opacity="0.7"/>`;
  b += `<circle cx="${n(dx + doorW - 20)}" cy="${gy + 132}" r="7" fill="${C.gold}"/>`;

  // Street level.
  b += `<rect x="0" y="${GROUND}" width="${W}" height="${H - GROUND}" fill="${night ? '#131C2B' : '#9AA4B3'}"/>`;
  b += `<rect x="0" y="${GROUND}" width="${W}" height="8" fill="${C.midnight}" opacity="0.25"/>`;
  b += `<rect x="0" y="${GROUND + 64}" width="${W}" height="10" fill="${C.midnight}" opacity="0.18"/>`;

  const propX = doorRight ? x0 + 90 : x1 - 90;
  if (o.prop === 'bike') {
    b += `<g stroke="${C.midnight}" stroke-width="9" fill="none" opacity="0.85" transform="translate(${n(propX - 46)} ${GROUND + 4})">`
      + `<circle cx="0" cy="-28" r="28"/><circle cx="86" cy="-28" r="28"/>`
      + `<path d="M0 -28 L32 -78 L86 -28 M32 -78 L56 -78 M32 -78 L19 -28"/></g>`;
  }
  if (o.prop === 'planters') {
    for (const pxx of [x0 + 60, x1 - 60]) {
      b += `<rect x="${n(pxx - 32)}" y="${GROUND - 44}" width="64" height="44" rx="6" fill="${C.terracotta}"/>`;
      b += `<ellipse cx="${n(pxx)}" cy="${GROUND - 60}" rx="44" ry="28" fill="${C.forest}"/>`;
      b += `<ellipse cx="${n(pxx - 20)}" cy="${GROUND - 48}" rx="24" ry="17" fill="${C.forestDeep}" opacity="0.8"/>`;
    }
  }
  if (o.prop === 'bench') {
    b += `<g transform="translate(${n(propX)} ${GROUND})" fill="${C.terracottaDeep}">`
      + `<rect x="-86" y="-44" width="172" height="14" rx="6"/><rect x="-86" y="-80" width="172" height="12" rx="6"/>`
      + `<rect x="-78" y="-30" width="12" height="30"/><rect x="66" y="-30" width="12" height="30"/></g>`;
  }
  if (o.prop === 'sandwich') {
    b += `<g transform="translate(${n(propX)} ${GROUND})">`
      + `<path d="M-38 0 L-8 -88 L8 -88 L38 0 Z" fill="${C.midnightSoft}"/>`
      + `<rect x="-25" y="-72" width="50" height="44" rx="4" fill="${C.cream}" opacity="0.9"/></g>`;
  }
  if (o.prop === 'truck') {
    b += `<g transform="translate(${n(Math.min(propX, W - 190))} ${GROUND})">`
      + `<rect x="-150" y="-116" width="300" height="88" rx="12" fill="${o.awningA}"/>`
      + `<rect x="-118" y="-98" width="146" height="50" rx="6" fill="${C.cream}" opacity="0.85"/>`
      + `<rect x="-150" y="-134" width="300" height="20" rx="8" fill="${o.awningB}"/>`
      + `<circle cx="-94" cy="-14" r="25" fill="${C.midnight}"/><circle cx="94" cy="-14" r="25" fill="${C.midnight}"/></g>`;
  }

  b += people(r, GROUND + 56, o.crowd ?? 2, C.midnight, 0.88, 100, W - 100);
  // A street lamp, always, because it anchors the near edge of the pavement.
  const lampX = doorRight ? 106 : 1082;
  b += `<g fill="${C.midnight}" opacity="0.9"><rect x="${lampX}" y="${GROUND - 290}" width="12" height="290"/>`
    + `<rect x="${doorRight ? lampX : lampX - 60}" y="${GROUND - 300}" width="72" height="12" rx="6"/></g>`
    + `<circle cx="${doorRight ? lampX + 66 : lampX - 54}" cy="${GROUND - 278}" r="21" fill="${C.gold}" opacity="${night ? 0.95 : 0.45}"/>`;

  return svg(s.defs, b, o.title);
}

/** A room, for the things whose picture is what is inside rather than outside. */
function interior(key, o) {
  const r = rng(key);
  const night = o.time === 'night';
  let b = `<rect width="${W}" height="${H}" fill="${o.wall}"/>`;
  b += `<rect x="0" y="600" width="${W}" height="200" fill="${o.floor}"/>`;
  b += `<rect x="0" y="600" width="${W}" height="10" fill="${C.midnight}" opacity="0.2"/>`;

  // A window with the outside showing through, which gives the room depth and
  // a light source that explains the shadows.
  b += `<rect x="86" y="120" width="310" height="310" rx="12" fill="${night ? '#0B1830' : '#BEDCF7'}"/>`;
  b += `<rect x="86" y="120" width="310" height="310" rx="12" fill="none" stroke="${o.trim}" stroke-width="16"/>`;
  b += `<rect x="236" y="120" width="12" height="310" fill="${o.trim}"/>`;
  if (night) b += litWindows(r, 106, 260, 384, 420, C.gold, 0.4, 40);
  else b += `<rect x="102" y="320" width="278" height="102" fill="${C.midnightSoft}" opacity="0.35"/>`;

  // Pendant lights.
  for (const px of [640, 820, 1000]) {
    b += `<rect x="${px - 3}" y="0" width="6" height="130" fill="${C.midnight}" opacity="0.6"/>`;
    b += `<path d="M${px - 44} 186 L${px + 44} 186 L${px + 25} 130 L${px - 25} 130 Z" fill="${o.accent}"/>`;
    b += `<ellipse cx="${px}" cy="191" rx="32" ry="11" fill="${C.gold}" opacity="0.9"/>`;
  }

  if (o.kind === 'counter') {
    b += `<rect x="520" y="440" width="620" height="170" rx="10" fill="${o.accent}"/>`;
    b += `<rect x="520" y="440" width="620" height="24" rx="10" fill="${C.cream}" opacity="0.85"/>`;
    b += `<rect x="600" y="356" width="84" height="84" rx="8" fill="${C.stoneLight}"/>`;
    b += `<rect x="716" y="376" width="58" height="64" rx="6" fill="${C.terracotta}"/>`;
    b += `<g fill="${C.cream}"><rect x="876" y="388" width="44" height="52" rx="6"/><rect x="938" y="388" width="44" height="52" rx="6"/></g>`;
    b += `<rect x="450" y="130" width="56" height="310" fill="${o.trim}" opacity="0.5"/>`;
  }
  if (o.kind === 'shelves') {
    for (let i = 0; i < 3; i += 1) {
      const y = 230 + i * 126;
      b += `<rect x="520" y="${y}" width="620" height="16" rx="4" fill="${o.trim}"/>`;
      let x = 540;
      while (x < 1110) {
        const w = n(between(r, 22, 44));
        const h = n(between(r, 60, 100));
        b += `<rect x="${n(x)}" y="${n(y - h)}" width="${w}" height="${h}" rx="3" fill="${pick(r, [C.terracotta, C.forest, C.blue, C.gold, C.brick, C.sage])}" opacity="0.9"/>`;
        x += w + between(r, 4, 12);
      }
    }
  }
  if (o.kind === 'chairs') {
    for (const px of [600, 830, 1060]) {
      b += `<g transform="translate(${px} 600)" fill="${o.accent}">`
        + `<rect x="-56" y="-148" width="112" height="118" rx="26"/>`
        + `<rect x="-14" y="-30" width="28" height="30"/><rect x="-52" y="-6" width="104" height="12" rx="6"/></g>`;
      b += `<circle cx="${px}" cy="430" r="44" fill="${C.stoneLight}" opacity="0.55"/>`;
    }
  }
  if (o.kind === 'gym') {
    b += `<g fill="${C.midnight}" opacity="0.9">`;
    for (const px of [560, 780, 1000]) {
      b += `<rect x="${px - 70}" y="560" width="140" height="40" rx="10"/>`
        + `<rect x="${px - 10}" y="492" width="20" height="76"/>`
        + `<rect x="${px - 90}" y="452" width="180" height="44" rx="12"/>`;
    }
    b += `</g>`;
    b += `<g stroke="${o.accent}" stroke-width="18" fill="none" stroke-linecap="round"><path d="M300 560 L1120 560"/></g>`;
    b += `<g fill="${o.accent}" opacity="0.9"><circle cx="300" cy="560" r="36"/><circle cx="1120" cy="560" r="36"/></g>`;
  }
  if (o.kind === 'desk') {
    b += `<rect x="520" y="486" width="620" height="28" rx="8" fill="${o.accent}"/>`;
    b += `<rect x="560" y="514" width="24" height="86" fill="${o.accent}"/><rect x="1080" y="514" width="24" height="86" fill="${o.accent}"/>`;
    b += `<rect x="700" y="388" width="180" height="106" rx="8" fill="${C.midnightSoft}"/>`;
    b += `<rect x="712" y="400" width="156" height="82" rx="4" fill="${C.blueGlow}" opacity="0.75"/>`;
    b += `<g fill="${C.cream}"><rect x="940" y="440" width="118" height="46" rx="4"/><rect x="956" y="422" width="118" height="24" rx="4" opacity="0.8"/></g>`;
  }

  b += people(r, 660, o.crowd ?? 2, C.midnight, 1.2, 200, 1080);
  return svg('', b, o.title);
}

/** Open ground: parks, water, trails, the places with no facade. */
function landscape(key, o) {
  const r = rng(key);
  const night = o.time === 'night';
  const s = sky(o.time, r, 470);
  let b = s.body;
  b += clouds(r, night ? 0 : 3, 60, 220, 0.45);

  if (o.skyline) b += skylineFar(r, 470, night ? '#0B1A31' : C.midnightSoft, night ? 1 : 0.32, 15);
  if (o.hills) {
    b += `<path d="M-40 470 Q260 ${o.hills[0]} 620 470 T1240 470 L1240 800 L-40 800 Z" fill="${C.forestDeep}" opacity="0.55"/>`;
  }
  if (o.water) {
    b += water(r, 500, night ? '#0E2947' : '#2E6FA8', night ? C.blueGlow : C.paleBlue);
    b += `<rect x="0" y="720" width="${W}" height="80" fill="${o.ground}"/>`;
    b += `<rect x="0" y="720" width="${W}" height="8" fill="${C.midnight}" opacity="0.2"/>`;
  } else {
    b += `<rect x="0" y="480" width="${W}" height="320" fill="${o.ground}"/>`;
    b += `<path d="M-40 480 Q300 512 700 492 T1240 480 L1240 560 L-40 560 Z" fill="${C.midnight}" opacity="0.08"/>`;
  }

  if (o.path) {
    b += `<path d="M380 800 Q520 660 620 590 Q720 524 900 500 L1240 500 L1240 800 Z" fill="${C.sand}" opacity="0.72"/>`;
  }
  if (o.trees) b += trees(r, o.water ? 500 : 545, o.trees, night ? '#123227' : C.forestDeep, 1);
  if (o.treesNear) b += trees(r, o.water ? 760 : 720, o.treesNear, night ? '#0C2419' : '#194F3B', 1.7, -20, W + 20);

  if (o.feature === 'bridge') {
    b += `<g stroke="${C.midnight}" stroke-width="14" fill="none" opacity="0.9">`
      + `<path d="M-20 430 L1220 430"/>`
      + `<path d="M120 430 L320 216 L520 430"/><path d="M680 430 L880 216 L1080 430"/></g>`;
    b += `<g stroke="${C.midnight}" stroke-width="5" opacity="0.6">`;
    for (let i = 0; i < 22; i += 1) {
      const x = 130 + i * 48;
      b += `<path d="M${x} 430 L${x} ${n(226 + Math.abs(Math.sin(i / 3)) * 116)}"/>`;
    }
    b += `</g>`;
    b += `<rect x="-20" y="430" width="1240" height="26" fill="${C.midnight}" opacity="0.9"/>`;
  }
  if (o.feature === 'marina') {
    for (let i = 0; i < 5; i += 1) {
      const x = 200 + i * 200;
      const h = n(between(r, 150, 250));
      b += `<g transform="translate(${x} 590)">`
        + `<rect x="-6" y="${n(-h)}" width="12" height="${n(h)}" fill="${C.cream}"/>`
        + `<path d="M0 ${n(-h + 14)} L${n(h * 0.34)} -20 L0 -20 Z" fill="${C.cream}" opacity="0.95"/>`
        + `<path d="M0 ${n(-h + 30)} L${n(-h * 0.24)} -20 L0 -20 Z" fill="${C.paleBlue}"/>`
        + `<path d="M-56 -18 L56 -18 L38 10 L-38 10 Z" fill="${C.midnightSoft}"/></g>`;
    }
  }
  if (o.feature === 'ballfield') {
    // Grass, then the infield as a proper diamond with the bases on its corners.
    b += `<rect x="0" y="470" width="${W}" height="330" fill="${C.forest}" opacity="0.55"/>`;
    b += `<path d="M600 760 L280 560 L600 470 L920 560 Z" fill="${C.clay}" opacity="0.9"/>`;
    b += `<path d="M600 736 L330 560 L600 496 L870 560 Z" fill="${C.forest}" opacity="0.55"/>`;
    b += `<g stroke="${C.cream}" stroke-width="6" fill="none" opacity="0.9"><path d="M600 760 L280 560"/><path d="M600 760 L920 560"/></g>`;
    b += `<g fill="${C.cream}">`
      + `<rect x="588" y="748" width="24" height="24" rx="4"/><rect x="270" y="548" width="22" height="22" rx="4"/>`
      + `<rect x="908" y="548" width="22" height="22" rx="4"/><rect x="589" y="460" width="22" height="22" rx="4"/></g>`;
    b += `<circle cx="600" cy="616" r="34" fill="${C.clay}"/><rect x="586" y="608" width="28" height="12" rx="5" fill="${C.cream}"/>`;
    b += `<g stroke="${C.stoneLight}" stroke-width="10" fill="none" opacity="0.85"><path d="M110 470 L110 250"/><path d="M1090 470 L1090 250"/></g>`;
    b += `<g fill="${C.gold}" opacity="0.95"><rect x="66" y="214" width="90" height="42" rx="8"/><rect x="1046" y="214" width="90" height="42" rx="8"/></g>`;
  }
  if (o.feature === 'playground') {
    b += `<g stroke="${C.terracotta}" stroke-width="18" fill="none" stroke-linecap="round"><path d="M420 690 L520 520 L620 690"/></g>`;
    b += `<g stroke="${C.blue}" stroke-width="18" fill="none" stroke-linecap="round"><path d="M700 690 L700 520 L880 520 L880 690"/></g>`;
    b += `<g stroke="${C.midnight}" stroke-width="6"><path d="M746 526 L746 620"/><path d="M834 526 L834 620"/></g>`;
    b += `<g fill="${C.gold}"><rect x="720" y="620" width="52" height="14" rx="7"/><rect x="808" y="620" width="52" height="14" rx="7"/></g>`;
    b += `<path d="M520 526 L646 668 L556 668 Z" fill="${C.gold}"/>`;
    b += `<rect x="486" y="640" width="180" height="28" rx="10" fill="${C.sand}" opacity="0.8"/>`;
  }
  if (o.feature === 'garden') {
    for (let i = 0; i < 6; i += 1) {
      const x = 150 + i * 168;
      const yy = 600 + (i % 2) * 46;
      b += `<rect x="${x - 66}" y="${yy}" width="132" height="40" rx="8" fill="${C.terracottaDeep}"/>`;
      b += `<ellipse cx="${x}" cy="${yy - 8}" rx="70" ry="26" fill="${C.forest}"/>`;
      b += `<circle cx="${x - 26}" cy="${yy - 20}" r="9" fill="${C.gold}"/><circle cx="${x + 22}" cy="${yy - 14}" r="8" fill="${C.terracotta}"/>`;
    }
  }
  if (o.feature === 'lot') {
    b += `<rect x="0" y="480" width="${W}" height="320" fill="${C.sand}" opacity="0.6"/>`;
    // Chain link: two crossing diagonal combs behind a top rail.
    b += `<g stroke="${C.stoneLight}" stroke-width="4" opacity="0.75">`;
    for (let i = -8; i < 34; i += 1) {
      b += `<path d="M${i * 46} 500 L${i * 46 + 90} 620"/><path d="M${i * 46} 620 L${i * 46 + 90} 500"/>`;
    }
    b += `</g>`;
    b += `<g fill="${C.stone}"><rect x="0" y="494" width="${W}" height="10"/><rect x="0" y="614" width="${W}" height="10"/>`;
    for (let i = 0; i < 9; i += 1) b += `<rect x="${20 + i * 150}" y="494" width="12" height="130"/>`;
    b += `</g>`;
    b += `<g fill="${C.forest}" opacity="0.7">`;
    for (let i = 0; i < 34; i += 1) {
      const x = n(between(r, 20, W - 20));
      const y = n(between(r, 650, 780));
      b += `<path d="M${x} ${y} l7 -36 l7 36 z"/>`;
    }
    b += `</g>`;
    b += `<g transform="translate(860 556)">`
      + `<rect x="0" y="0" width="230" height="140" rx="8" fill="${C.cream}"/>`
      + `<rect x="0" y="0" width="230" height="140" rx="8" fill="none" stroke="${C.blue}" stroke-width="8"/>`
      + `<g fill="${C.midnight}" opacity="0.55"><rect x="30" y="36" width="168" height="14" rx="7"/><rect x="30" y="68" width="120" height="14" rx="7"/><rect x="30" y="100" width="146" height="14" rx="7"/></g>`
      + `<rect x="106" y="140" width="16" height="150" fill="${C.stone}"/></g>`;
  }
  if (o.feature === 'pond') {
    b += `<ellipse cx="640" cy="640" rx="380" ry="110" fill="${night ? '#0E2947' : '#3E7FB8'}"/>`;
    b += `<ellipse cx="640" cy="628" rx="330" ry="82" fill="${night ? '#14355C' : '#5C9BCE'}" opacity="0.7"/>`;
    b += `<g fill="${C.cream}" opacity="0.55"><rect x="420" y="626" width="150" height="6" rx="3"/><rect x="700" y="656" width="190" height="6" rx="3"/></g>`;
    b += `<g fill="${C.cream}"><ellipse cx="880" cy="596" rx="26" ry="16"/><circle cx="902" cy="584" r="11"/></g>`;
  }

  if (o.people) b += people(r, o.water ? 770 : 730, o.people, C.midnight, 1.05, 100, W - 100);
  return svg(s.defs, b, o.title);
}

/** Something happening: a stage, stalls, a crowd, lights over a street. */
function eventScene(key, o) {
  const r = rng(key);
  const night = o.time === 'night';
  const s = sky(o.time, r, 460);
  let b = s.body;
  b += skylineFar(r, 460, night ? '#0A1A32' : C.midnightSoft, night ? 1 : 0.3, 14);
  b += `<rect x="0" y="500" width="${W}" height="300" fill="${o.ground}"/>`;
  b += `<rect x="0" y="500" width="${W}" height="8" fill="${C.midnight}" opacity="0.2"/>`;

  if (o.feature === 'stage') {
    b += `<rect x="230" y="230" width="740" height="300" rx="10" fill="${C.midnight}" opacity="0.94"/>`;
    b += `<rect x="230" y="230" width="740" height="44" fill="${C.terracottaDeep}"/>`;
    b += `<g fill="${C.gold}" opacity="0.4"><path d="M300 276 L170 800 L520 800 Z"/><path d="M900 276 L1030 800 L680 800 Z"/></g>`;
    b += `<g fill="${C.midnight}"><rect x="470" y="366" width="58" height="146" rx="18"/><circle cx="499" cy="346" r="29"/>`
      + `<rect x="640" y="382" width="50" height="130" rx="16"/><circle cx="665" cy="362" r="25"/>`
      + `<rect x="790" y="392" width="46" height="120" rx="15"/><circle cx="813" cy="374" r="23"/></g>`;
    b += `<g stroke="${C.midnight}" stroke-width="8"><path d="M380 530 L380 620"/><path d="M820 530 L820 620"/></g>`;
    b += `<g fill="${C.blue}" opacity="0.85"><rect x="322" y="256" width="40" height="40" rx="6"/><rect x="838" y="256" width="40" height="40" rx="6"/></g>`;
    b += `<rect x="230" y="524" width="740" height="18" fill="${C.midnight}" opacity="0.5"/>`;
  }
  if (o.feature === 'stalls') {
    for (let i = 0; i < 4; i += 1) {
      const x = 110 + i * 300;
      const a = [C.terracotta, C.forest, C.blue, C.gold][i % 4];
      b += `<g transform="translate(${x} 0)">`;
      for (let p = 0; p < 5; p += 1) {
        b += `<rect x="${p * 48}" y="290" width="48" height="58" fill="${p % 2 ? a : C.cream}"/>`;
      }
      b += `<path d="M0 348 l240 0 l0 14 l-240 0 z" fill="${C.midnight}" opacity="0.28"/>`;
      b += `<rect x="8" y="348" width="8" height="180" fill="${C.midnight}" opacity="0.7"/>`
        + `<rect x="222" y="348" width="8" height="180" fill="${C.midnight}" opacity="0.7"/>`
        + `<rect x="16" y="470" width="206" height="60" rx="6" fill="${C.sand}"/>`;
      for (let c = 0; c < 4; c += 1) {
        b += `<circle cx="${44 + c * 50}" cy="${462}" r="14" fill="${[C.terracotta, C.gold, C.forest, C.brick][c]}"/>`;
      }
      b += `</g>`;
    }
  }
  if (o.feature === 'fireworks') {
    for (let i = 0; i < 5; i += 1) {
      const cx = n(between(r, 170, W - 170));
      const cy = n(between(r, 90, 340));
      const col = pick(r, [C.gold, C.blueGlow, C.clay, C.cream]);
      b += `<g stroke="${col}" stroke-width="5" opacity="0.9" stroke-linecap="round">`;
      for (let a = 0; a < 14; a += 1) {
        const ang = (a / 14) * Math.PI * 2;
        const rad = between(r, 60, 125);
        b += `<path d="M${cx} ${cy} L${n(cx + Math.cos(ang) * rad)} ${n(cy + Math.sin(ang) * rad)}"/>`;
      }
      b += `</g><circle cx="${cx}" cy="${cy}" r="10" fill="${col}"/>`;
    }
    b += water(r, 500, '#0E2947', C.blueGlow);
  }
  if (o.feature === 'lights') {
    b += bunting(200, -20, 620, [C.gold, C.terracotta, C.cream, C.blueGlow]);
    b += bunting(176, 580, 1220, [C.forest, C.gold, C.cream, C.terracotta]);
    b += `<path d="M-10 292 Q600 344 1210 292" stroke="${C.midnight}" stroke-opacity="0.45" stroke-width="4" fill="none"/>`;
    b += `<g fill="${C.gold}">`;
    for (let i = 0; i < 22; i += 1) {
      const x = n(-10 + i * 56);
      const t = i / 21;
      const y = n(292 + 52 * 2 * t * (1 - t));
      b += `<circle cx="${x}" cy="${y}" r="9" opacity="0.95"/>`;
    }
    b += `</g>`;
    // Trestle tables down the middle of the closed street.
    for (const tx of [220, 620, 1020]) {
      b += `<g transform="translate(${tx} 560)" fill="${C.cream}">`
        + `<rect x="-120" y="0" width="240" height="18" rx="6"/><rect x="-104" y="18" width="14" height="52" fill="${C.stone}"/><rect x="90" y="18" width="14" height="52" fill="${C.stone}"/></g>`;
    }
  }
  if (o.feature === 'run') {
    b += `<rect x="0" y="560" width="${W}" height="140" fill="${C.midnight}" opacity="0.14"/>`;
    b += `<g stroke="${C.cream}" stroke-width="10" stroke-dasharray="60 50" opacity="0.5"><path d="M0 700 L1200 700"/></g>`;
    b += `<rect x="150" y="200" width="900" height="72" rx="10" fill="${C.blue}"/>`;
    b += `<text x="600" y="252" text-anchor="middle" font-family="'Space Grotesk','DM Sans',Helvetica,Arial,sans-serif" font-size="44" font-weight="700" letter-spacing="10" fill="${C.cream}">START</text>`;
    b += `<rect x="156" y="200" width="18" height="330" fill="${C.midnightSoft}"/><rect x="1026" y="200" width="18" height="330" fill="${C.midnightSoft}"/>`;
    b += `<g fill="${C.terracotta}">`;
    for (let i = 0; i < 6; i += 1) {
      b += `<rect x="${n(between(r, 120, 1020))}" y="${n(between(r, 520, 560))}" width="26" height="16" rx="4" opacity="0.8"/>`;
    }
    b += `</g>`;
  }
  if (o.feature === 'parade') {
    // Barricades on both kerbs, and a marching block down the centre.
    b += `<g fill="${C.cream}" opacity="0.9">`;
    for (let i = 0; i < 10; i += 1) {
      b += `<rect x="${-20 + i * 130}" y="556" width="106" height="10" rx="4"/><rect x="${-20 + i * 130}" y="586" width="106" height="10" rx="4"/>`
        + `<rect x="${-14 + i * 130}" y="556" width="10" height="56"/><rect x="${62 + i * 130}" y="556" width="10" height="56"/>`;
    }
    b += `</g>`;
    b += `<g fill="${C.gold}">`;
    for (let i = 0; i < 8; i += 1) {
      const x = 210 + (i % 4) * 200;
      const y = 640 + Math.floor(i / 4) * 90;
      b += `<circle cx="${x}" cy="${y - 74}" r="13" fill="${C.terracotta}"/>`
        + `<path d="M${x - 14} ${y - 58} q14 -8 28 0 l6 34 -12 2 -3 22h-10l-3 -22 -12 -2z" fill="${C.terracotta}"/>`
        + `<circle cx="${x + 24}" cy="${y - 40}" r="17" opacity="0.95"/>`;
    }
    b += `</g>`;
    b += bunting(200, -20, 1220, [C.gold, C.terracotta, C.cream, C.blue], 46);
  }

  b += people(r, o.feature === 'stage' ? 760 : 740, o.crowd ?? 9, C.midnight, 1.1, 40, W - 40);
  if (o.feature === 'stage') b += people(r, 800, 7, C.midnight, 1.3, 40, W - 40);
  return svg(s.defs, b, o.title);
}

/** Buildings that are not shops: civic, industrial, institutional. */
function bigBuilding(key, o) {
  const r = rng(key);
  const night = o.time === 'night';
  const s = sky(o.time, r, 620);
  let b = s.body;
  b += clouds(r, night ? 0 : 2, 50, 170, 0.4);
  b += `<rect x="0" y="620" width="${W}" height="180" fill="${o.ground}"/>`;
  b += `<rect x="0" y="620" width="${W}" height="8" fill="${C.midnight}" opacity="0.2"/>`;

  if (o.feature === 'civic') {
    b += `<rect x="210" y="290" width="780" height="330" fill="${o.facade}"/>`;
    b += `<path d="M170 290 L600 128 L1030 290 Z" fill="${o.trim}"/>`;
    b += `<path d="M600 128 L1030 290 L1030 306 L600 152 Z" fill="${C.midnight}" opacity="0.12"/>`;
    b += `<rect x="190" y="278" width="820" height="26" fill="${o.trim}"/>`;
    for (let i = 0; i < 6; i += 1) {
      const x = 254 + i * 126;
      b += `<rect x="${x}" y="322" width="54" height="270" rx="6" fill="${C.cream}" opacity="0.92"/>`;
      b += `<rect x="${x - 8}" y="310" width="70" height="18" rx="4" fill="${C.cream}"/>`;
    }
    b += `<rect x="562" y="470" width="76" height="150" rx="6" fill="${night ? C.gold : C.midnightSoft}" opacity="0.85"/>`;
    b += `<g fill="${C.stoneLight}"><rect x="160" y="620" width="880" height="16"/><rect x="190" y="596" width="820" height="16"/></g>`;
    b += `<rect x="592" y="52" width="16" height="86" fill="${C.midnight}"/>`;
    b += `<path d="M608 58 L716 82 L608 106 Z" fill="${C.blue}"/>`;
  }
  if (o.feature === 'warehouse') {
    b += `<rect x="90" y="330" width="1020" height="290" fill="${o.facade}"/>`;
    b += `<path d="M70 330 L600 210 L1130 330 Z" fill="${o.trim}"/>`;
    for (let i = 0; i < 4; i += 1) {
      const x = 150 + i * 250;
      b += `<rect x="${x}" y="410" width="170" height="210" rx="4" fill="${C.midnightSoft}" opacity="0.88"/>`;
      b += `<g stroke="${o.facade}" stroke-width="8">`;
      for (let k = 1; k < 5; k += 1) b += `<path d="M${x} ${410 + k * 42} L${x + 170} ${410 + k * 42}"/>`;
      b += `</g>`;
    }
    b += litWindows(r, 120, 346, 1090, 400, night ? C.gold : C.paleBlue, 0.4, 60);
    b += `<rect x="880" y="94" width="26" height="240" fill="${C.brick}"/>`;
    b += `<rect x="866" y="80" width="54" height="26" rx="4" fill="${C.brick}"/>`;
  }
  if (o.feature === 'crane') {
    b += `<rect x="240" y="360" width="620" height="260" fill="${o.facade}" opacity="0.95"/>`;
    b += `<g stroke="${C.stone}" stroke-width="8" opacity="0.7">`;
    for (let i = 1; i < 5; i += 1) b += `<path d="M240 ${360 + i * 52} L860 ${360 + i * 52}"/>`;
    for (let i = 1; i < 6; i += 1) b += `<path d="M${240 + i * 103} 360 L${240 + i * 103} 620"/>`;
    b += `</g>`;
    b += `<g fill="${C.gold}"><rect x="900" y="90" width="22" height="530"/>`
      + `<rect x="620" y="90" width="480" height="20"/><rect x="880" y="52" width="62" height="44" rx="6"/></g>`;
    b += `<g stroke="${C.gold}" stroke-width="7" fill="none"><path d="M700 110 L911 52 L1080 110"/></g>`;
    b += `<path d="M700 110 L700 250" stroke="${C.midnight}" stroke-width="5"/>`;
    b += `<rect x="662" y="250" width="76" height="54" rx="6" fill="${C.terracotta}"/>`;
    b += `<g fill="${C.blue}" opacity="0.9"><rect x="110" y="540" width="130" height="80" rx="8"/><rect x="132" y="504" width="84" height="42" rx="6"/></g>`;
    b += `<g fill="${C.gold}" opacity="0.9">`;
    for (let i = 0; i < 5; i += 1) b += `<path d="M${300 + i * 150} 620 l-22 -46 l44 0 z"/>`;
    b += `</g>`;
  }
  if (o.feature === 'house') {
    b += `<rect x="300" y="330" width="600" height="290" fill="${o.facade}"/>`;
    b += `<path d="M258 330 L600 148 L942 330 Z" fill="${o.trim}"/>`;
    b += `<path d="M600 148 L942 330 L942 348 L600 166 Z" fill="${C.midnight}" opacity="0.15"/>`;
    if (o.tower) {
      b += `<rect x="836" y="230" width="120" height="390" fill="${o.facade}"/>`;
      b += `<path d="M820 230 L896 130 L972 230 Z" fill="${o.trim}"/>`;
      b += `<rect x="866" y="272" width="60" height="90" rx="30" fill="${night ? C.gold : C.paleBlue}" opacity="0.85"/>`;
    }
    b += `<rect x="556" y="190" width="86" height="102" fill="${o.trim}"/>`;
    for (const [wx, wy] of [[352, 382], [498, 382], [644, 382]]) {
      b += `<rect x="${wx}" y="${wy}" width="82" height="112" rx="4" fill="${night ? C.gold : C.paleBlue}" opacity="0.85"/>`;
      b += `<rect x="${wx}" y="${wy}" width="82" height="112" rx="4" fill="none" stroke="${o.trim}" stroke-width="8"/>`;
    }
    b += `<rect x="522" y="506" width="112" height="114" rx="6" fill="${o.trim}"/>`;
    b += `<circle cx="${618}" cy="566" r="7" fill="${C.gold}"/>`;
    b += `<rect x="272" y="494" width="660" height="16" fill="${o.trim}"/>`;
    b += `<g fill="${o.trim}"><rect x="292" y="510" width="16" height="110"/><rect x="896" y="510" width="16" height="110"/><rect x="594" y="510" width="16" height="110"/></g>`;
    b += trees(r, 640, 3, C.forestDeep, 0.8, 60, 1140);
    b += `<path d="M520 800 L556 622 L666 622 L700 800 Z" fill="${C.stoneLight}" opacity="0.7"/>`;
  }
  if (o.feature === 'apartments') {
    b += `<rect x="140" y="150" width="420" height="470" fill="${o.facade}"/>`;
    b += `<rect x="600" y="256" width="470" height="364" fill="${o.trim}"/>`;
    b += litWindows(r, 170, 186, 540, 590, night ? C.gold : C.paleBlue, 0.35, 50);
    b += litWindows(r, 630, 292, 1050, 590, night ? C.gold : C.paleBlue, 0.35, 50);
    b += `<rect x="300" y="530" width="96" height="90" rx="6" fill="${C.midnightSoft}"/>`;
    b += `<rect x="770" y="546" width="116" height="74" rx="6" fill="${C.midnightSoft}"/>`;
    b += trees(r, 650, 4, C.forestDeep, 0.75);
  }
  if (o.feature === 'school') {
    b += `<rect x="130" y="356" width="940" height="264" fill="${o.facade}"/>`;
    b += `<rect x="482" y="262" width="236" height="358" fill="${o.trim}"/>`;
    b += `<path d="M462 262 L600 178 L738 262 Z" fill="${o.trim}"/>`;
    b += `<circle cx="600" cy="318" r="40" fill="${C.cream}"/>`;
    b += `<g stroke="${C.midnight}" stroke-width="6" stroke-linecap="round"><path d="M600 318 L600 292"/><path d="M600 318 L621 330"/></g>`;
    for (let i = 0; i < 9; i += 1) {
      const x = 160 + i * 100;
      if (x > 440 && x < 740) continue;
      b += `<rect x="${x}" y="406" width="66" height="88" rx="4" fill="${night ? C.gold : C.paleBlue}" opacity="0.85"/>`;
    }
    b += `<rect x="556" y="502" width="88" height="118" rx="6" fill="${C.terracottaDeep}"/>`;
    b += `<g fill="${C.gold}"><rect x="1096" y="380" width="10" height="240"/><path d="M1106 386 L1180 404 L1106 422 Z"/></g>`;
  }
  if (o.feature === 'clinic') {
    b += `<rect x="180" y="270" width="840" height="350" rx="10" fill="${o.facade}"/>`;
    b += `<rect x="180" y="270" width="840" height="38" rx="10" fill="${o.trim}"/>`;
    b += litWindows(r, 220, 340, 980, 540, night ? C.gold : C.paleBlue, 0.3, 62);
    b += `<rect x="490" y="500" width="220" height="120" rx="8" fill="${C.cream}" opacity="0.92"/>`;
    b += `<g fill="${o.accent ?? C.forest}"><rect x="574" y="340" width="52" height="146" rx="8"/><rect x="526" y="388" width="148" height="50" rx="8"/></g>`;
  }
  if (o.feature === 'canopy') {
    // A low civic building with a big glass front under a cantilevered roof:
    // a community centre, which should not read as another clinic.
    b += `<rect x="170" y="330" width="860" height="290" fill="${o.facade}"/>`;
    b += `<rect x="120" y="296" width="960" height="40" rx="10" fill="${o.trim}"/>`;
    b += `<rect x="120" y="296" width="960" height="12" rx="6" fill="${C.midnight}" opacity="0.2"/>`;
    for (let i = 0; i < 6; i += 1) {
      const x = 214 + i * 140;
      b += `<rect x="${x}" y="368" width="112" height="252" rx="6" fill="${night ? C.gold : C.blueGlow}" opacity="${night ? 0.8 : 0.45}"/>`;
      b += `<rect x="${x}" y="368" width="112" height="252" rx="6" fill="none" stroke="${o.trim}" stroke-width="8"/>`;
    }
    b += `<g fill="${o.accent ?? C.gold}"><rect x="150" y="336" width="20" height="284"/><rect x="1030" y="336" width="20" height="284"/></g>`;
    b += `<rect x="520" y="450" width="160" height="170" rx="6" fill="${o.trim}"/>`;
    b += `<g fill="${C.cream}" opacity="0.9"><circle cx="600" cy="240" r="42"/></g>`;
    b += `<g fill="${o.accent ?? C.gold}"><circle cx="600" cy="240" r="30"/></g>`;
  }

  b += people(r, 760, o.crowd ?? 3, C.midnight, 1.05, 80, W - 80);
  return svg(s.defs, b, o.title);
}

/** Close ups: the pictures that are one object rather than a place. */
function objectScene(key, o) {
  const r = rng(key);
  let b = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  const defs = `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${o.bgA}"/><stop offset="1" stop-color="${o.bgB}"/></linearGradient>`;

  // A soft disc behind the subject so it reads as lit rather than pasted on.
  b += `<circle cx="600" cy="400" r="290" fill="#FFFFFF" opacity="0.09"/>`;

  if (o.feature === 'pothole') {
    b += `<rect x="0" y="440" width="${W}" height="360" fill="${C.stone}"/>`;
    b += `<g stroke="${C.cream}" stroke-width="16" stroke-dasharray="70 60" opacity="0.7"><path d="M0 620 L1200 620"/></g>`;
    b += `<ellipse cx="580" cy="530" rx="200" ry="92" fill="${C.midnight}" opacity="0.85"/>`;
    b += `<ellipse cx="568" cy="518" rx="162" ry="66" fill="${C.midnightSoft}"/>`;
    b += `<ellipse cx="576" cy="530" rx="114" ry="42" fill="${C.blueDeep}" opacity="0.55"/>`;
    b += `<g fill="${C.stoneLight}" opacity="0.8"><circle cx="400" cy="576" r="11"/><circle cx="780" cy="590" r="9"/><circle cx="722" cy="470" r="8"/></g>`;
    b += `<g transform="translate(930 452)"><rect x="-10" y="0" width="20" height="170" fill="${C.midnight}"/>`
      + `<path d="M-66 -66 L66 -66 L0 -170 Z" fill="${C.gold}"/><rect x="-6" y="-118" width="12" height="40" fill="${C.midnight}"/>`
      + `<circle cx="0" cy="-92" r="8" fill="${C.midnight}"/></g>`;
  }
  if (o.feature === 'tag') {
    b += `<g transform="translate(600 400) rotate(-14)">`
      + `<path d="M-250 -142 L114 -142 L266 0 L114 142 L-250 142 Z" fill="${C.gold}"/>`
      + `<circle cx="142" cy="0" r="32" fill="${o.bgB}"/>`
      + `<rect x="-210" y="-44" width="266" height="26" rx="13" fill="${C.midnight}" opacity="0.35"/>`
      + `<rect x="-210" y="6" width="180" height="26" rx="13" fill="${C.midnight}" opacity="0.25"/></g>`;
    b += `<g fill="${C.cream}" opacity="0.3"><circle cx="190" cy="180" r="24"/><circle cx="990" cy="640" r="32"/><circle cx="970" cy="160" r="16"/></g>`;
  }
  if (o.feature === 'hardhat') {
    b += `<g transform="translate(600 430)">`
      + `<path d="M-186 56 q0 -222 186 -222 q186 0 186 222 z" fill="${C.gold}"/>`
      + `<path d="M-186 56 q0 -222 186 -222 q40 0 70 12 q-120 40 -120 210 z" fill="#FFFFFF" opacity="0.14"/>`
      + `<rect x="-244" y="48" width="488" height="50" rx="25" fill="${C.amber}"/>`
      + `<rect x="-30" y="-166" width="60" height="146" rx="20" fill="${C.amber}" opacity="0.85"/></g>`;
    b += `<g stroke="${C.cream}" stroke-width="14" opacity="0.22" fill="none"><path d="M120 660 L1080 660"/></g>`;
  }
  if (o.feature === 'hands') {
    // A heart held in two hands. The hands are two mirrored cups rather than
    // one silhouette, which is what stopped the first attempt reading as a blob.
    b += `<g transform="translate(600 316)">`
      + `<path d="M0 118 C-108 24 -172 -30 -172 -104 C-172 -162 -128 -196 -84 -196 C-48 -196 -18 -172 0 -142 C18 -172 48 -196 84 -196 C128 -196 172 -162 172 -104 C172 -30 108 24 0 118 Z" fill="${C.gold}"/>`
      + `<path d="M-84 -178 C-120 -178 -154 -150 -154 -104 C-154 -64 -132 -28 -100 8" fill="none" stroke="#FFFFFF" stroke-opacity="0.45" stroke-width="16" stroke-linecap="round"/></g>`;
    b += `<g fill="${C.cream}">`
      + `<path d="M556 470 C556 470 470 420 414 430 C366 438 350 470 372 500 C336 500 322 536 348 562 C334 588 356 620 400 626 L560 648 C596 652 610 626 606 596 L590 492 C586 470 572 462 556 470 Z"/>`
      + `<path d="M644 470 C644 470 730 420 786 430 C834 438 850 470 828 500 C864 500 878 536 852 562 C866 588 844 620 800 626 L640 648 C604 652 590 626 594 596 L610 492 C614 470 628 462 644 470 Z"/></g>`;
    b += `<g fill="${C.midnight}" opacity="0.14"><ellipse cx="600" cy="672" rx="230" ry="26"/></g>`;
  }
  if (o.feature === 'ticket') {
    b += `<g transform="translate(600 400)">`
      + `<rect x="-320" y="-150" width="640" height="300" rx="24" fill="${C.cream}"/>`
      + `<circle cx="60" cy="-150" r="34" fill="${o.bgB}"/><circle cx="60" cy="150" r="34" fill="${o.bgB}"/>`
      + `<g stroke="${C.stone}" stroke-width="6" stroke-dasharray="14 16"><path d="M60 -112 L60 112"/></g>`
      + `<g fill="${C.midnight}" opacity="0.75"><rect x="-270" y="-80" width="240" height="26" rx="13"/><rect x="-270" y="-30" width="180" height="20" rx="10"/><rect x="-270" y="40" width="210" height="20" rx="10"/></g>`
      + `<g fill="${C.blue}"><rect x="110" y="-60" width="20" height="120" rx="4"/><rect x="146" y="-60" width="10" height="120" rx="4"/><rect x="172" y="-60" width="24" height="120" rx="4"/><rect x="212" y="-60" width="12" height="120" rx="4"/><rect x="240" y="-60" width="22" height="120" rx="4"/></g></g>`;
  }
  if (o.feature === 'mail') {
    b += `<g transform="translate(600 410)">`
      + `<rect x="-280" y="-170" width="560" height="330" rx="20" fill="${C.cream}"/>`
      + `<path d="M-280 -150 L0 56 L280 -150" fill="none" stroke="${C.blue}" stroke-width="18"/>`
      + `<circle cx="228" cy="-140" r="56" fill="${C.terracotta}"/>`
      + `<text x="228" y="-121" text-anchor="middle" font-family="'Space Grotesk','DM Sans',Helvetica,Arial,sans-serif" font-size="56" font-weight="700" fill="${C.cream}">3</text></g>`;
  }
  if (o.feature === 'glass') {
    // The Glass City, drawn as a stained panel. Used where the subject is the
    // city itself rather than one place in it.
    const cols = 7;
    const rows = 5;
    const cw = 132;
    const ch = 116;
    const ox = (W - cols * cw) / 2;
    const oy = (H - rows * ch) / 2;
    for (let i = 0; i < cols; i += 1) {
      for (let j = 0; j < rows; j += 1) {
        b += `<rect x="${n(ox + i * cw)}" y="${n(oy + j * ch)}" width="${cw - 8}" height="${ch - 8}" rx="8" fill="${pick(r, [C.blue, C.blueDeep, C.blueGlow, C.forest, C.gold, C.terracotta, C.paleBlue])}" opacity="${n(between(r, 0.5, 0.95))}"/>`;
      }
    }
    b += `<g stroke="${C.midnight}" stroke-width="10" opacity="0.5" fill="none">`;
    for (let i = 0; i <= cols; i += 1) b += `<path d="M${n(ox + i * cw - 4)} ${n(oy - 4)} L${n(ox + i * cw - 4)} ${n(oy + rows * ch - 4)}"/>`;
    for (let j = 0; j <= rows; j += 1) b += `<path d="M${n(ox - 4)} ${n(oy + j * ch - 4)} L${n(ox + cols * cw - 4)} ${n(oy + j * ch - 4)}"/>`;
    b += `</g>`;
  }

  return svg(defs, b, o.title);
}

/**
 * A logo mark.
 *
 * Business avatars are round and small, and a cropped storefront scene turns
 * to mush at 40 pixels. These are square, high contrast and readable at any
 * size: a tinted tile with one emblem on it. Sixteen of them, shared across the
 * directory, which reads as a set of brands rather than as a missing image.
 */
function logoMark(key, o) {
  const S = 512;
  const g = `<linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${o.a}"/><stop offset="1" stop-color="${o.b}"/></linearGradient>`;
  let b = `<rect width="${S}" height="${S}" rx="112" fill="url(#lg)"/>`;
  b += `<circle cx="170" cy="150" r="190" fill="#FFFFFF" opacity="0.10"/>`;
  b += `<g fill="${o.ink}" stroke="${o.ink}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" transform="translate(256 256)">${o.mark}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" role="img" aria-label="${esc(o.title)}">`
    + `<title>${esc(o.title)}</title><defs>${g}</defs>${b}</svg>`;
}

const MARKS = [
  ['cup', 'A cup', '<path d="M-100 -70 h170 v90 a85 85 0 0 1 -170 0 z" fill="none"/><path d="M70 -40 h34 a40 40 0 0 1 0 80 h-20" fill="none"/><path d="M-110 90 h200" fill="none"/>'],
  ['loaf', 'A loaf', '<path d="M-120 30 q0 -110 120 -110 q120 0 120 110 z" fill="none"/><path d="M-56 30 v-90 M0 30 v-104 M56 30 v-90" fill="none"/>'],
  ['scissors', 'Scissors', '<circle cx="-70" cy="80" r="42" fill="none"/><circle cx="70" cy="80" r="42" fill="none"/><path d="M-46 46 L80 -110 M46 46 L-80 -110" fill="none"/>'],
  ['wrench', 'A wrench', '<path d="M60 -110 a80 80 0 1 0 46 106 l70 70 a30 30 0 0 0 42 -42 l-70 -70 a80 80 0 0 0 -88 -64 z" fill="none"/>'],
  ['leaf', 'A leaf', '<path d="M-110 110 q0 -200 210 -210 q10 200 -210 210 z" fill="none"/><path d="M-60 60 L70 -70" fill="none"/>'],
  ['book', 'An open book', '<path d="M-130 -80 q70 -30 130 0 q60 -30 130 0 v170 q-70 -30 -130 0 q-60 -30 -130 0 z" fill="none"/><path d="M0 -80 v170" fill="none"/>'],
  ['wheel', 'A wheel', '<circle cx="0" cy="0" r="115" fill="none"/><circle cx="0" cy="0" r="26" fill="none"/><path d="M0 -115 V-26 M0 26 V115 M-115 0 H-26 M26 0 H115" fill="none"/>'],
  ['hanger', 'A coat hanger', '<path d="M0 -70 a40 40 0 1 1 40 40 q-40 0 -40 40" fill="none"/><path d="M0 10 L-150 100 h300 z" fill="none"/>'],
  ['bulb', 'A light bulb', '<path d="M0 -120 a90 90 0 0 1 54 162 v18 h-108 v-18 a90 90 0 0 1 54 -162 z" fill="none"/><path d="M-40 90 h80 M-30 124 h60" fill="none"/>'],
  ['fork', 'A fork and knife', '<path d="M-70 -120 v90 a30 30 0 0 0 60 0 v-90 M-40 -120 v90 M-40 -30 v150" fill="none"/><path d="M70 -120 q40 40 0 120 v130" fill="none"/>'],
  ['hammer', 'A hammer', '<path d="M-130 -110 h176 a36 36 0 0 1 0 72 h-60 v168 h-62 v-168 h-54 a36 36 0 0 1 0 -72 z" fill="none"/>'],
  ['palette', 'A palette', '<path d="M0 -120 a120 120 0 1 0 40 233 a34 34 0 0 0 -18 -63 h30 a70 70 0 0 0 68 -88 a120 120 0 0 0 -120 -82 z" fill="none"/><circle cx="-50" cy="-40" r="18"/><circle cx="30" cy="-62" r="18"/>'],
  ['weight', 'A dumbbell', '<path d="M-140 -50 h50 v100 h-50 z M140 -50 h-50 v100 h50 z" fill="none"/><path d="M-90 0 h180" fill="none"/>'],
  ['pin', 'A map pin', '<path d="M0 130 C-80 30 -110 -10 -110 -50 A110 110 0 1 1 110 -50 C110 -10 80 30 0 130 Z" fill="none"/><circle cx="0" cy="-52" r="36" fill="none"/>'],
  ['house', 'A house', '<path d="M-130 0 L0 -120 L130 0" fill="none"/><path d="M-96 -24 v144 h192 v-144" fill="none"/><path d="M-30 120 v-80 h60 v80" fill="none"/>'],
  ['spark', 'A spark', '<path d="M0 -130 L34 -34 L130 0 L34 34 L0 130 L-34 34 L-130 0 L-34 -34 Z" fill="none"/>'],
];

/**
 * A stand in for a person's photograph.
 *
 * Deliberately a silhouette and nothing more. A demo resident is not a real
 * person, and inventing a face for one would be a lie the size of the avatar.
 */
function avatarMark(key, o) {
  const S = 512;
  const g = `<linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${o.a}"/><stop offset="1" stop-color="${o.b}"/></linearGradient>`;
  let b = `<rect width="${S}" height="${S}" fill="url(#ag)"/>`;
  b += `<circle cx="256" cy="200" r="88" fill="${o.ink}" opacity="0.92"/>`;
  b += `<path d="M96 512 q0 -160 160 -160 q160 0 160 160 z" fill="${o.ink}" opacity="0.92"/>`;
  if (o.hat) b += `<path d="M150 168 q10 -110 106 -110 q96 0 106 110 q-106 -46 -212 0 z" fill="${o.ink}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" role="img" aria-label="${esc(o.title)}">`
    + `<title>${esc(o.title)}</title><defs>${g}</defs>${b}</svg>`;
}

const AVATAR_SKINS = [
  { a: '#2F7BEE', b: '#1249B4', ink: '#DCE9FB' },
  { a: '#BE6B3D', b: '#8E4A28', ink: '#F7E7D8' },
  { a: '#22836B', b: '#12513F', ink: '#DDF0E8' },
  { a: '#4A4560', b: '#221F31', ink: '#E2DEEE' },
  { a: '#26566E', b: '#12313F', ink: '#D8E9F1' },
  { a: '#9C3B33', b: '#6B2621', ink: '#F6DED9' },
  { a: '#FBBE2E', b: '#E08C1E', ink: '#3A2A06' },
  { a: '#8C7A5C', b: '#5C4E36', ink: '#F3EBDC' },
];

const LOGO_SKINS = [
  { a: '#2F7BEE', b: '#1249B4', ink: '#F7F3EA' },
  { a: '#BE6B3D', b: '#8E4A28', ink: '#F7F3EA' },
  { a: '#22836B', b: '#12513F', ink: '#F7F3EA' },
  { a: '#FBBE2E', b: '#E08C1E', ink: '#16294A' },
  { a: '#4A4560', b: '#221F31', ink: '#F7F3EA' },
  { a: '#E4D9C4', b: '#B6A88C', ink: '#16294A' },
  { a: '#26566E', b: '#12313F', ink: '#F7F3EA' },
  { a: '#9C3B33', b: '#6B2621', ink: '#F7F3EA' },
];

/* ------------------------------------------------------------- the scenes */

const SHOP_SKINS = [
  { facade: '#3E5F8A', trim: '#26456B', neighbour: '#2A425F', sign: '#0F2138', signInk: C.cream, awningA: C.terracotta, awningB: '#A85630' },
  { facade: '#B4694A', trim: '#7E4229', neighbour: '#8A4E36', sign: '#F7F3EA', signInk: '#7E4229', awningA: C.forest, awningB: '#186A55' },
  { facade: '#2F6F5E', trim: '#1B4A3E', neighbour: '#27544A', sign: '#0E2C25', signInk: C.gold, awningA: C.gold, awningB: '#DFA321' },
  { facade: '#D8CBB2', trim: '#8C7A5C', neighbour: '#B6A88C', sign: '#26456B', signInk: C.cream, awningA: C.blue, awningB: '#2159AE' },
  { facade: '#4A4560', trim: '#2E2B40', neighbour: '#3B3750', sign: '#F7F3EA', signInk: '#2E2B40', awningA: C.terracotta, awningB: C.gold },
  { facade: '#8C3F3F', trim: '#5E2828', neighbour: '#6E3232', sign: '#F7F3EA', signInk: '#5E2828', awningA: '#2F6F5E', awningB: C.cream },
  { facade: '#26566E', trim: '#163A4C', neighbour: '#1D4557', sign: '#F7F3EA', signInk: '#163A4C', awningA: C.gold, awningB: C.cream },
  { facade: '#6E5A3E', trim: '#4A3B27', neighbour: '#57462F', sign: '#0F2138', signInk: C.gold, awningA: C.forest, awningB: C.sand },
];

const scenes = [];
const shop = (key, word, title, i, extra = {}) =>
  scenes.push({ key, svg: () => storefront(key, { ...SHOP_SKINS[i % SHOP_SKINS.length], word, title, ...extra }) });

// Food and drink.
shop('cafe-coffee', 'COFFEE', 'A coffee shop on a downtown corner at dawn', 0, { time: 'dusk', prop: 'bike', crowd: 2 });
shop('cafe-bakery', 'BAKERY', 'A bakery with striped awnings in the morning', 1, { time: 'day', prop: 'planters', crowd: 3 });
shop('cafe-diner', 'DINER', 'A corner diner with lit windows at night', 4, { time: 'night', prop: 'bench', crowd: 2 });
shop('cafe-supper', 'SUPPER', 'A supper club front at dusk', 5, { time: 'dusk', prop: 'sandwich', crowd: 2 });
shop('cafe-pizza', 'PIZZA', 'A pizza shop with a red awning', 1, { time: 'night', prop: 'bike', crowd: 4 });
shop('cafe-brewery', 'BREWERY', 'A brewery taproom in an old brick building', 5, { time: 'dusk', prop: 'bench', crowd: 5 });
shop('cafe-taco', 'TACOS', 'A taco shop with a bright awning', 2, { time: 'day', prop: 'sandwich', crowd: 3 });
shop('cafe-icecream', 'SCOOPS', 'An ice cream window with a line outside', 3, { time: 'day', prop: 'bench', crowd: 5 });
shop('cafe-deli', 'DELI', 'A deli counter storefront at midday', 6, { time: 'overcast', prop: 'planters', crowd: 2 });
shop('cafe-grocery', 'MARKET', 'A corner grocery with produce out front', 2, { time: 'day', prop: 'planters', crowd: 3 });

// Retail.
shop('shop-bikes', 'CYCLES', 'A bike shop with a bicycle parked outside', 0, { time: 'day', prop: 'bike', crowd: 1 });
shop('shop-books', 'BOOKS', 'A bookshop with warm windows', 4, { time: 'dusk', prop: 'bench', crowd: 2 });
shop('shop-records', 'RECORDS', 'A record shop at night', 5, { time: 'night', prop: 'sandwich', crowd: 3 });
shop('shop-thrift', 'THRIFT', 'A thrift store on a wide sidewalk', 3, { time: 'overcast', prop: 'planters', crowd: 2 });
shop('shop-hardware', 'HARDWARE', 'A hardware store with a striped awning', 7, { time: 'day', prop: 'sandwich', crowd: 1 });
shop('shop-florist', 'FLOWERS', 'A florist with planters on the pavement', 2, { time: 'day', prop: 'planters', crowd: 2 });
shop('shop-boutique', 'GOODS', 'A small goods shop at golden hour', 4, { time: 'dusk', prop: 'bench', crowd: 2 });

// Services.
shop('svc-barber', 'BARBER', 'A barbershop in a Victorian storefront', 5, { time: 'day', prop: 'bench', crowd: 2 });
shop('svc-salon', 'SALON', 'A salon front with a soft blue facade', 0, { time: 'day', prop: 'planters', crowd: 2 });
shop('svc-laundry', 'WASH', 'A laundromat lit up after dark', 3, { time: 'night', prop: 'bench', crowd: 1 });
shop('svc-auto', 'AUTO', 'An auto shop with a truck at the kerb', 6, { time: 'overcast', prop: 'truck', crowd: 1 });
shop('svc-print', 'PRINT', 'A print shop on a quiet block', 1, { time: 'day', prop: 'sandwich', crowd: 1 });
shop('svc-cpa', 'OFFICE', 'A small professional office storefront', 3, { time: 'overcast', prop: 'planters', crowd: 2 });
shop('svc-childcare', 'LEARN', 'A childcare storefront with bright colours', 2, { time: 'day', prop: 'planters', crowd: 4 });
shop('svc-gallery', 'GALLERY', 'A gallery window at night', 4, { time: 'night', prop: 'bench', crowd: 3 });
shop('svc-studio', 'STUDIO', 'A maker studio in a converted shopfront', 7, { time: 'dusk', prop: 'sandwich', crowd: 2 });
shop('svc-venue', 'VENUE', 'An event venue entrance lit for the evening', 0, { time: 'night', prop: 'bench', crowd: 6 });
shop('svc-foodtruck', 'STREET', 'A food truck parked on the kerb', 2, { time: 'dusk', prop: 'truck', crowd: 5 });

// Interiors.
scenes.push({ key: 'in-cafe', svg: () => interior('in-cafe', { title: 'Inside a cafe at the counter', wall: '#2B3B54', floor: '#7A5A3E', trim: '#1B2739', accent: C.terracotta, kind: 'counter', time: 'day', crowd: 3 }) });
scenes.push({ key: 'in-shop', svg: () => interior('in-shop', { title: 'Inside a shop with full shelves', wall: '#E4D9C4', floor: '#8C7A5C', trim: '#8C7A5C', accent: C.forest, kind: 'shelves', time: 'day', crowd: 2 }) });
scenes.push({ key: 'in-salon', svg: () => interior('in-salon', { title: 'Inside a salon with chairs in a row', wall: '#F1E7DA', floor: '#B6A88C', trim: '#8C7A5C', accent: C.terracotta, kind: 'chairs', time: 'day', crowd: 2 }) });
scenes.push({ key: 'in-gym', svg: () => interior('in-gym', { title: 'Inside a gym floor', wall: '#20303F', floor: '#3E5568', trim: '#16232F', accent: C.gold, kind: 'gym', time: 'day', crowd: 3 }) });
scenes.push({ key: 'in-office', svg: () => interior('in-office', { title: 'Inside a small office', wall: '#DDE6F0', floor: '#8B93A3', trim: '#8B93A3', accent: C.blue, kind: 'desk', time: 'day', crowd: 2 }) });
scenes.push({ key: 'in-classroom', svg: () => interior('in-classroom', { title: 'Inside a classroom', wall: '#E9EFE7', floor: '#9C7A52', trim: '#7FB79F', accent: C.forest, kind: 'shelves', time: 'day', crowd: 4 }) });

// Open ground.
scenes.push({ key: 'out-riverfront', svg: () => landscape('out-riverfront', { title: 'The riverfront looking at the skyline', time: 'dusk', skyline: true, water: true, ground: '#3C5A46', trees: 3, people: 4 }) });
scenes.push({ key: 'out-river-night', svg: () => landscape('out-river-night', { title: 'The river at night with the city lit', time: 'night', skyline: true, water: true, ground: '#16232F', trees: 2, people: 2 }) });
scenes.push({ key: 'out-bridge', svg: () => landscape('out-bridge', { title: 'A bridge over the river', time: 'day', water: true, ground: '#3C5A46', feature: 'bridge', people: 2 }) });
scenes.push({ key: 'out-marina', svg: () => landscape('out-marina', { title: 'Boats at a marina', time: 'day', water: true, ground: '#3C5A46', feature: 'marina', people: 3 }) });
scenes.push({ key: 'out-park', svg: () => landscape('out-park', { title: 'A park with a pond and a path', time: 'day', skyline: true, ground: '#4E7A52', trees: 5, feature: 'pond', people: 5 }) });
scenes.push({ key: 'out-trail', svg: () => landscape('out-trail', { title: 'A metropark trail through the trees', time: 'day', ground: '#3F6B45', trees: 9, treesNear: 3, path: true, hills: [400], people: 2 }) });
scenes.push({ key: 'out-playground', svg: () => landscape('out-playground', { title: 'A playground in a park', time: 'day', ground: '#4E7A52', trees: 4, feature: 'playground', people: 4 }) });
scenes.push({ key: 'out-ballfield', svg: () => landscape('out-ballfield', { title: 'A ball field under the lights', time: 'dusk', ground: '#3F6B45', feature: 'ballfield', people: 3 }) });
scenes.push({ key: 'out-garden', svg: () => landscape('out-garden', { title: 'A community garden with raised beds', time: 'day', ground: '#5C7A4A', feature: 'garden', trees: 3, people: 3 }) });
scenes.push({ key: 'out-lot', svg: () => landscape('out-lot', { title: 'An empty lot behind a chain link fence', time: 'overcast', ground: '#8B93A3', feature: 'lot', skyline: true }) });
scenes.push({ key: 'out-skyline', svg: () => landscape('out-skyline', { title: 'The city skyline across the water', time: 'day', skyline: true, water: true, ground: '#3C5A46', people: 2 }) });

// Events.
scenes.push({ key: 'ev-stage', svg: () => eventScene('ev-stage', { title: 'A band on an outdoor stage', time: 'night', ground: '#1C2A3C', feature: 'stage', crowd: 11 }) });
scenes.push({ key: 'ev-market', svg: () => eventScene('ev-market', { title: 'Stalls at an outdoor market', time: 'day', ground: '#9AA4B3', feature: 'stalls', crowd: 9 }) });
scenes.push({ key: 'ev-night-market', svg: () => eventScene('ev-night-market', { title: 'A night market with lights strung overhead', time: 'night', ground: '#1C2A3C', feature: 'stalls', crowd: 10 }) });
scenes.push({ key: 'ev-fireworks', svg: () => eventScene('ev-fireworks', { title: 'Fireworks over the river', time: 'night', ground: '#16232F', feature: 'fireworks', crowd: 12 }) });
scenes.push({ key: 'ev-block-party', svg: () => eventScene('ev-block-party', { title: 'A block party with bunting across the street', time: 'dusk', ground: '#9AA4B3', feature: 'lights', crowd: 12 }) });
scenes.push({ key: 'ev-run', svg: () => eventScene('ev-run', { title: 'A road race at the start line', time: 'day', ground: '#9AA4B3', feature: 'run', crowd: 12 }) });
scenes.push({ key: 'ev-artfair', svg: () => eventScene('ev-artfair', { title: 'An art fair on a closed street', time: 'day', ground: '#A79E8C', feature: 'stalls', crowd: 8 }) });
scenes.push({ key: 'ev-parade', svg: () => eventScene('ev-parade', { title: 'A parade route lined with people', time: 'day', ground: '#9AA4B3', feature: 'parade', crowd: 14 }) });

// Bigger buildings.
scenes.push({ key: 'bld-cityhall', svg: () => bigBuilding('bld-cityhall', { title: 'A civic building with columns', time: 'day', facade: '#D8CBB2', trim: '#B6A88C', ground: '#9AA4B3', feature: 'civic', crowd: 4 }) });
scenes.push({ key: 'bld-library', svg: () => bigBuilding('bld-library', { title: 'A library building', time: 'overcast', facade: '#C8B79A', trim: '#8C7A5C', ground: '#9AA4B3', feature: 'civic', crowd: 3 }) });
scenes.push({ key: 'bld-warehouse', svg: () => bigBuilding('bld-warehouse', { title: 'A brick warehouse', time: 'dusk', facade: '#8A4E36', trim: '#5E2828', ground: '#6E6A63', feature: 'warehouse', crowd: 2 }) });
scenes.push({ key: 'bld-factory', svg: () => bigBuilding('bld-factory', { title: 'A glass works at night', time: 'night', facade: '#2E3F55', trim: '#1B2739', ground: '#232C38', feature: 'warehouse', crowd: 1 }) });
scenes.push({ key: 'bld-construction', svg: () => bigBuilding('bld-construction', { title: 'A building going up behind a crane', time: 'day', facade: '#B6A88C', trim: '#8C7A5C', ground: '#8B7B62', feature: 'crane', crowd: 3 }) });
scenes.push({ key: 'bld-victorian', svg: () => bigBuilding('bld-victorian', { title: 'A Victorian house with a turret', time: 'dusk', facade: '#7E5E7A', trim: '#4A3547', ground: '#4E7A52', feature: 'house', tower: true, crowd: 1 }) });
scenes.push({ key: 'bld-bungalow', svg: () => bigBuilding('bld-bungalow', { title: 'A bungalow on a tree lined street', time: 'day', facade: '#D8CBB2', trim: '#8C7A5C', ground: '#4E7A52', feature: 'house', crowd: 2 }) });
scenes.push({ key: 'bld-apartments', svg: () => bigBuilding('bld-apartments', { title: 'An apartment block', time: 'night', facade: '#33465F', trim: '#26364A', ground: '#232C38', feature: 'apartments', crowd: 2 }) });
scenes.push({ key: 'bld-school', svg: () => bigBuilding('bld-school', { title: 'A school building', time: 'day', facade: '#C05B44', trim: '#8E4A28', ground: '#9AA4B3', feature: 'school', crowd: 5 }) });
scenes.push({ key: 'bld-clinic', svg: () => bigBuilding('bld-clinic', { title: 'A neighbourhood clinic', time: 'day', facade: '#DCE6EE', trim: '#2F7BEE', ground: '#9AA4B3', feature: 'clinic', accent: C.forest, crowd: 3 }) });
scenes.push({ key: 'bld-firehouse', svg: () => bigBuilding('bld-firehouse', { title: 'A fire station', time: 'day', facade: '#9C3B33', trim: '#6B2621', ground: '#9AA4B3', feature: 'warehouse', crowd: 2 }) });
scenes.push({ key: 'bld-centre', svg: () => bigBuilding('bld-centre', { title: 'A community centre with a glass front', time: 'overcast', facade: '#3F6B7A', trim: '#28505C', ground: '#9AA4B3', feature: 'canopy', accent: C.gold, crowd: 4 }) });

// Close ups.
scenes.push({ key: 'obj-pothole', svg: () => objectScene('obj-pothole', { title: 'A pothole in the road with a cone beside it', bgA: '#5C6672', bgB: '#2C3540', feature: 'pothole' }) });
scenes.push({ key: 'obj-deal', svg: () => objectScene('obj-deal', { title: 'A price tag', bgA: '#1249B4', bgB: '#0A1626', feature: 'tag' }) });
scenes.push({ key: 'obj-job', svg: () => objectScene('obj-job', { title: 'A hard hat', bgA: '#2F6F5E', bgB: '#0E2C25', feature: 'hardhat' }) });
scenes.push({ key: 'obj-volunteer', svg: () => objectScene('obj-volunteer', { title: 'Two hands holding a heart', bgA: '#BE6B3D', bgB: '#5E2828', feature: 'hands' }) });
scenes.push({ key: 'obj-ticket', svg: () => objectScene('obj-ticket', { title: 'A ticket with a barcode', bgA: '#4A4560', bgB: '#16294A', feature: 'ticket' }) });
scenes.push({ key: 'obj-notice', svg: () => objectScene('obj-notice', { title: 'An envelope with a notice count', bgA: '#2F7BEE', bgB: '#0A1626', feature: 'mail' }) });
scenes.push({ key: 'obj-glass', svg: () => objectScene('obj-glass', { title: 'A stained glass panel, for the Glass City', bgA: '#16294A', bgB: '#0A1626', feature: 'glass' }) });

// Logo marks, one per emblem, skinned round the palette so neighbouring cards
// in a list do not land on the same colour.
MARKS.forEach(([slug, title, mark], i) => {
  const key = `logo-${slug}`;
  scenes.push({ key, svg: () => logoMark(key, { ...LOGO_SKINS[i % LOGO_SKINS.length], mark, title: `${title}, as a logo mark` }) });
});

// Avatars for the demo residents.
AVATAR_SKINS.forEach((skin, i) => {
  const key = `avatar-${String(i + 1).padStart(2, '0')}`;
  scenes.push({ key, svg: () => avatarMark(key, { ...skin, hat: i % 3 === 1, title: 'A stand in avatar, drawn as a silhouette' }) });
});

/* ------------------------------------------------------------------ write */

mkdirSync(OUT, { recursive: true });
if (existsSync(OUT)) {
  for (const f of readdirSync(OUT)) {
    if (f.endsWith('.svg')) unlinkSync(join(OUT, f));
  }
}

const keys = new Set();
const manifest = [];
let bytes = 0;
for (const scene of scenes) {
  if (keys.has(scene.key)) throw new Error(`duplicate art key: ${scene.key}`);
  keys.add(scene.key);
  const out = scene.svg();
  if (!out.startsWith('<svg') || !out.endsWith('</svg>')) throw new Error(`bad svg for ${scene.key}`);
  writeFileSync(join(OUT, `${scene.key}.svg`), `${out}\n`);
  // The <title> is the description a screen reader would read, so it doubles
  // as the caption on the review sheet.
  const title = /<title>(.*?)<\/title>/.exec(out)?.[1] ?? scene.key;
  manifest.push({ key: scene.key, title });
  bytes += out.length;
}

// A list the app can import, so the review sheet never drifts from what is on
// disk and a missing drawing shows up as a build error rather than a 404.
const MANIFEST_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'lib', 'demo-art-manifest.ts');
writeFileSync(
  MANIFEST_PATH,
  `// Generated by scripts/generate-demo-art.mjs. Do not edit by hand.\n`
    + `//\n`
    + `// Every drawing under public/art, with the description from its <title>.\n`
    + `// Used by the component kit to show the whole set on one page.\n\n`
    + `export interface DemoArtEntry {\n  key: string;\n  title: string;\n}\n\n`
    + `export const DEMO_ART: DemoArtEntry[] = [\n`
    + manifest.map((m) => `  { key: '${m.key}', title: ${JSON.stringify(m.title)} },`).join('\n')
    + `\n];\n`,
);

console.log(`${scenes.length} scenes, ${(bytes / 1024).toFixed(0)}KB total, average ${(bytes / scenes.length / 1024).toFixed(1)}KB`);
