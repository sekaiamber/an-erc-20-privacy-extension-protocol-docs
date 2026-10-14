// Engraved vignettes for the four doors of the dApp entry page (docs/12-visual-style.md §5).
// Dependency-free. Writes the React component the dApp uses:
//   node brand/vignettes/build.cjs                      -> dapp/components/brand/vignettes.tsx
//   node brand/vignettes/build.cjs --preview out.html   -> also a day / night preview page
const fs = require("fs");
const path = require("path");

const W = 200, H = 250;
const LW = 1.4;     // outline
const HW = 0.55;    // hatching
const GAP = 2.6;    // hatch spacing
const PAPER = "var(--card)";

// ---------- tiny element builder (html or jsx attribute names) ----------
let MODE = "html";
const JSX = { "stroke-width": "strokeWidth", "stroke-linecap": "strokeLinecap", "stroke-linejoin": "strokeLinejoin", "clip-path": "clipPath", "fill-rule": "fillRule", "clip-rule": "clipRule", "patternUnits": "patternUnits", "patternTransform": "patternTransform" };
const el = (tag, attrs = {}, children = "") => {
  const a = Object.entries(attrs).filter(([, v]) => v !== undefined).map(([k, v]) => `${MODE === "jsx" ? (JSX[k] ?? k) : k}="${v}"`).join(" ");
  return children ? `<${tag} ${a}>${children}</${tag}>` : `<${tag} ${a}/>`;
};
const p = (d, extra = {}) => el("path", { d, fill: "none", ...extra });
const ink = (d, w = LW, extra = {}) => p(d, { stroke: "currentColor", "stroke-width": w, "stroke-linecap": "round", "stroke-linejoin": "round", ...extra });
const solid = (d) => p(d, { fill: PAPER });
const f = (n) => +n.toFixed(2);

// ---------- hatching ----------
// A hatched region: lines at `angle` degrees clipped to the shape `d` (minus `minus`, if given).
let uid = 0;
function hatch(d, { angle = 45, gap = GAP, w = HW, minus, cross = false } = {}) {
  const id = `h${++uid}`;
  const pat = (pid, ang, g) => el("pattern", { id: pid, patternUnits: "userSpaceOnUse", width: 8, height: f(g), patternTransform: `rotate(${ang})` },
    ink(`M-1 ${f(g / 2)}H9`, w, { "stroke-linecap": "butt" }));
  let defs = pat(`${id}p`, angle, gap) + el("clipPath", { id: `${id}c` }, el("path", { d, "clip-rule": "evenodd", "fill-rule": "evenodd" }));
  let body = el("rect", { width: W, height: H, fill: `url(#${id}p)` });
  if (cross) { defs += pat(`${id}q`, angle + 90, gap * 1.3); body += el("rect", { width: W, height: H, fill: `url(#${id}q)` }); }
  if (minus) {
    defs += el("mask", { id: `${id}m` }, el("rect", { width: W, height: H, fill: "white" }) + el("path", { d: minus, fill: "black" }));
    return el("defs", {}, defs) + el("g", { "clip-path": `url(#${id}c)`, mask: `url(#${id}m)` }, body);
  }
  return el("defs", {}, defs) + el("g", { "clip-path": `url(#${id}c)` }, body);
}

// ---------- the niche (shared by all four) ----------
const NX0 = 44, NX1 = 156, NR = 56, NCY = 104; // inner arch: centre (100,104), radius 56
const LEDGE = 226;
const niche = `M${NX0} ${LEDGE}V${NCY}A${NR} ${NR} 0 0 1 ${NX1} ${NCY}V${LEDGE}Z`;
const nicheShift = `M${NX0 + 13} ${LEDGE + 20}V${NCY + 12}A${NR} ${NR} 0 0 1 ${NX1 + 13} ${NCY + 12}V${LEDGE + 20}Z`;
function frame(inner) {
  const outer = `M30 ${LEDGE}V${NCY}A70 70 0 0 1 170 ${NCY}V${LEDGE}`;
  const mid = `M37 ${LEDGE}V${NCY}A63 63 0 0 1 163 ${NCY}V${LEDGE}`;
  // keystone
  const key = `M93 ${NCY - 70.5}L95 ${NCY - 58}H105L107 ${NCY - 70.5}`;
  return [
    hatch(niche, { minus: nicheShift, angle: 50 }),             // shadow inside the niche, upper left
    ink(outer), ink(mid, 0.9), ink(`M${NX0} ${LEDGE}V${NCY}A${NR} ${NR} 0 0 1 ${NX1} ${NCY}V${LEDGE}`),
    ink(key, 1.1),
    // imposts
    ink(`M28 ${NCY}H${NX0}M${NX1} ${NCY}H172`, 1.1),
    inner,
    // ledge
    solid(`M20 ${LEDGE}H180V${LEDGE + 9}H20Z`), ink(`M20 ${LEDGE}H180V${LEDGE + 9}H20Z`),
    hatch(`M20 ${LEDGE + 9}H180V${LEDGE + 14}H20Z`, { angle: 0, gap: 1.6 }),
    ink(`M22 ${LEDGE + 14}H178`, 0.9),
  ].join("");
}

// ---------- 1. the lantern (Cicerone) ----------
function lantern() {
  const cx = 100;
  const base = `M${cx - 24} ${LEDGE}L${cx - 20} ${LEDGE - 8}H${cx + 20}L${cx + 24} ${LEDGE}Z`;
  const body = `M${cx - 22} ${LEDGE - 8}V138H${cx + 22}V${LEDGE - 8}Z`;
  const roof = `M${cx - 27} 138L${cx} 112L${cx + 27} 138Z`;
  const cap = `M${cx - 6} 112V104H${cx + 6}V112`;
  const ring = `M${cx} 104m-7 -6a7 7 0 1 0 14 0a7 7 0 1 0 -14 0`;
  const flame = `M${cx} 158C${cx + 7} 168 ${cx + 6} 180 ${cx} 182C${cx - 6} 180 ${cx - 7} 168 ${cx} 158Z`;
  const candle = `M${cx - 4} 182H${cx + 4}V${LEDGE - 8}H${cx - 4}Z`;
  const glow = `M${cx} 170m-15 0a15 15 0 1 0 30 0a15 15 0 1 0 -30 0`;
  return [
    // cast shadow on the niche wall, to the right
    hatch(`M${cx + 22} 142L${cx + 36} 150V${LEDGE}H${cx + 22}Z`, { angle: 40, gap: 2 }),
    solid(body), solid(roof), solid(base),
    // shaded right third of the body and the roof's right face
    hatch(`M${cx + 8} 138H${cx + 22}V${LEDGE - 8}H${cx + 8}Z`, { angle: 45, minus: glow }),
    hatch(`M${cx} 112L${cx + 27} 138H${cx}Z`, { angle: 45 }),
    hatch(`M${cx} ${LEDGE - 8}H${cx + 20}L${cx + 24} ${LEDGE}H${cx}Z`, { angle: 45, gap: 1.8 }),
    ink(body), ink(`M${cx - 8} 138V${LEDGE - 8}M${cx + 8} 138V${LEDGE - 8}`, 1),
    ink(`M${cx - 22} 146H${cx + 22}M${cx - 22} ${LEDGE - 16}H${cx + 22}`, 0.9),
    solid(candle), ink(candle, 1), solid(flame), ink(flame, 1.1),
    ink(roof), ink(`M${cx} 112V138`, 0.9), solid(cap), ink(cap), ink(ring),
    ink(base),
    // rays of light, drawn short through the panes
    ink(`M${cx - 15} 170H${cx - 11}M${cx + 11} 170H${cx + 15}M${cx} 150V153M${cx - 11} 157L${cx - 8} 160M${cx + 11} 157L${cx + 8} 160`, 0.8),
  ].join("");
}

// ---------- 2. the bust (Tracks) ----------
function bust() {
  const plinth = `M80 ${LEDGE}V204H120V${LEDGE}Z`;
  const plinthTop = `M74 204V198H126V204Z`;
  const shoulders = `M58 198C58 185 66 176 80 171C87 168 91 165 93 158L111 158C112 165 115 168 121 171C135 176 142 185 142 198Z`;
  // head in profile, facing left (towards the light), in a Florentine cap
  const head = `M93 160C92 155 90 153 87 152C84 151 83 149 84 147C82 146 82 144 83.5 143C82 142 82 140 84 139C81 137 78 136 79 133C80 130 83 127 84 124C84 120 84 117 85 113L124 113C127 120 126 130 122 138C119 144 116 150 113 160Z`;
  const cap = `M82 117C80 104 90 91 106 90C123 89 133 100 131 113C130 121 127 127 123 130C118 123 111 119 103 118C95 117 88 117 82 117Z`;
  const brim = `M82 117C90 121 99 122 108 121`;
  const ear = `M111 125C114 123 117 126 116 130C115 134 112 135 110 133`;
  const eye = `M88 125C90 124 92 124 93 125`;
  const right = `M101 0H${W}V${H}H101Z`;
  return [
    hatch(`M121 175C137 180 147 190 149 198V${LEDGE}H121Z`, { angle: 40, gap: 2 }),
    solid(plinth), solid(plinthTop), solid(shoulders), solid(head),
    hatch(shoulders, { angle: 45, minus: `M0 0H106V${H}H0Z` }),
    hatch(head, { angle: 45, gap: 2.2, minus: `M0 0H103V${H}H0Z` }),
    hatch(`M108 204H120V${LEDGE}H108Z`, { angle: 45, gap: 2 }),
    hatch(`M93 160L113 160L112 166C106 164 99 164 93 166Z`, { angle: 45, gap: 1.6 }),
    solid(cap), hatch(cap, { angle: -35, gap: 2.4, w: 0.5 }), hatch(cap, { angle: 45, gap: 2.4, w: 0.5, minus: `M0 0H104V${H}H0Z` }),
    ink(shoulders), ink(head), ink(cap), ink(brim, 0.8), ink(ear, 1), ink(eye, 1),
    ink(`M84 181C92 186 108 186 117 181M78 188C88 193 112 193 122 188`, 0.7),
    ink(plinth), ink(plinthTop), ink(`M84 210H116`, 0.8),
  ].join("");
}

// ---------- 3. the books (Learn) ----------
function books() {
  const b1 = `M58 ${LEDGE}V212H142V${LEDGE}Z`;
  const b2 = `M64 212V200H136V212Z`;
  // open book on top
  const left = `M100 196C88 190 72 189 56 193L60 168C76 164 90 166 100 172Z`;
  const right = `M100 196C112 190 128 189 144 193L140 168C124 164 110 166 100 172Z`;
  const under = `M54 196C72 192 88 193 100 200C112 193 128 192 146 196L144 193C128 189 112 190 100 196C88 190 72 189 56 193Z`;
  const text = [];
  for (let i = 0; i < 6; i++) {
    const y = 173 + i * 3.6;
    text.push(`M${65 + i * 0.6} ${y + 1.5 - i * 0.2}C${76} ${y - 1.5} ${88} ${y - 1} ${96} ${y + 2.5}`);
    text.push(`M${104} ${y + 2.5}C${112} ${y - 1} ${124} ${y - 1.5} ${135 - i * 0.6} ${y + 1.5 - i * 0.2}`);
  }
  const ribbon = `M101 198C102 206 99 214 103 222L106 220C102 212 105 206 104 198Z`;
  const quill = `M112 160C126 140 146 120 160 108C150 124 134 142 116 160Z`;
  return [
    hatch(`M142 210L152 212V${LEDGE}H142Z`, { angle: 40, gap: 2 }),
    solid(b1), solid(b2),
    hatch(`M120 212H142V${LEDGE}H120Z`, { angle: 45 }), hatch(`M122 200H136V212H122Z`, { angle: 45 }),
    ink(b1), ink(`M58 216H142M58 221H142`, 0.6), ink(b2), ink(`M64 205H136`, 0.6),
    solid(under), ink(under, 1), solid(left), solid(right),
    hatch(right, { angle: 45, gap: 3.4 }),
    ink(left), ink(right), ink(text.join(""), 0.6),
    solid(ribbon), ink(ribbon, 0.9),
    solid(quill), hatch(quill, { angle: -40, gap: 1.8, w: 0.45 }), ink(quill, 1), ink(`M116 160L110 168`, 1.1),
  ].join("");
}

// ---------- 4. the dividers and the cipher disk (Tools) ----------
function tools() {
  const cx = 100, cy = 168;
  const disk = (r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const ticks = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    ticks.push(`M${f(cx + ca * 30)} ${f(cy + sa * 30)}L${f(cx + ca * 46)} ${f(cy + sa * 46)}`);
  }
  const marks = [];
  for (let i = 0; i < 24; i++) {
    const a = ((i + 0.5) / 24) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    marks.push(`M${f(cx + ca * 37)} ${f(cy + sa * 37)}L${f(cx + ca * 40)} ${f(cy + sa * 40)}`);
    const a2 = ((i + 0.5) / 24) * Math.PI * 2 + 0.08;
    marks.push(`M${f(cx + Math.cos(a2) * 22)} ${f(cy + Math.sin(a2) * 22)}L${f(cx + Math.cos(a2) * 25)} ${f(cy + Math.sin(a2) * 25)}`);
  }
  // the disk stands on the ledge, leaning on the wall; the dividers stand open in front of it
  const legL = `M98 98L68 ${LEDGE}L72 ${LEDGE - 2}L101 104Z`;
  const legR = `M102 98L132 ${LEDGE}L128 ${LEDGE - 2}L99 104Z`;
  const hinge = `M100 101m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0`;
  const handle = `M97 94V84H103V94`;
  return [
    hatch(`M146 160C150 180 150 205 140 ${LEDGE}H152V160Z`, { angle: 40, gap: 2 }),
    solid(disk(48)), hatch(disk(48), { angle: 45, minus: `M${cx - 60} ${cy - 60}h66v130h-66Z` }),
    solid(disk(30)), hatch(disk(30), { angle: 45, gap: 3.4, minus: `M${cx - 60} ${cy - 60}h66v130h-66Z` }),
    ink(disk(48)), ink(disk(46), 0.7), ink(disk(30)), ink(disk(28), 0.7),
    ink(ticks.join(""), 0.6), ink(marks.join(""), 1.3),
    ink(disk(3), 1), // pivot
    solid(legL), hatch(legL, { angle: 45, gap: 1.8, minus: `M0 0H99V${H}H0Z` }), ink(legL, 1.1),
    solid(legR), hatch(legR, { angle: 45, gap: 1.8 }), ink(legR, 1.1),
    ink(`M84 160Q100 154 116 160`, 1.1), // the arc of the dividers
    solid(hinge), ink(hinge), ink(handle, 1.1),
  ].join("");
}

// ---------- 5. quill and inkpot (publish a token) ----------
function quill() {
  const pot = `M76 ${LEDGE}C71 210 73 197 84 192H116C127 197 129 210 124 ${LEDGE}Z`;
  const neck = `M88 192V184H112V192Z`;
  const rim = `M85 184H115V179H85Z`;
  const vane = `M100 182C110 156 126 126 148 98C144 124 130 154 106 182Z`;
  return [
    hatch(`M124 196C134 200 138 212 136 ${LEDGE}H124Z`, { angle: 40, gap: 2 }),
    solid(pot), hatch(pot, { angle: 45, minus: `M0 0H104V${H}H0Z` }), ink(pot), ink(`M80 206C92 210 108 210 120 206`, 0.8),
    solid(neck), hatch(neck, { angle: 45, gap: 1.8, minus: `M0 0H104V${H}H0Z` }), ink(neck),
    solid(vane), hatch(vane, { angle: -40, gap: 2, w: 0.45 }), ink(vane, 1.1), ink(`M102 184L128 132`, 0.8),
    solid(rim), ink(rim),
  ].join("");
}

// ---------- 6. the reading lens (look at a token) ----------
function lens() {
  const cx = 96, cy = 146;
  const ring = (r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const handle = `M116 170L142 222L134 ${LEDGE}L108 176Z`;
  return [
    hatch(`M134 160C146 176 150 200 146 ${LEDGE}H138L132 214Z`, { angle: 40, gap: 2 }),
    solid(handle), hatch(handle, { angle: 45, gap: 1.8, minus: `M0 0H124V${H}H0Z` }), ink(handle), ink(`M118 186L134 182M124 198L140 194`, 0.8),
    solid(ring(36)), hatch(ring(36) + ring(29), { angle: 45, gap: 1.8, minus: `M0 0H${cx}V${H}H0Z` }),
    hatch(ring(29), { angle: 45, gap: 4, minus: `M0 0H${W}V${cy}H0Z` }),
    ink(ring(36)), ink(ring(29)), ink(`M${cx - 18} ${cy - 10}A20 20 0 0 1 ${cx - 6} ${cy - 20}`, 1.4),
  ].join("");
}

// ---------- 7. the mask (hide who pays whom) ----------
function mask() {
  const face = "M56 138C60 122 84 118 100 128C116 118 140 122 144 138C142 156 128 170 112 166C106 164 103 158 100 158C97 158 94 164 88 166C72 170 58 156 56 138Z";
  const eyes = "M70 143C74 136 86 136 90 143C86 149 74 149 70 143ZM110 143C114 136 126 136 130 143C126 149 114 149 110 143Z";
  const pole = `M98 160V214H102V160Z`;
  const foot = `M86 ${LEDGE}C88 218 94 214 100 214C106 214 112 218 114 ${LEDGE}Z`;
  return [
    hatch(`M102 172H110V${LEDGE}H102Z`, { angle: 40, gap: 2 }),
    solid(pole), ink(pole, 1), solid(foot), hatch(foot, { angle: 45, gap: 1.8, minus: `M0 0H100V${H}H0Z` }), ink(foot),
    solid(face + eyes), hatch(face + eyes, { angle: 45, minus: `M0 0H101V${H}H0Z` }),
    ink(face), ink(eyes, 1.1), ink("M100 130V156", 0.6),
    ink("M57 136C50 146 54 160 48 172C46 178 50 184 46 190M143 136C150 146 146 160 152 172C154 178 150 184 154 190", 1),
  ].join("");
}

// ---------- 8. the purse (hide the amount) ----------
function purse() {
  const body = `M70 ${LEDGE - 2}C58 202 64 172 92 160H108C136 172 142 202 130 ${LEDGE - 2}C116 ${LEDGE + 1} 84 ${LEDGE + 1} 70 ${LEDGE - 2}Z`;
  const frill = "M80 140C88 150 112 150 120 140C114 132 86 132 80 140Z";
  return [
    hatch(`M128 176C142 190 146 210 140 ${LEDGE}H128Z`, { angle: 40, gap: 2 }),
    solid(body), hatch(body, { angle: 45, minus: `M0 0H104V${H}H0Z` }), ink(body),
    ink("M84 190C88 204 88 214 86 222M100 176V222M116 190C112 204 112 214 114 222", 0.7),
    solid("M92 160L88 146H112L108 160Z"), ink("M92 160L88 146M108 160L112 146", 1),
    solid(frill), hatch(frill, { angle: 45, gap: 2, minus: `M0 0H102V${H}H0Z` }), ink(frill),
    ink("M90 158C96 162 104 162 110 158", 1.3), ink("M104 161C108 170 106 178 110 184M104 161C102 170 98 176 100 184", 0.9),
  ].join("");
}

// ---------- 9. the scales (an open ledger at the token's own address) ----------
function scales() {
  const post = `M98 100V214H102V100Z`;
  const base = `M80 ${LEDGE}L86 214H114L120 ${LEDGE}Z`;
  const pan = (x) => `M${x - 20} 168C${x - 16} 182 ${x + 16} 182 ${x + 20} 168Z`;
  return [
    hatch(`M102 106H110V${LEDGE}H102Z`, { angle: 40, gap: 2 }),
    solid(base), hatch(base, { angle: 45, gap: 1.8, minus: `M0 0H100V${H}H0Z` }), ink(base),
    solid(post), ink(post, 1),
    ink("M58 104H142", 2.2), ink("M100 92m-6 0a6 6 0 1 0 12 0a6 6 0 1 0 -12 0", 1.1), ink("M100 98L94 112H106Z", 1),
    ink("M58 104L44 168M58 104L72 168M142 104L128 168M142 104L156 168", 0.7),
    solid(pan(58)), ink(pan(58)), solid(pan(142)), hatch(pan(142), { angle: 45, gap: 1.8 }), ink(pan(142)),
  ].join("");
}

// ---------- 10. the key (a confidential ledger only; DeFi through the Wrapper) ----------
function key() {
  const bow = "M100 116m-20 0a20 20 0 1 0 40 0a20 20 0 1 0 -40 0Z";
  const hole = "M100 116m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0Z";
  const shaft = `M96 135V${LEDGE}H104V135Z`;
  const bit = `M104 194H124V202H118V208H124V${LEDGE}H104Z`;
  return [
    hatch(`M104 140H112V${LEDGE}H104ZM124 198H132V${LEDGE}H124Z`, { angle: 40, gap: 2 }),
    solid(bow + hole), hatch(bow + hole, { angle: 45, minus: `M0 0H101V${H}H0Z` }), ink(bow), ink(hole),
    ink("M84 104C90 98 96 96 100 96", 1.2),
    solid(shaft), hatch(shaft, { angle: 45, gap: 1.8, minus: `M0 0H100V${H}H0Z` }), ink(shaft), ink("M94 140H106M94 146H106", 1),
    solid(bit), hatch(bit, { angle: 45, gap: 1.8 }), ink(bit),
  ].join("");
}

// ---------- 11. the seal matrix (role issuance) ----------
function stamp() {
  const knob = "M100 104C110 104 116 112 114 124C112 134 106 140 106 150C106 160 112 168 112 176H88C88 168 94 160 94 150C94 140 88 134 86 124C84 112 90 104 100 104Z";
  const collar = "M86 176H114V184H86Z";
  const neck = "M92 184H108V200H92Z";
  const base = `M74 200H126V${LEDGE}H74Z`;
  const face = `M76 ${LEDGE - 4}H124`;
  const right = `M0 0H101V${H}H0Z`;
  return [
    hatch(`M126 204C134 208 138 216 138 ${LEDGE}H126Z`, { angle: 40, gap: 2 }),
    solid(base), hatch(base, { angle: 45, minus: `M0 0H106V${H}H0Z` }), ink(base), ink(face, 0.8),
    ink(`M82 212H118M82 218H118`, 0.6),
    solid(neck), hatch(neck, { angle: 45, gap: 1.8, minus: right }), ink(neck),
    solid(collar), hatch(collar, { angle: 45, gap: 1.8, minus: right }), ink(collar),
    solid(knob), hatch(knob, { angle: 45, minus: right }), ink(knob),
    ink("M92 116C94 110 97 108 100 108", 1.1),
  ].join("");
}

const ART = { lantern, bust, books, tools, quill, lens, mask, purse, scales, key, stamp };

function svg(name) {
  return el("svg", { viewBox: `0 0 ${W} ${H}`, xmlns: MODE === "html" ? "http://www.w3.org/2000/svg" : undefined }, frame(ART[name]()));
}

// ---------- preview ----------
const pi = process.argv.indexOf("--preview");
if (pi > 0) {
  MODE = "html";
  const css = (theme) => theme === "day" ? "--card:#FBF8F1;color:#211F26;background:#F3EEE3" : "--card:#272019;color:#EBE3D2;background:#1D1814";
  const cells = (theme) => Object.keys(ART).map((n) => `<div style="${css(theme)};padding:12px"><div style="background:var(--card);padding:10px">${svg(n)}</div></div>`).join("");
  fs.writeFileSync(process.argv[pi + 1], `<!doctype html><meta charset=utf-8><style>body{margin:0;display:grid;grid-template-columns:repeat(5,220px)}svg{display:block;width:100%}</style>${cells("day")}${cells("night")}`);
}

// ---------- the React component ----------
MODE = "jsx";
const HEADER = `"use client";

// Engraved vignettes for the four doors of the entry page: a niche with one object each, drawn in ink
// with hatching, light from the upper left (docs/12-visual-style.md §5 in the docs repo). They draw in
// the current text colour on the card colour, so they work by day and by night.
//
// Generated by brand/vignettes/build.cjs in the docs repo; edit the generator, not this file.

import { useId } from "react";

export type VignetteKind = keyof typeof ART;

export function Vignette({ kind, className }: { kind: VignetteKind; className?: string }) {
  const id = \`v\${useId().replace(/[^a-zA-Z0-9]/g, "")}\`;
  const Art = ART[kind];
  return (
    <svg viewBox="0 0 200 250" className={className} aria-hidden>
      <Art id={id} />
    </svg>
  );
}

`;
const comps = Object.keys(ART).map((n) => {
  uid = 0;
  const body = frame(ART[n]()).replace(/id="h(\d+)([a-z])"/g, 'id={`${id}h$1$2`}').replace(/url\(#h(\d+)([a-z])\)/g, "url(#${id}h$1$2)").replace(/(clipPath|mask|fill)="(url\(#\$\{id\}[^"]+\))"/g, "$1={`$2`}");
  const Name = n[0].toUpperCase() + n.slice(1);
  return `function ${Name}Art({ id }: { id: string }) {\n  return (\n    <>${body}</>\n  );\n}`;
}).join("\n\n");
const OUT = path.join(__dirname, "../../dapp/components/brand/vignettes.tsx");
fs.writeFileSync(OUT, HEADER + comps + "\n\nconst ART = { " + Object.keys(ART).map((n) => `${n}: ${n[0].toUpperCase() + n.slice(1)}Art`).join(", ") + " };\n");
console.log("wrote", path.relative(process.cwd(), OUT));
