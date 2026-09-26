# 6DOF Simulator v2 — Design Spec

Sep 25, 2026 · @Wyatt

## Overview and goals

v2 is a rewrite of [WyattCast44/6dof](https://github.com/WyattCast44/6dof): a TypeScript 6DOF simulation framework built first as a teaching tool. It keeps v1's class-based API and rich unit library, fixes the physics, and gives each component one clear job.

**Primary objective:** explicit, clear APIs that someone learning 6DOF simulation can read and follow, even without deep TypeScript knowledge.

**Goals**

- A student can drop a ball from altitude in a few lines, then climb step by step to a fuel-burning aircraft on the same core.
- Hovering over any value in an editor tells you what it is and its units.
- The equations of motion in code read like the textbook versions, with a citation beside each.
- The same core supports batch (fixed-duration) runs today and a playable real-time sim later.
- Scenario-level test utilities let users ask questions like "how long was it airborne?"

**Non-goals (for now):** high-performance or real-time-guaranteed simulation, multi-body systems, and a full flight-model database.

## Design principles

1. **Classes and types teach.** Keep a class hierarchy and a rich unit library. A learner should be able to click through definitions and hover over values to follow the logic.
2. **Math lives on the types.** Units and vectors carry real arithmetic (add, scale, cross, dot, frame transforms). Equations should never unwrap `.value` just to do basic math.
3. **Code mirrors the textbook.** Each equation of motion is one readable expression with a comment citing its source and equation number.
4. **One job per component.** Only the Simulator holds mutable state and time. Everything else is data or a pure question.
5. **Contracts where fidelity varies.** Use an interface plus a family of implementations when there are at least two real fidelity levels a student would swap between (the v1 gravity model is the template). Otherwise keep it concrete.
6. **Contracts describe the physics question, not one model's internals.** Gravity answers "given a position, what is the gravity vector?" That works for both constant and WGS84 models.
7. **Progressive disclosure.** Simple scenarios need little setup. Complexity is opt-in, never required up front.
8. **Frames are explicit.** Every vector's type and name says which frame it lives in.

## Core architecture

The core has five components, each with one responsibility. v1's overlap between `Aircraft`, `AircraftSimulator` and `FlightDynamics` goes away.

| Component | Responsibility | Holds | Does not |
| --- | --- | --- | --- |
| **State** | Snapshot of the system at one instant, plus arithmetic on itself | Immutable values | Know about time, aircraft, or physics |
| **DynamicsModel** | Answers: given state, environment and inputs, what are the rates of change? | Nothing mutable | Store state, time, or history |
| **Integrator** | Steps a state forward by dt using a rates function (Euler, RK4, ...) | Nothing | Know it is simulating an aircraft |
| **Simulator** | Owns the current state and clock; each tick calls dynamics, then the integrator | Current state, time, configuration | Compute physics itself |
| **Recorder** | Stores the state history for playback, plots and queries | History | Drive the simulation |

**The one rule:** only the Simulator mutates. State is data. DynamicsModel is a pure function wearing a class. Integrator is generic math.

Each tick:

1. Simulator gathers inputs (controls + configuration) for time t.
2. Integrator calls `dynamics.computeRates(state, environment, inputs)` as many times as its method needs (4 for RK4).
3. Integrator returns the new State.
4. Simulator stores it, advances time, and hands the new state to the Recorder.

## State model

State splits into two kinds: **continuous** (integrated over time) and **discrete** (changes instantly on command).

**Continuous state lives in `SimState`, which holds two named groups:**

- **RigidBodyState**: the classic 12 variables, kept pristine so learners see exactly the textbook set.
  - Position in NED (north, east, down)
  - Velocity in body frame (u, v, w)
  - Attitude as Euler angles (φ, θ, ψ)
  - Body angular rates (p, q, r)
- **AuxiliaryState**: scenario- or aircraft-specific continuous quantities, such as fuel mass. The schema is fixed and explicit per aircraft. A ball or glider has an empty auxiliary state.

Both groups implement the same **integrable contract**: flatten to numbers, rebuild from numbers, add, and scale. The integrator marches the whole `SimState` without knowing which group is which, and never hard-codes the count 12.

**Discrete state (configuration)** covers things like gear up/down, flap setting, and engine on/off. It is not integrated. It lives beside the state in the Simulator and reaches the dynamics model as an input, alongside control deflections. Lowering the gear flips a flag. The aero model reads it on the next tick and drag rises.

**Derived quantities** such as mass, CG and inertia are computed fresh each tick. For example, `aircraft.massAt(state)` returns dry mass plus fuel mass. The Aircraft provides the function. The evolving fuel number lives in the state.

> Aircraft answers questions; state remembers.

## Units and vector library

The rich unit library stays: `Meters`, `Feet`, `Knots`, `MetersPerSecond`, `Kilograms`, `Radians`, and so on. Hovering over a value shows its unit. v2 fixes v1's pain point: unit classes were passive containers, so the math leaked out into raw numbers.

**Requirements**

- Unit types support arithmetic that returns the correct type. For example, length ÷ time gives a velocity, and mass × acceleration gives a force.
- One canonical SI unit per quantity inside the core. Other units (feet, knots, nautical miles) are converted at the edges, when setting up scenarios or displaying results.
- `Vector3` is the base class for 3-component math: add, subtract, scale, dot, cross, magnitude.
- Frame-specific vectors extend it: `BodyVector`, `NedVector`. Transforms between frames are explicit methods, such as `attitude.bodyToNed(v)`, and the types prevent mixing frames by accident.
- `RigidBodyState` builds on these vector types rather than raw arrays.

The goal is for the core force equation to read close to the textbook form:

```latex
\dot{\mathbf{v}}_b = \frac{\mathbf{F}_b}{m} - \boldsymbol{\omega}_b \times \mathbf{v}_b
```

```ts
const acceleration = totalForce.divide(mass).subtract(bodyRates.cross(velocityBody));
```

## Pluggable model families

Where fidelity varies, a component is a contract with a family of implementations. The v1 `GravityModel` is the template. The `Environment` bundles the environment families together, and its composition from v1 was clean and stays.

| Contract | Physics question it answers | Simple | Richer |
| --- | --- | --- | --- |
| GravityModel | Given a position, what is the gravity vector? | ConstantGravity | WGS84Gravity |
| AtmosphereModel | Given an altitude, what are density, pressure and temperature? | ConstantAtmosphere | StandardAtmosphere1976 |
| WindModel | Given a position and time, what is the wind vector? | NoWind, ConstantWind | Altitude-profile wind with decay |
| Integrator | Given a state, rates function and dt, what is the next state? | Euler | RK4 |
| AeroModel | Given air data and inputs, what are aero forces and moments? | Drag-only (ball) | Stability-derivative model |
| PropulsionModel | Given air data and throttle, what are thrust, moments and fuel flow? | None | Fixed thrust, then table-based engine |

The list of which components become contracts versus stay concrete is not final. See Open questions.

## Aircraft and dynamics

**Aircraft** is a set of properties plus functions. It never stores evolving state.

- Properties: dry mass, geometry (wing area, span, chord), inertia, aero coefficients, fuel capacity.
- Functions: `massAt(state)`, `inertiaAt(state)`, `fuelFlow(airData, throttle)`, and the aero and propulsion models it uses.
- Declares its AuxiliaryState schema (for example, fuel mass).

**DynamicsModel.computeRates** follows one visible pipeline, top to bottom:

1. Air data: airspeed, angle of attack (α), sideslip (β), dynamic pressure. Uses the atmosphere and wind.
2. Aerodynamic forces and moments (reads configuration, such as gear drag).
3. Propulsion forces, moments and fuel flow.
4. Gravity resolved into the body frame.
5. Sum forces and moments.
6. Equations of motion:
   - Position rate: body velocity rotated to NED
   - Velocity rate: F/m − ω × v
   - Attitude rate: Euler kinematic equations
   - Body rate: I⁻¹(M − ω × Iω)
   - Auxiliary rates: for example, fuel rate = −fuel flow

Simpler bodies use shorter pipelines. A falling ball needs only gravity and optional drag.

## Simulation runners

Runners differ only in their clock and their input source. The physics is identical.

| Runner | Clock | Inputs | Status |
| --- | --- | --- | --- |
| Fixed-duration | Loops as fast as possible for a set duration and dt | Scripted, or a function of time and state | v2 initial scope |
| Playable (real-time) | Driven by browser animation frames, with a fixed physics step | Live keyboard or controller, sampled each tick | Future |

**Input channel.** Each tick, the Simulator asks an input source for the current `Inputs` (control deflections, throttle, configuration). Scripts, autopilots and human players all implement the same input-source contract. Real-time assumptions must never leak into the dynamics, state or integrator.

**Playable sim sketch:** open in the browser, press play (e.g. spacebar), then fly with the keyboard or a controller. A ball scenario has no inputs but can still play out in real time.

## Recorder and scenario testing

The Recorder is shared ground for both runners. The playable sim streams from it live. Scenario tests query it after a run.

**Two kinds of testing**

- **Code tests** check that the framework is correct. Examples: RK4 accuracy, DCM orthogonality, free fall matching ½gt², energy conserved with no aero, a level 60° bank producing 2 g.
- **Scenario tests** let users ask questions of their own run, in plain terms.

**Scenario query vocabulary (initial)**

- **When does a condition first become true?** Example: time aloft = the time altitude reaches 0.
- **Peak or minimum of a value:** max altitude, max g, min airspeed.
- **Steady value:** when a quantity stops changing. Example: terminal velocity = velocity once acceleration is near zero.
- **Value at a time:** state or any derived quantity at t.

Example intent:

```ts
const run = simulator.run();
run.timeWhen(s => s.altitude.lessThanOrEqual(new Meters(0)));
run.steadyValue(s => s.airspeed);
```

Exact API names are to be decided.

## Progressive learning ladder

Each rung adds one new idea to the one before it. The core (State, Integrator, Simulator, Recorder) never changes. Each rung is a standalone, fully readable example scenario built on the shared core and on swappable model families. This is the hybrid approach.

| Rung | Scenario | New concept | Typical models |
| --- | --- | --- | --- |
| 1 | Ball or brick dropped from altitude | State, integration, gravity | Constant gravity, Euler |
| 2 | Ball with drag | Atmosphere, terminal velocity | Constant or 1976 atmosphere |
| 3 | Tumbling rigid body | Full 12-state, rotation, frames | RK4 |
| 4 | Glider or aircraft | Aerodynamics, controls, trim | Stability-derivative aero, wind |
| 5 | Powered aircraft with fuel burn | AuxiliaryState, changing mass | Propulsion, fuel flow |
| 6 | Configuration changes mid-flight | Discrete state (gear, flaps) | Configuration inputs |

Example starting scenario: 30,000 ft, heading 360°, 5,000 lb fuel. The aircraft's fuel-flow function drives the burn, and the user watches mass change over time.

## Physics corrections from v1

These came out of reviewing v1. v2 must get them right and cover each with a code test.

- **DCM direction.** v1's `BodyNedDCM` matrix is actually the NED→body matrix (first row \[cθcψ, cθsψ, −sθ\]), but it is used as body→NED. The −ψ negation looks like a patch, not a real convention difference. Test: gravity in the body frame should give gx = −g·sinθ.
- **Euler kinematics.** v1 sets the attitude rates equal to p, q, r. v2 must use the kinematic equations, such as φ̇ = p + (q·sinφ + r·cosφ)·tanθ. Document the gimbal-lock singularity at θ = ±90°, and consider quaternions as a later rung.
- **Rotational dynamics.** Moments were zero in v1. v2 implements I·ω̇ = M − ω × Iω.
- **Integrator.** RK4 was a stub in v1 and must be implemented.
- **Consistency.** v1 mixed `_currentState` and `_state`, and read a config field that did not exist. The v2 build must type-check under strict mode.

## Open questions and future work

- [ ] Scope: aircraft-specific core, or a generic rigid-body core with aircraft as one plug-in, so rockets or quadcopters can come later?
- [ ] Final map of which components are contracts versus concrete classes.
- [ ] How much unit-type arithmetic to support (full dimensional analysis versus a curated set of operations).
- [ ] Attitude representation: Euler only at first, or quaternions as an optional later rung.
- [ ] Scenario query API names and shape.
- [ ] Recorder memory limits and sampling for long runs.
- [ ] Playable sim: fixed-step physics decoupled from render rate, and the input-device abstraction.
- [ ] Visualization layer (React UI carried over from v1?) and how it reads from the Recorder.
