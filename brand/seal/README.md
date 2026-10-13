English | [中文](README.zh-cn.md)

# The Casata seal

The project's mark is the impression of a wax seal. This directory holds the script that draws it and the files it produces. What the seal shows and where it may be used is in [docs/12-visual-style.md](../../docs/12-visual-style.md).

## Files

| File | What it is |
| --- | --- |
| `build.cjs` | Draws the seal and writes `casata-seal.svg`. No dependencies |
| `casata-seal.svg` | The seal as one self-contained SVG. The relief is made by SVG filters, so a browser has to render it |
| `png/casata-seal-<size>.png` | Renderings with a transparent ground: 1600, 512, 256, 128 and 64 px |
| `casata-seal-flat.svg` | The flat form, for 24 px and below: a paper shield with a C on a disc of wax red |
| `legend-glyphs.json` | Outlines of the legend's letters, taken from Cinzel Bold |
| `tools/extract-glyphs.cjs` | Regenerates `legend-glyphs.json` from the font file. Needs `opentype.js`; see the comment at its top |
| `render.sh` | Runs `build.cjs`, then renders the PNG files with headless Chrome and `sips` (macOS) |

## Rebuilding

```sh
brand/seal/render.sh
```

Every measure of the seal is a constant at the top of `build.cjs`: the outline of the wax, the radii of the borders, the legend, the shield, the letter, the light. Change a constant, run the script, look at the result.

## Sizes

Use the rendered seal at 48 px and above. Below 32 px it is a red spot, so 24 px and below use `casata-seal-flat.svg`.

## Licences

The legend is set in Cinzel Bold (The Cinzel Project Authors), licensed under the SIL Open Font License 1.1. Its letters are in `legend-glyphs.json` and in the SVG as outlines. Everything else in the seal was drawn for this project.

## Not done

- The arms have not been checked against existing arms.
- The seal has only been rendered with Chrome. Other browsers may light the relief a little differently.
