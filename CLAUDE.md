# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Commands

```bash
npm run check                       # tsc --noEmit + vitest run (run before every commit)
npx vitest run src/attitude         # one folder
npm run example:ball-drop           # run an example with tsx (see package.json for all)
```

## Design

The spec is `docs/design-spec.md`; decisions made along the way are logged in
`docs/decisions.md`. Add an entry there when you settle an open question.

- Only `Simulator` mutates. State, units and vectors are immutable; dynamics
  models are pure; integrators are generic math over `Integrable`/`Combinable`.
- Every physical value is a unit type from `src/units`. Do not unwrap `.value`
  to do arithmetic in equations; use `add`, `times`, `divide`, `cross`, etc.
  If a unit combination is missing, add one line to `src/units/UnitAlgebra.ts`.
- Import units from `src/units` (the index), never from individual unit files:
  the index loads the unit algebra.
- Vectors carry their frame in the type (`NedVector<Q>`, `BodyVector<Q>`) and
  their frame in the name (`positionNed`, `velocityBody`). Convert frames only
  via `attitude.bodyToNed` / `attitude.nedToBody`.
- Equations of motion cite a source in a comment. `TODO(citation)` marks places
  where the exact equation number still needs to be checked against the book.
- Tests are co-located (`*.test.ts`). Code tests check the framework against
  physics; scenario tests in `examples/` ask questions of a run via `Recording`.
- Strict TypeScript; `npm run check` must pass.
