English | [中文](13-cicerone.zh-cn.md)

# 13 Cicerone, the guide

Status: `Draft` (2026-10-14). Cicerone is named in [ADR-0011](adr/0011-project-name-casata.md) item 5. Its look follows [12 Visual style](12-visual-style.md).

Cicerone is the part of the dApp that takes a visitor from "I want a privacy token" to the page that deploys one. This document says how it decides what to ask. It adds no concept to the family: what it chooses between are the Tracks, Variants and modules of [06](06-family-architecture.md) and [ADR-0008](adr/0008-modules.md).

Cicerone explains and recommends. It holds no keys and no funds, and it deploys nothing by itself: the visitor's wallet sends every transaction.

## 1. The walk

1. **Greeting.** Cicerone says who it is and how the walk goes.
2. **Why the visitor came.** The first pair of cards: publish a new token, or look at a token the visitor already has. The second leads to a field for a token's address; the token's probe (`casata()`, `casataModules()`, [07 §13.3](07-family-conventions.md)) names its Variant and the page of that Variant opens.
3. **Pairs of cards.** Each step shows one question and two cards, one per answer. The visitor takes one.
4. **The hand.** A card that was taken goes, in a short form, to the visitor's hand at the bottom of the page. The hand shows every answer so far, in order. Taking a card from the hand back goes back to that step; the later answers are dropped.
5. **The recommendation.** When one composition is left, Cicerone shows it as the last card: Track, Variant, modules, what is hidden, what it costs, and a link to the page that prepares its deployment.

Every question has exactly two answers. A choice with three outcomes is asked as two questions.

## 2. The tree is derived, not written

Cicerone does not hold a tree of questions. It holds two lists and one rule, and the tree follows from them. When the family grows, the lists grow and the tree changes by itself.

### 2.1 The catalogue

One entry per composition that is **built and can be deployed from the dApp**: a Variant together with a set of its modules. Each entry has:

| Field | Meaning |
| --- | --- |
| Track, Variant | As in the family registry |
| Modules | The modules the composition carries |
| Answers | For each question, the answer this composition stands for. A question the entry does not answer applies to it either way |
| Deployment | The dApp page that prepares the deployment, with the composition selected |

A composition that is only designed, or that the Variant documents call "not built or tested", is not in the catalogue. Cicerone can recommend only what can be deployed.

### 2.2 The questions

An ordered list. Each question has an id, a level and two answers. Each answer settles a Track or a module, and its card shows that Track's or module's icon (§5). The order is by level:

1. **Track**: questions about the state model, such as whether payer and payee are hidden.
2. **Variant**: questions that separate Variants of one Track.
3. **Module**: questions that separate compositions of one Variant.

Within a level the list keeps the order in which the questions were added.

### 2.3 The rule

At each step, with the answers given so far:

1. **Candidates** are the catalogue entries that agree with every answer given.
2. If **one** candidate is left, the walk ends with it.
3. Otherwise Cicerone asks the **first question in the list that splits the candidates**: some candidates stand for one answer and some for the other. A question on which all candidates agree is skipped, since its answer would change nothing.

Two candidates that no question splits would be a fault in the lists. The dApp checks for it when it loads the catalogue and reports it in the console.

### 2.4 What follows from the rule

- A Track with one Variant asks no Variant question.
- A module that a Variant does not support is never asked about once that Variant is the only one left, because no candidate differs on it.
- A question that every composition answers the same way is never asked. It appears by itself once a composition answers it differently.
- The order of questions is the order of levels: Cicerone settles the Track first, then the Variant, then the modules.

## 3. Today's catalogue

Questions:

| Id | Level | Question | Answers |
| --- | --- | --- | --- |
| `parties` | Track | What must stay hidden? | The amount, and every trace of who pays whom / The amount, with payer and payee under a pen name (an account id computed from a key, not from a wallet address, and the same from one payment to the next) |
| `ledger` | Module | Where do wallets and DeFi meet the token? | At its own address (public ledger) / Only through the family Wrapper (confidential ledger only) |

Catalogue:

| Composition | Modules | `parties` | `ledger` | Deployment |
| --- | --- | --- | --- | --- |
| A.1 with the public ledger | Public ledger, role issuance | Pen name | At its own address | `/tracks/a/1/deploy?compose=ledger` |
| A.1 privacy-only | Role issuance, Wrapper port | Pen name | Through the Wrapper | `/tracks/a/1/deploy?compose=private` |
| B.1 | Role issuance, Wrapper port | No trace | Through the Wrapper | `/tracks/b/1/deploy` |

The walk that follows from them:

```
publish ─┬─ no trace of who pays whom ─────────────────────────── B.1
         └─ pen names ─────┬─ at its own address ─────────────── A.1 with the public ledger
                           └─ through the Wrapper ────────────── A.1 privacy-only
```

Role issuance is in every composition, so no question about issuance is asked. A.1 with both the public ledger and the Wrapper port is not built ([A.1 04 §6](tracks/track-a/variant-1/04-modules.md)), so it is not in the catalogue.

## 4. Adding to the family

| What is added | What changes for Cicerone |
| --- | --- |
| A composition of an existing Variant | One catalogue entry. If no existing question separates it from its neighbours, one new question at the module level |
| A Variant | Its compositions as catalogue entries. If it shares a Track with another Variant, one question at the Variant level that separates them |
| A Track | Its compositions, and one question at the Track level if the existing ones do not separate it |
| A module | A question at the module level, and the compositions that carry it |

The catalogue and the questions live in the dApp next to the family registry (`dapp/lib/family/cicerone.ts`). Each question and answer has its text in the dApp's translations. A new Track or module also needs an icon (§5), set in the registry (`dapp/lib/family/registry.ts`).

## 5. How it looks

The cards follow [12](12-visual-style.md): ink on paper, double rules, EB Garamond for titles.

- **Icons.** Every Track and every module has an icon, a vignette in the manner of 12 §5. A Variant has none: on the cards it is written, not drawn. Today: Track A a purse, Track B a mask; the public ledger a pair of scales, role issuance a seal matrix, the Wrapper port a key. The first pair of cards, which is not about the family, has a quill (publish) and a lens (look at a token).
- **A card** is drawn like a Renaissance tarot card (*tarocchi*, the Italian cards of the fifteenth century): tall, with a double border, a Roman numeral for the step, the icon of what the answer settles, the answer as its title, one line of explanation and one line of what the answer costs.
- **The hand** is a fan of small cards at the bottom of the page.
- **Motion.** The two cards of a step turn in; the card taken shrinks into the hand; the other fades out. Cards in the hand move apart when one is pointed at. This is the one place where the page itself moves (12 §2). Where the reader's system asks for reduced motion, cards only fade. The motion is written with anime.js and moves only transforms and opacity.
- **The composed card.** At the end the cards of the hand fly into one large card. The Track is its figure, the modules are what it carries, including those no question asked about, and the Variant and its version are written beneath the figure. Beside the card stand the composition's data and the link to its deployment. The hand is then put away. The way on stands beside the data: the deployment button in wax red, a strong call to act (12 §3), and beside it two outlined buttons, a step back and a fresh start.

## 6. Status

| Item | Status |
| --- | --- |
| The rule and today's catalogue | Implemented in the dApp, 2026-10-14 |
| Checking the lists for unsplittable candidates | Implemented: reported in the browser console |
| Questions beyond `parties` and `ledger` | None yet. Candidates for later: how the token is issued, how the regulator key is held (one key or a committee) |
