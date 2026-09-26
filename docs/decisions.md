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

## 7. `computeRates` takes the evaluation time

*Was listed as open.* The spec's signature is `computeRates(state,
environment, inputs)`; v2 adds a fourth argument, `time`. Wind is defined as a
function of position and time, and RK4 evaluates rates at the start, middle
and end of a step, so the dynamics must see each stage's time. Inputs are
still sampled once per tick, at the start of the step.

## 8. Aerodynamics sees only air data

Step 1 of a pipeline builds `AirData` (atmosphere at the body's altitude,
wind, air-relative velocity, airspeed, α, β, q̄, Mach). An `AeroModel` gets
air data plus inputs, never the raw state. `AeroModel<Inputs>` is generic so
a stability-derivative model can read control deflections and configuration.

Wind vectors are "blowing toward" in NED; `ConstantWind.fromDirection` takes
the weather-report "from" heading.

## 9. The 1976 atmosphere follows the standard, not the sim's gravity

`StandardAtmosphere1976` converts geometric altitude to geopotential altitude
and uses the standard's fixed g₀, rather than taking a `GravityModel` as v1
did. That makes its numbers match the published tables (checked in tests from
−1 km to 80 km). Valid range: −5 km to 86 km.

## 10. The environment defaults to the simplest models

`new Environment()` is constant gravity, constant sea-level air, and no wind.
Richer models are opt-in: `new Environment({ atmosphere: new StandardAtmosphere1976() })`.

## Still open

- Generic rigid-body core vs. aircraft-specific core. The current core is
  generic (a ball uses the same `rigidBodyRates`), which leaves room for
  rockets or quadcopters.
- Exact equation numbers for citations (`TODO(citation)` in the code).
- Richer wind: altitude profile with decay, gusts and turbulence.
- Reynolds-number-dependent drag and the Magnus force for spinning balls.
- Playable real-time runner and visualization layer.
