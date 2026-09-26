# Decisions

Choices made while building v2, including provisional answers to the spec's
open questions. Each can be revisited; update this file when one changes.

## 1. Unit algebra: curated table, checked at compile time

*Open question: full dimensional analysis vs. a curated set of operations.*

Curated. `src/units/UnitAlgebra.ts` lists every allowed product and quotient
(e.g. `"N / kg" → MetersPerSecondSquared`) in one place. The same table drives
the TypeScript types, so `force.divide(mass)` hovers as
`MetersPerSecondSquared`, and an unlisted combination is both a type error
(when used where a real unit is expected) and a runtime error naming the
missing rule. Radians are treated as dimensionless.

Adding a combination is one line, which keeps the list readable for learners.

## 2. Vectors are generic over frame and unit

`NedVector<Meters>`, `BodyVector<MetersPerSecond>`. The frame is a distinct
class, so mixing frames is a compile error; the unit parameter lets vector
math reuse the unit algebra, so the translational equation reads
`forceBody.divide(mass).subtract(ω.cross(velocityBody))` and type-checks.

## 3. The integrable contract is typed, not flat arrays

*Spec: "flatten to numbers, rebuild from numbers, add, and scale."*

Instead of flattening, each state has a matching rates class:
`state.advance(rates, dt)` computes x + ẋ·dt, and rates support `add` and
`scale` (all RK4 needs). This keeps units intact through integration
(velocity × seconds = meters) and never hard-codes a state count. Flat-array
export can be added later for plotting or serialization if needed.

## 4. Attitude: Euler angles first

*Open question: Euler only, or quaternions as a later rung.*

Euler angles (3-2-1) only for now, with the θ = ±90° singularity documented on
`EulerAngles.ratesFrom`. Quaternions remain a candidate later rung.

## 5. Inputs are optional only when a body has none

`SimulatorOptions` makes `inputs` optional only when the dynamics model takes
`NoInputs`. Anything with controls must be given an input source.

## 6. Recorder keeps every step

No sampling or memory limit yet (open question). Scenario query names so far:
`timeWhen`, `timeWhenReaches`, `max`, `min`, `valueAt`, `steadyValue`.

## Still open

- Generic rigid-body core vs. aircraft-specific core. The current core is
  generic (a ball uses the same `rigidBodyRates`), which leaves room for
  rockets or quadcopters.
- Exact equation numbers for citations (`TODO(citation)` in the code).
- Wind models, time-varying environment, and whether `computeRates` needs `t`.
- Playable real-time runner and visualization layer.
