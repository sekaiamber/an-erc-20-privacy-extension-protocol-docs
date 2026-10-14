English | [中文](0012-visual-identity.zh-cn.md)

# 0012 Visual identity: the secret ledger, and a wax seal as the mark

- Status: Accepted (2026-10-14). The style is accepted; the dApp is to be worked out in detail later
- Date: 2026-10-14
- Scope: Family (appearance only; no behaviour, no concept)

## Context

[ADR-0011](0011-project-name-casata.md) named the project Casata and left the logo undecided. The dApp still wears the default theme of its component library, and the documents have no mark. The owner asked for a style of the project's own, and intends to open the home page with a Renaissance sculpture.

Two constraints come from earlier decisions. The name's long form, Casata Segreta, can be misread as hiding from authorities, while the family does the opposite ([ADR-0004](0004-regulatory-access-principles.md)). And the owner does not want new family-level concepts where none is needed.

## Decision

1. **The style is built on one picture: the family's secret ledger** (*libro segreto*). Paper ground, ink text, one accent colour, wax red. The period is Italy from about 1350 to 1500, Florence as the reference. The values and rules are in [12 Visual style](../12-visual-style.md); that document is normative for appearance.

2. **Wax red marks what is sealed**, that is, a ciphertext amount or a handle, and the Cicerone label. Amended by the owner on 2026-10-14: it also marks a strong call to act, such as connecting the wallet or deploying ([12 §3](../12-visual-style.md#3-colour)). Amended on 2026-10-15: and the name of a room at the head of that room in the dApp. It is used for nothing else.

3. **Two registers.** The page register (everything that is used) is flat. The object register (the seal, a sculpture) is realistic and appears only on the home page, at section openers and in the README header. One exception, set by the owner on 2026-10-14: the rendered seal beside the name in the dApp top bar ([12 §6](../12-visual-style.md#6-the-seal)). Objects share the page's materials, one light from the upper left, a one-line label and one kind of motion.

4. **The mark is the impression of a wax seal.** Arms: a capital letter C and above it a ring, on a horse-head shield. The letter is an open Gothic capital. Legend: `CASATA` and `SEGRETA`, separated by a fleur-de-lis at the top and at the bottom. No crown, no supporters, no motto, no date.

5. **Below 24 px the mark is flat**: a paper shield with a C on a disc of wax red.

6. **The seal is drawn by a script kept in the repository** (`brand/seal/`), so that it can be changed and rebuilt. It is not a hand-made image.

7. **Typefaces**: EB Garamond for headings, Source Sans 3 for interface and body, IBM Plex Mono for addresses and amounts.

8. **The home page is an application of its own, separate from the dApp** (added 2026-10-14). Its sculpture is made for the project, not taken from an existing work, and is never shown whole. The reasons are in [12 §7](../12-visual-style.md).

9. **Not decided here**: the colour of error messages; a GitHub organisation, domains and trademarks (still open from ADR-0011).

## Alternatives

- **Study and collection (studiolo)**: more ornament. The owner chose the ledger.
- **Modern minimal**: says nothing about the name.
- **A flat geometric mark** (an open ring that reads as C, or a cipher disk). Drawn first. The owner chose the seal and asked for it to look like real wax, with arms inside.
- **A Fraktur or Old English letter.** More ornate. Rejected: these hands belong to northern Europe, today they are the lettering of tattoos and gangs, and their C is easily read as E.
- **A closed Lombardic C**, which is the letter of the period. Rejected: today it reads as G.
- **A Latin legend**, `SIGILLVM · CASATAE · SECRETAE`. It follows the formula of real seals. The owner chose the Italian name.
- **A year in the legend.** Rejected with the Latin legend; dates in seal legends are rare in Italy before the sixteenth century.
- **A shield divided per pale**, the letter on one side and bars on the other. Rejected: it reads as the arms of two families joined.

## Consequences

- Positive: the name, the mark and the interface tell the same story, and the story is about keeping records, not about hiding.
- Positive: one colour carries one meaning. A reader learns that red means sealed.
- Negative: errors cannot be plain red. Their colour is open.
- Negative: a seal with arms can be taken as a claim to nobility. The arms carry no crown and no supporters for that reason, and they have not been checked against existing arms.
- Negative: the rendered seal depends on SVG filters and has only been rendered with Chrome.
- Negative: the historical points rest on two reference works and on a second reviewer's advice. Several are unchecked; [12 §10](../12-visual-style.md) lists them.
- Work that follows: the rest of the dApp's pages; the home page as a second application, with a sculpture made for it.
