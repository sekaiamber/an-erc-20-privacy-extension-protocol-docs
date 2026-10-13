// Builds casata-seal.svg: the Casata wax seal as one self-contained SVG file.
//
//   node brand/seal/build.cjs
//
// No dependencies. The legend's letters are outlines read from legend-glyphs.json.
//
// How the relief is made. The seal is drawn as a height map in three colour channels and then lit
// by an SVG filter:
//   red   = the blob of wax (its outline)
//   green = the rim squeezed out around the matrix (the blob minus the round field)
//   blue  = everything the matrix impressed: borders, beads, legend, shield, charges
// The filter blurs each channel by a different amount, adds them into one height, and lights that
// height from the upper left (azimuth 225). A blue value below full, such as SHIELD_FACE, gives a
// lower step: the face of the shield stands a little above the field, the charges above the face.
const fs = require("fs");
const path = require("path");

const GLYPHS = JSON.parse(fs.readFileSync(path.join(__dirname, "legend-glyphs.json"), "utf8"));

// ---- parameters -------------------------------------------------------------------------------

const C = 200; // centre of the 400 x 400 drawing
const WAX = { light: "#8E1E19", ambient: "#2A0807", gloss: "#FFE8DC" };
const BLOB_RADII = [176, 170, 181, 174, 166, 172, 180, 171, 164, 169, 178, 184, 173, 167, 175, 182];
const SHADOW = { dx: 5, dy: 9, blur: 9, opacity: 0.3 };

// Everything the matrix impressed is drawn in a 400-unit space and then enlarged by this factor.
const MATRIX_SCALE = 1.1;
const FIELD_R = 130; // edge of the matrix, where the rim begins
const BORDER_R = 122;
const BEAD_R = 114;
const BEADS = 80;
const INNER_R = 86; // inner edge of the legend band

const LEGEND = {
  radius: 90, // baseline
  size: 26,
  // Read clockwise from the top: a lily, CASATA down the right side, a lily, SEGRETA up the left.
  runs: [
    { text: "CASATA", centre: 90, length: 196 },
    { text: "SEGRETA", centre: 270, length: 214 },
  ],
  lilies: [0, 180],
  lilyScale: 0.95,
};

const SHIELD_FACE = "#000058";
const CY = 202; // the arms sit two units below the centre

const LIGHT = { azimuth: 225, elevation: 58 };
const RELIEF = {
  blobErode: 7, blobBlur: 6, rimErode: 4, rimBlur: 4.5, detailBlur: 1.2,
  kBlob: 0.5, kRim: 0.32, kDetail: 0.13,
  grainFreq: 0.7, kGrain: 0.002,
  scale: 12, diffuse: 1, specular: 0.5, shine: 40,
  mottleFreq: 0.012, mottle: 0.34,
};

// ---- geometry ---------------------------------------------------------------------------------

const f = (v) => v.toFixed(2);

// Closed Catmull-Rom spline through points at the given radii: the irregular outline of the wax.
function blob(radii) {
  const n = radii.length;
  const pts = radii.map((r, i) => {
    const a = (i / n) * 2 * Math.PI;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  });
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + " Z";
}

const circle = (r) => `M ${f(C - r)} ${C} a ${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a ${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`;

// Offsets from the centre of the arms.
const pt = (dx, dy) => `${f(C + dx)} ${f(CY + dy)}`;

// A symmetric outline from its right half, given as cubic segments [control, control, end].
function symmetric(start, segs) {
  let d = `M ${pt(...start)}`;
  for (const [a, b, c] of segs) d += ` C ${pt(...a)} ${pt(...b)} ${pt(...c)}`;
  const ends = [start, ...segs.map((s) => s[2])];
  const mirror = (p) => [-p[0], p[1]];
  for (let i = segs.length - 1; i >= 0; i--) {
    const [a, b] = segs[i];
    d += ` C ${pt(...mirror(b))} ${pt(...mirror(a))} ${pt(...mirror(ends[i]))}`;
  }
  return d + " Z";
}

// Horse-head shield (scudo a testa di cavallo), broad, with a shallow waist.
const SHIELD = symmetric([0, -60], [
  [[12, -55], [28, -54], [50, -62]],
  [[51, -46], [46, -24], [41, -8]],
  [[39, 0], [40, 8], [43, 16]],
  [[47, 30], [42, 46], [28, 56]],
  [[18, 62], [8, 64], [0, 68]],
]);

// The charge: an open Gothic majuscule C, drawn as shapes. A swelling bowl cut open on the right,
// trumpet serifs, an inline cut into the bowl, and a lozenge between two pearls on its back.
// It is left open on purpose: with the closing hairline of the period it reads as a G today.
function gothicC(x, y, R) {
  const X = (v) => f(C + x + v * R), Y = (v) => f(CY + y + v * R), L = (v) => f(v * R);
  const ellipse = (cx, rx, ry) =>
    `M ${X(cx - rx)} ${Y(0)} a ${L(rx)} ${L(ry)} 0 1 0 ${L(2 * rx)} 0 a ${L(rx)} ${L(ry)} 0 1 0 ${L(-2 * rx)} 0 Z`;
  const serif = (s) =>
    `<path d="M ${X(0.44)} ${Y(-0.9 * s)} C ${X(0.56)} ${Y(-0.86 * s)} ${X(0.66)} ${Y(-0.9 * s)} ${X(0.78)} ${Y(-0.97 * s)} ` +
    `C ${X(0.72)} ${Y(-0.7 * s)} ${X(0.72)} ${Y(-0.44 * s)} ${X(0.76)} ${Y(-0.16 * s)} ` +
    `C ${X(0.66)} ${Y(-0.3 * s)} ${X(0.6)} ${Y(-0.4 * s)} ${X(0.52)} ${Y(-0.52 * s)} Z"/>`;
  return `<clipPath id="bowl"><rect x="${X(-1.3)}" y="${Y(-1.2)}" width="${L(1.88)}" height="${L(2.4)}"/></clipPath>
<path d="${ellipse(0, 1, 1)} ${ellipse(0.2, 0.58, 0.74)}" fill-rule="evenodd" clip-path="url(#bowl)"/>
<path d="M ${X(-0.4)} ${Y(-0.66)} C ${X(-0.8)} ${Y(-0.34)} ${X(-0.8)} ${Y(0.34)} ${X(-0.4)} ${Y(0.66)} C ${X(-0.72)} ${Y(0.32)} ${X(-0.72)} ${Y(-0.32)} ${X(-0.4)} ${Y(-0.66)} Z" fill="${SHIELD_FACE}"/>
<path d="M ${X(-1.14)} ${Y(0)} L ${X(-1.0)} ${Y(-0.12)} L ${X(-0.9)} ${Y(0)} L ${X(-1.0)} ${Y(0.12)} Z"/>
<circle cx="${X(-1.02)}" cy="${Y(-0.27)}" r="${L(0.055)}"/><circle cx="${X(-1.02)}" cy="${Y(0.27)}" r="${L(0.055)}"/>
${serif(1)}${serif(-1)}`;
}

const ARMS = `<path d="${SHIELD}" fill="${SHIELD_FACE}"/>
<path d="${SHIELD}" fill="none" stroke="#00f" stroke-width="3.6"/>
<circle cx="${C}" cy="${f(CY - 37)}" r="8.5" fill="none" stroke="#00f" stroke-width="4.4"/>
${gothicC(0, 21, 27)}`;

// ---- legend -----------------------------------------------------------------------------------

// Angles are measured clockwise from the top of the seal, in degrees. Letters stand on the
// baseline circle with their heads pointing outward, as on a seal or a coin.
function legendRun({ text, centre, length }) {
  const k = LEGEND.size / GLYPHS.unitsPerEm;
  const letters = [...text].map((ch) => {
    const g = GLYPHS.glyphs[ch];
    if (!g) throw new Error(`no outline for "${ch}"; run tools/extract-glyphs.cjs`);
    return { d: g.d, advance: g.advance * k };
  });
  const natural = letters.reduce((s, l) => s + l.advance, 0);
  const gap = (length - natural) / (letters.length - 1);
  let s = -length / 2;
  return letters.map((l) => {
    const mid = s + l.advance / 2;
    s += l.advance + gap;
    const deg = centre + (mid / LEGEND.radius) * (180 / Math.PI);
    const rad = (deg * Math.PI) / 180;
    const x = C + LEGEND.radius * Math.sin(rad), y = C - LEGEND.radius * Math.cos(rad);
    return `<path transform="translate(${f(x)} ${f(y)}) rotate(${f(deg)}) scale(${k.toFixed(5)}) translate(${f(-l.advance / k / 2)} 0)" d="${l.d}"/>`;
  }).join("\n");
}

// A plain fleur-de-lis used as a stop between the two words. About 24 units tall before scaling.
function lily(deg) {
  const r = LEGEND.radius + LEGEND.size * 0.36;
  const side = (m) =>
    `<path d="M ${2 * m} 3.5 C ${3 * m} -2 ${6 * m} -6.5 ${9 * m} -6 C ${11.5 * m} -5.5 ${11.5 * m} -1.5 ${8.5 * m} -0.5 C ${9.5 * m} -2.5 ${7.5 * m} -3.5 ${6.5 * m} -1.5 C ${5.5 * m} 0.5 ${5 * m} 2.5 ${4.6 * m} 3.5 Z"/>` +
    `<path d="M ${2.6 * m} 5.8 C ${3.5 * m} 8 ${6 * m} 9.5 ${8 * m} 9 C ${6.5 * m} 10.6 ${3.5 * m} 10.2 ${1.8 * m} 7.6 Z"/>`;
  return `<g transform="rotate(${deg} ${C} ${C}) translate(${C} ${f(C - r)}) scale(${LEGEND.lilyScale})">` +
    `<path d="M 0 -12.5 C 4.2 -7 4.6 -1 0 4 C -4.6 -1 -4.2 -7 0 -12.5 Z"/>${side(1)}${side(-1)}` +
    `<rect x="-5.6" y="3.4" width="11.2" height="2.5"/><path d="M 0 5.8 L 2.3 8.6 L 0 12.5 L -2.3 8.6 Z"/></g>`;
}

// ---- the file ---------------------------------------------------------------------------------

const BLOB = blob(BLOB_RADII);
// A colour matrix that moves one colour channel into alpha, where the lighting filters read height.
const alphaFrom = (r, g, b) => `0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${r} ${g} ${b} 0 0`;
const R = RELIEF;
const m = R.mottle, mb = 1 - R.mottle / 2;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="Casata wax seal">
<title>Casata</title>
<defs>
<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${SHADOW.blur}"/></filter>
<filter id="wax" x="0" y="0" width="400" height="400" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
<feColorMatrix in="SourceGraphic" type="matrix" values="${alphaFrom(1, 0, 0)}" result="aBlob"/>
<feColorMatrix in="SourceGraphic" type="matrix" values="${alphaFrom(0, 1, 0)}" result="aRim"/>
<feColorMatrix in="SourceGraphic" type="matrix" values="${alphaFrom(0, 0, 1)}" result="aDetail"/>
<feMorphology in="aBlob" operator="erode" radius="${R.blobErode}" result="eBlob"/>
<feGaussianBlur in="eBlob" stdDeviation="${R.blobBlur}" result="bBlob"/>
<feMorphology in="aRim" operator="erode" radius="${R.rimErode}" result="eRim"/>
<feGaussianBlur in="eRim" stdDeviation="${R.rimBlur}" result="bRim"/>
<feGaussianBlur in="aDetail" stdDeviation="${R.detailBlur}" result="bDetail"/>
<feComposite in="bBlob" in2="bRim" operator="arithmetic" k1="0" k2="${R.kBlob}" k3="${R.kRim}" k4="0" result="h1"/>
<feComposite in="h1" in2="bDetail" operator="arithmetic" k1="0" k2="1" k3="${R.kDetail}" k4="0" result="h2"/>
<feTurbulence type="fractalNoise" baseFrequency="${R.grainFreq}" numOctaves="2" seed="3" result="grain"/>
<feComposite in="h2" in2="grain" operator="arithmetic" k1="0" k2="1" k3="${R.kGrain}" k4="0" result="height"/>
<feDiffuseLighting in="height" surfaceScale="${R.scale}" diffuseConstant="${R.diffuse}" lighting-color="${WAX.light}" result="diff"><feDistantLight azimuth="${LIGHT.azimuth}" elevation="${LIGHT.elevation}"/></feDiffuseLighting>
<feSpecularLighting in="height" surfaceScale="${R.scale}" specularConstant="${R.specular}" specularExponent="${R.shine}" lighting-color="${WAX.gloss}" result="spec"><feDistantLight azimuth="${LIGHT.azimuth}" elevation="${LIGHT.elevation}"/></feSpecularLighting>
<feFlood flood-color="${WAX.ambient}" result="ambient"/>
<feComposite in="diff" in2="ambient" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="lit"/>
<feTurbulence type="fractalNoise" baseFrequency="${R.mottleFreq}" numOctaves="3" seed="11" result="noise"/>
<feColorMatrix in="noise" type="matrix" values="${m} 0 0 0 ${mb}  ${m} 0 0 0 ${mb}  ${m} 0 0 0 ${mb}  0 0 0 0 1" result="mottle"/>
<feBlend in="lit" in2="mottle" mode="multiply" result="mottled"/>
<feComposite in="spec" in2="mottled" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="glossy"/>
<feComposite in="glossy" in2="aBlob" operator="in"/>
</filter>
</defs>
<path d="${BLOB}" transform="translate(${SHADOW.dx} ${SHADOW.dy})" fill="#1A0F0A" opacity="${SHADOW.opacity}" filter="url(#shadow)"/>
<g filter="url(#wax)">
<rect width="400" height="400" fill="#000"/>
<path d="${BLOB}" fill="#f00"/>
<path d="${BLOB} ${circle(FIELD_R * MATRIX_SCALE)}" fill="#0f0" fill-rule="evenodd" style="mix-blend-mode:screen"/>
<g fill="#00f" style="mix-blend-mode:screen" transform="translate(${C} ${C}) scale(${MATRIX_SCALE}) translate(${-C} ${-C})">
<circle cx="${C}" cy="${C}" r="${BORDER_R}" fill="none" stroke="#00f" stroke-width="3"/>
<circle cx="${C}" cy="${C}" r="${BEAD_R}" fill="none" stroke="#00f" stroke-width="5" stroke-linecap="round" stroke-dasharray="0.01 ${((2 * Math.PI * BEAD_R) / BEADS).toFixed(3)}"/>
<circle cx="${C}" cy="${C}" r="${INNER_R}" fill="none" stroke="#00f" stroke-width="2.5"/>
${LEGEND.runs.map(legendRun).join("\n")}
${LEGEND.lilies.map(lily).join("\n")}
${ARMS}
</g>
</g>
</svg>
`;

fs.writeFileSync(path.join(__dirname, "casata-seal.svg"), svg);
console.log(`wrote casata-seal.svg (${svg.length} bytes)`);
