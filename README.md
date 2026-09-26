# 6DOF Simulator v2

A TypeScript six-degree-of-freedom flight simulation framework, built first as
a teaching tool. It is a rewrite of [WyattCast44/6dof](https://github.com/WyattCast44/6dof).
See [`docs/design-spec.md`](docs/design-spec.md) for the goals and design, and
[`docs/decisions.md`](docs/decisions.md) for choices made while building it.

```ts
const simulator = new Simulator({
  initialState: SimState.rigidBodyOnly(
    new RigidBodyState({ positionNed: new NedVector(new Meters(0), new Meters(0), new Meters(-300)) }),
  ),
  dynamics: new BallDynamics(new Ball(new Kilograms(1), new Meters(0.05))),
  timeStep: new Seconds(0.01),
});

const run = simulator.run({
  duration: new Seconds(60),
  stopWhen: (s) => s.altitude.lessThanOrEqual(new Meters(0)),
});

run.timeWhenReaches((s) => s.altitude, new Meters(0)); // time aloft, in Seconds
```

## Commands

```bash
npm install
npm test                        # vitest, watch mode
npm run check                   # typecheck + all tests once
npm run example:ball-drop       # rung 1
npm run example:ball-with-drag  # rung 2
```

## Layout

| Folder              | What lives there                                                        |
| ------------------- | ----------------------------------------------------------------------- |
| `src/units`         | `Meters`, `Seconds`, `Newtons`... with arithmetic that returns the right unit |
| `src/vectors`       | `NedVector<Q>` and `BodyVector<Q>`: the frame and the unit are in the type |
| `src/attitude`      | `EulerAngles`: body↔NED rotation and the Euler kinematic equations       |
| `src/state`         | `RigidBodyState` (the 12 states), `AuxiliaryState`, `SimState`, and their rates |
| `src/integrators`   | `Euler`, `RK4`                                                          |
| `src/environment`   | `Environment` and its model families: gravity, atmosphere (constant, 1976), wind |
| `src/aero`          | `AirData` (airspeed, α, β, q̄), the `AeroModel` contract, `NoAero`, `SphereDrag` |
| `src/dynamics`      | `DynamicsModel` contract, `rigidBodyRates` (the equations of motion), `InertiaTensor` |
| `src/sim`           | `Simulator`, input sources, `Recorder`, and `Recording` (scenario queries) |
| `src/bodies`        | Concrete bodies and their dynamics (`Ball`, `BallDynamics`)             |
| `examples`          | One runnable scenario per rung of the learning ladder, with a scenario test |

## Learning ladder

| Rung | Scenario                         | Status  |
| ---- | -------------------------------- | ------- |
| 1    | Ball dropped from altitude       | Done    |
| 2    | Ball with drag                   | Done    |
| 3    | Tumbling rigid body              | Next (EOM + RK4 already done and tested) |
| 4    | Glider or aircraft               |         |
| 5    | Powered aircraft with fuel burn  |         |
| 6    | Configuration changes mid-flight |         |
