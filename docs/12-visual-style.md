English | [中文](12-visual-style.zh-cn.md)

# 12 Visual style

Status: `Draft` (2026-10-14). Decision record: [ADR-0012](adr/0012-visual-identity.md). The seal and the script that draws it: [`brand/seal/`](../brand/seal/README.md). The style is accepted; the dApp is to be worked out in detail later, see §9.

This document says what Casata looks like and why. It covers the interface, the documents and the project's mark. It adds no concept to the family: Track, Variant and module are untouched.

## 1. The idea

The style is built on one picture: **the family's secret ledger** (*libro segreto*). A merchant house of late-medieval and Renaissance Italy kept, beside its ordinary books, a ledger that was not shown to outsiders: the partners' capital, their shares, the real profit. A token of the family does the same job. Balances and amounts are recorded, kept private, and opened to those who hold the right key. The regulator is one of them by design ([ADR-0004](adr/0004-regulatory-access-principles.md)).

The period is Italy from about 1350 to 1500, with Florence as the reference.

The style is not: mafia imagery, gold gradients, neon or "crypto" glow, paper textures made to look old, coats of arms with crowns or beasts. "Segreta" must never read as hiding from the authorities. Wherever the name stands alone, the text beside it says that regulator access is built in ([ADR-0011](adr/0011-project-name-casata.md)).

## 2. Two registers

Everything visual belongs to one of two registers. They are kept apart.

| Register | What it holds | How it looks | Where it appears |
| --- | --- | --- | --- |
| **Page** | Every screen that is used: token pages, deploy pages, forms, tables, documents | Flat. Type, rules and one accent colour. No shadows, no gradients, no light | Everywhere |
| **Object** | The seal; a sculpture on the home page | Realistic, with light and shadow. Few and large | Home page, section openers, the README header |

Four things hold the two registers together.

1. **Materials.** Paper, ink and wax, and for objects also stone. A sculpture keeps the colour of its stone, toned toward the paper. Wax red stays the only saturated colour on a page.
2. **One light.** Every object is lit softly from the upper left. The seal is rendered that way (`brand/seal/build.cjs`, azimuth 225). A photograph or a 3D model of a sculpture is chosen or lit to match.
3. **A label.** Every object carries one line in the monospace face: title, artist, date, collection, licence. It is a museum label, and it is where credit and licence are given.
4. **Motion.** Only an object may move, and only by turning as the page scrolls. The page does not move: no parallax, no bounce. Where the reader's system asks for reduced motion, the object is a still image. One exception, set by the owner on 2026-10-14: the cards of Cicerone's walk turn in, move to the hand and fade ([13 §5](13-cicerone.md#5-how-it-looks)); with reduced motion they only fade. A second, set by the owner on 2026-10-15: the greeting at the head of each room of the dApp (§9) rises in once when the page opens; with reduced motion it only fades in. A box the reader can choose (below, §5) lifts its inner frame a little under the pointer or the keyboard focus; with reduced motion it does not move.

An object never enters the page register. In the interface the seal appears only in its flat form (§6), with one exception: the brand in the dApp top bar.

## 3. Colour

### Day

| Name | Value | Use |
| --- | --- | --- |
| Paper | `#F3EEE3` | The ground of every page |
| Leaf | `#FBF8F1` | Cards and panels: a leaf laid on the page |
| Rule | `#D5CBB8` | Lines between entries, borders |
| Ink | `#211F26` | Text, primary buttons, double rules |
| Faded ink | `#655E52` | Secondary text, labels |
| Wax | `#9E2B25` | The accent. See the rule below |

### Night

| Name | Value | Use |
| --- | --- | --- |
| Walnut | `#1D1814` | Ground |
| Board | `#272019` | Cards and panels |
| Rule | `#3F352B` | Lines, borders |
| Paper | `#EBE3D2` | Text, primary buttons |
| Faded | `#A89C88` | Secondary text |
| Wax | `#DC6052` | The accent |

Night is the same page in a study by lamplight. Each day colour has one night colour; nothing else changes.

### States

| Name | Value | Use |
| --- | --- | --- |
| Verdigris | `#2F6B5A` | Confirmed on chain |
| Ochre | `#8A5A0B` | Needs attention |

### The rule for wax red

Wax red is the one accent colour. It has three uses:

1. **What is sealed**: an amount stored as ciphertext, or a handle that stands for one ([07 §4](07-family-conventions.md)).
2. **The Cicerone label** (§5), and the name of a room at the head of that room in the dApp (§9; owner, 2026-10-15).
3. **A strong call to act**: where the project asks the reader firmly to do something (owner, 2026-10-14). In the dApp today: connecting the wallet in the top bar, the deploy buttons of the A.1 and B.1 deploy pages and of the committee page, the way to publish a token at the head of each Variant page and from a shipped composition in the module simulator (owner, 2026-10-15), and in Cicerone's walk the first step and the way from the recommendation to the deployment ([13 §5](13-cicerone.md#5-how-it-looks)).

It is used for nothing else. Other primary buttons are ink. In the dApp the button for the third use is the `wax` variant.

Text and ground pairs in the tables above have a contrast of at least 4.5:1. The figures were computed by hand from the colour values, not measured on a screen.

## 4. Type

| Role | Face | Notes |
| --- | --- | --- |
| Headings | EB Garamond, weight 500 | Chinese headings: Noto Serif SC, or the system Songti |
| Interface and body | Source Sans 3 | Chinese: the system sans-serif |
| Addresses, amounts, versions, selectors | IBM Plex Mono | Amounts are right-aligned in tables |
| The seal's legend only | Cinzel Bold | Stored as outlines; not an interface face |

All four are published under the SIL Open Font License. This was checked for Cinzel; for the other three it is from memory and has to be confirmed before a release.

Corners are 2 to 3 px. Controls are at least 44 px high.

## 5. Motifs

- **Rules.** A single rule separates entries. A double rule closes a heading or a total. Nothing else is boxed or shaded for emphasis.
- **The sealed mark.** A small disc of wax red beside a value says that the value is stored sealed. It is the flat form of the seal (§6).
- **The margin.** Explanations do not go inside a card. They stand in the margin beside the entry they explain, in italic serif, under the label *Cicerone* in wax red. Cicerone is the name of the guide ([ADR-0011](adr/0011-project-name-casata.md)); the margin is its voice. On a narrow screen the note follows the entry.
- **Vignettes.** Rooms of the house get a small engraving: an arched niche with one object on its ledge, drawn in ink with hatching, the light from the upper left. They belong to the page register: line and hatching only, in the text colour, so they work by day and by night. The four doors of the dApp entry page are the first set: a lantern (Cicerone, the guide), a bust (the collection of Tracks), books (the library) and dividers before a cipher disk (the workshop of tools). Every Track and every module has its own as well ([13 §5](13-cicerone.md#5-how-it-looks)); they stand on the cards of Cicerone's walk, on the exhibits of the collection and at the head of the Track pages. Generator: [`brand/vignettes/build.cjs`](../brand/vignettes/build.cjs).
- **Framed cards.** A box the reader can choose is drawn like a card of Cicerone's walk: a double frame, a heavy outer line and a thin inner one, both in the text colour, with a double rule under its picture. Under the pointer or the keyboard focus the inner frame rises a little (owner, 2026-10-15). In the dApp: the four doors of the entry page, the Tracks of the collection, the Variants on a Track page, the reference tokens and the module cards of the simulator on a Variant page, the module cards of the deploy pages, and the cards of Cicerone's walk, all through one component (`framed-card`). Panels that only hold content keep the plain card.

## 6. The seal

The project's mark is the impression of a wax seal.

| Part | What it is |
| --- | --- |
| Arms | A capital letter C, and above it a ring. Tinctures are not specified: a seal has one colour |
| Shield | Horse-head shield (*scudo a testa di cavallo*), the shape used in fifteenth-century Florence |
| Letter | An open Gothic capital, drawn for the project. Seal legends in Italy kept Gothic capitals until the later Renaissance |
| Ring | The project's own charge. It comes from the two rings of Alberti's cipher disk |
| Legend | `CASATA` on the right, `SEGRETA` on the left, read clockwise from the top, in Roman capitals. A fleur-de-lis stands between the two words at the top and at the bottom |
| Border | A line, a row of beads, a line |

Left out on purpose: crown, supporters, motto, a date. A crown claims a rank; a date in a seal legend is rare before the sixteenth century in Italy.

The fleur-de-lis is used as an ornament between words, which is common. It is the plain form, not the lily of Florence with stamens, and it is not placed on the shield. The lily is the emblem of the city of Florence and of the French crown; the Medici bore balls.

### Sizes

| Size | Form |
| --- | --- |
| 48 px and above | The rendered seal, `brand/seal/png/` or `casata-seal.svg` |
| 24 px and below | The flat form, `brand/seal/casata-seal-flat.svg`: a paper shield with a C on a disc of wax red |

Between the two, prefer the flat form. Below 32 px the rendered seal is a red spot.

The rendered seal is an object (§2). It is not used inside the interface, with one exception: in the dApp top bar the rendered seal stands at 40 px beside the full name, Casata Segreta, even though its arms cannot be read at that size (owner, 2026-10-14). The sealed mark beside values and the footer keep the flat form.

## 7. The home page

The home page is an application of its own, separate from the dApp (owner, 2026-10-14). The dApp derives keys and connects wallets; the home page loads 3D code and may later carry other scripts. Kept on separate origins, nothing on the home page can reach the dApp's pages or storage. The home page can also be a static site, and each can be released without the other. The two share this document: colour, type and the seal.

The home page opens with a sculpture, as a 3D model. It is not a copy of an existing work. It is never shown whole: the view moves over it as the page scrolls, and the text arrives with the movement. It follows the four rules of §2. It is not built, and no model exists.

The dApp has its own entry page. That page carries the rendered seal, the name and the line that says regulator access is built in.

## 8. Voice

Text is plain and exact. Italian is used for proper names only: Casata, Casata Segreta, Cicerone. Track, Variant and module keep their English names. Interface text follows the same rules as the documents.

In the dApp a version of a Variant is named by its identifier, which is the family descriptor as `casata()` returns it (07 §10): `A:1:0.6.0`, `B:1:0.2.0` (owner, 2026-10-15). Readers then meet one name in the interface, in the documents and on chain. It stands under the room's name on each Variant page.

## 9. Status and open points

| Item | State |
| --- | --- |
| Colour, type, the seal | Decided by the owner, 2026-10-13 and 2026-10-14 |
| dApp | In progress. Done: colour tokens for day and night with a switch, typefaces, corner radius, the mark and the name on the entry page, in the top bar, in the footer and as the browser icon. The top bar carries the rendered seal, the full name, a Testnet badge, an About page, icon buttons for day / night and for the language menu, and a wallet menu that holds the network and marks a wrong network. The entry page receives the visitor as a guest and offers four doors with vignettes (§5): Cicerone, Tracks, Learn (the About page) and Tools; the environment is printed to the browser console instead of shown. Each of the four rooms (Cicerone, the collection, the library, the workshop) opens with the same greeting: its vignette, the room's name in wax red, a greeting in italics and what the room holds. The collection (`/tracks`) shows each Track as an exhibit with its vignette, what it hides, its Variants and the modules each one takes; a module's details show on hover or tap. A Track page opens with the same greeting, then gives the reasons for the Track as numbered paragraphs, its strengths and weaknesses as the two sides of an account, and its Variants on display as framed cards with their ledger rows and modules. A Variant page opens with the same greeting, with its version after the room's name, its identifier (§8) under it, and two buttons: the design document and the way to publish a token. Then come the tokens to browse (each reference token a small framed card with the pictures of its Variant and its modules, its details on hover, beside the address check), a module simulator, and for A.1 the design on one page. In the simulator the reader picks module cards and composes them; every subset of the Variant's modules can be picked, and the page says whether it is built, allowed but not built, or no token, and why. The verdicts follow from rules the Variant states as data (`lib/family/compositions.ts`), so a new module needs new rules, not a new page. From A.1 0.7.0 and B.1 0.3.0 every subset is built (ADR-0013), and B.1 has the simulator too. The deploy pages start from the same module cards: the reader picks a subset, sees what the composition is like, and fills in the initial supply, the minter and the Wrapper port's module. The collection, the Track pages, the Variant pages and the workshop have no side navigation; the token pages, the deploy pages and the tools do. Ledger rows, the sealed mark, margin notes and line tabs are on the three token pages (A.1 with the public ledger, A.1 privacy-only, B.1); line tabs also on the deploy pages and the regulator view. The entry page carries Cicerone. Not checked with a wallet connected |
| Errors | Not decided. An error is usually red, which collides with the rule for wax red. Proposed: ochre with a text label |
| Home page | A separate application; not started. The sculpture is to be made for the project, not taken from an existing work |
| Arms | Not checked against existing arms |
| Night mode | Colours are defined; the dApp has a switch in the top bar |

## 10. Sources

- Seal legends, their script, their opening sign and their dates: *Enciclopedia Italiana*, "Sigillo" (see [references](references.md)). The statements in §6 about Gothic capitals in Italy and about dates come from it.
- "Casata" as a word: Du Cange, *Glossarium mediae et infimae latinitatis*, "Casata" (see [references](references.md)).
- The secret books of the Medici bank, and Alberti's cipher disk of about 1467, were looked up only briefly, in secondary sources. Check them before quoting them outside the project.
- What §6 says about the fleur-de-lis, the lily of Florence and the Medici arms is stated from memory and has not been checked against a source.
- The dating of the horse-head shield to Florence in the 1440s to 1460s was suggested by a second reviewer and has not been checked against a source.
