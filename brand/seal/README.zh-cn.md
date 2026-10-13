[English](README.md) | 中文

# Casata 的印

项目的标志是一枚火漆印的印痕。这个目录放画它的脚本和脚本生成的文件。印上画的是什么、可以用在哪里，见 [docs/12-visual-style.zh-cn.md](../../docs/12-visual-style.zh-cn.md)。

## 文件

| 文件 | 说明 |
| --- | --- |
| `build.cjs` | 画出这枚印，写出 `casata-seal.svg`。没有依赖 |
| `casata-seal.svg` | 单个自包含的 SVG。浮雕由 SVG 滤镜生成，所以要由浏览器渲染 |
| `png/casata-seal-<尺寸>.png` | 透明底的渲染图：1600、512、256、128、64 像素 |
| `casata-seal-flat.svg` | 扁平版，用于 24 像素及以下：封蜡红圆底上一面纸色的盾，盾里一个 C |
| `legend-glyphs.json` | 铭文字母的轮廓，取自 Cinzel Bold |
| `tools/extract-glyphs.cjs` | 从字体文件重新生成 `legend-glyphs.json`。需要 `opentype.js`，用法见文件开头的注释 |
| `render.sh` | 先运行 `build.cjs`，再用 headless Chrome 和 `sips`（macOS）渲染 PNG |

## 重新生成

```sh
brand/seal/render.sh
```

印的每个尺寸都是 `build.cjs` 开头的常量：蜡的外缘、各圈边线的半径、铭文、盾、字母、光源。改一个常量，运行脚本，看结果。

## 尺寸

48 像素及以上用渲染图。32 像素以下它只是一个红点，所以 24 像素及以下用 `casata-seal-flat.svg`。

## 许可

铭文用的字体是 Cinzel Bold（The Cinzel Project Authors），许可为 SIL Open Font License 1.1。它的字母以轮廓的形式存在 `legend-glyphs.json` 和 SVG 里。印上其余的部分都是为本项目画的。

## 还没做的

- 没有核对过这套纹章是否与现存纹章相近。
- 只用 Chrome 渲染过。其它浏览器对浮雕的打光可能略有不同。
