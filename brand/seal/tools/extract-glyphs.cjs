// Extracts the outlines of the legend's letters from a font file into ../legend-glyphs.json,
// so that build.cjs and the finished SVG do not depend on the font.
//
// Needs opentype.js, which is not a dependency of this repository. Run it from a scratch directory:
//   npm i opentype.js@1.3.4
//   NODE_PATH=./node_modules node <repo>/brand/seal/tools/extract-glyphs.cjs <path to Cinzel-Bold.ttf>
//
// Cinzel is licensed under the SIL Open Font License 1.1 (https://github.com/NDISCOVER/Cinzel).
const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");

const LETTERS = "CASATSEGRETA";
const file = process.argv[2];
if (!file) throw new Error("usage: extract-glyphs.cjs <font.ttf>");

const font = opentype.loadSync(file);
const glyphs = {};
for (const ch of new Set(LETTERS)) {
  const g = font.charToGlyph(ch);
  // Font units, y pointing up; build.cjs flips the axis when it places the glyph.
  glyphs[ch] = { advance: g.advanceWidth, d: g.getPath(0, 0, font.unitsPerEm).toPathData(2) };
}
const out = {
  font: `${font.names.fontFamily.en} ${font.names.fontSubfamily.en}`,
  licence: "SIL Open Font License 1.1",
  unitsPerEm: font.unitsPerEm,
  // opentype.js draws with y pointing down, so the outlines below are already in SVG orientation.
  yDown: true,
  glyphs,
};
fs.writeFileSync(path.join(__dirname, "..", "legend-glyphs.json"), JSON.stringify(out, null, 2) + "\n");
console.log("wrote legend-glyphs.json:", Object.keys(glyphs).join(" "));
