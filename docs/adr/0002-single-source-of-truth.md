# 0002: One source of truth for numbers, one pure model, the deck asserted by tests

**Status:** accepted

**Context.** The submitted deck quotes specific figures: 17,000 RTOs, ₹20.4L true drag, ₹5.4L–₹11.4L combined. A judge who sees one number on a slide and a different one on screen stops trusting both.

**Decision.**
- Every input number lives in `src/data/assumptions.ts`, tagged with its source: *Case data pack*, *Primary research (n=25, small)* or *Assumption*.
- All arithmetic lives in pure functions in `src/lib/model.ts`. Components only format what the model returns.
- `src/lib/model.test.ts` asserts the deck's exact figures. `tests/unit/readme.test.ts` asserts the README's figures. An e2e test asserts that the numbers on screen in production equal the model's output.
- If a test fails, we fix the model, never the test.

**Consequences.**
- One edit to an assumption moves the UI, the link-preview description and the README check together.
- Copy has to be generated from the model, so prose is slightly more work to write.
- A wrong assumption is still wrong everywhere at once. The source tags make that visible rather than hidden.
