import { describe, expect, it } from "vitest";
import { EulerAngles } from "../attitude";
import { Ball, BallDynamics } from "../bodies";
import { ConstantGravity, Environment } from "../environment";
import { Euler, RK4, type Integrator } from "../integrators";
import { Simulator, type NoInputs } from "../sim";
import {
  RigidBodyState,
  SimRates,
  SimState,
  type NoAuxiliaryRates,
  type NoAuxiliaryState,
} from "../state";
import {
  Degrees,
  KilogramMetersSquared,
  Kilograms,
  Meters,
  MetersPerSecond,
  NewtonMeters,
  Newtons,
  RadiansPerSecond,
  Seconds,
} from "../units";
import { BodyVector, NedVector } from "../vectors";
import type { DynamicsModel } from "./DynamicsModel";
import { InertiaTensor } from "./InertiaTensor";
import { rigidBodyRates } from "./RigidBodyEquations";

const g = ConstantGravity.STANDARD.value;
const ball = new Ball({ mass: new Kilograms(2), radius: new Meters(0.1) });

function dropSimulator(integrator: Integrator, state: RigidBodyState, dt = 0.01) {
  return new Simulator({
    initialState: SimState.rigidBodyOnly(state),
    dynamics: new BallDynamics(ball),
    timeStep: new Seconds(dt),
    integrator,
  });
}

describe("free fall", () => {
  it.each([new Euler(), new RK4()])("$name: falls ½·g·t² (RK4 exactly)", (integrator) => {
    const sim = dropSimulator(integrator, new RigidBodyState());
    const run = sim.run({ duration: new Seconds(5) });
    const fallen = run.final.state.rigidBody.positionNed.down.value;
    const exact = 0.5 * g * 5 * 5;
    const tolerance = integrator.name === "RK4" ? 1e-9 : 0.5; // Euler lags by ½·g·t·dt
    expect(Math.abs(fallen - exact)).toBeLessThan(tolerance);
  });

  it("falls straight down whatever the attitude, even though velocity is in body axes", () => {
    const tilted = new RigidBodyState({
      attitude: new EulerAngles(
        new Degrees(30).toRadians(),
        new Degrees(-50).toRadians(),
        new Degrees(120).toRadians(),
      ),
    });
    const final = dropSimulator(new RK4(), tilted).run({ duration: new Seconds(3) }).final.state;
    const p = final.rigidBody.positionNed;
    expect(p.north.value).toBeCloseTo(0, 9);
    expect(p.east.value).toBeCloseTo(0, 9);
    expect(p.down.value).toBeCloseTo(0.5 * g * 9, 9);
  });
});

describe("energy", () => {
  it("is conserved for a thrown, spinning ball with no aero (RK4)", () => {
    const thrown = new RigidBodyState({
      positionNed: new NedVector(new Meters(0), new Meters(0), new Meters(-100)),
      velocityBody: new BodyVector(new MetersPerSecond(20), new MetersPerSecond(-3), new MetersPerSecond(-10)),
      attitude: new EulerAngles(new Degrees(10).toRadians(), new Degrees(25).toRadians(), new Degrees(0).toRadians()),
      angularRatesBody: new BodyVector(new RadiansPerSecond(0.4), new RadiansPerSecond(-0.2), new RadiansPerSecond(0.3)),
    });
    const energy = (s: RigidBodyState) =>
      0.5 * ball.mass.value * s.groundSpeed.value ** 2 + ball.mass.value * g * s.altitude.value;

    const run = dropSimulator(new RK4(), thrown).run({ duration: new Seconds(4) });
    const drift = Math.abs(energy(run.final.state.rigidBody) - energy(thrown)) / energy(thrown);
    expect(drift).toBeLessThan(1e-6);
  });
});

describe("rotational dynamics: I·ω̇ = M − ω × I·ω", () => {
  const inertia = new InertiaTensor(
    new KilogramMetersSquared(1),
    new KilogramMetersSquared(2),
    new KilogramMetersSquared(3),
  );
  const rates = (state: RigidBodyState, moment: BodyVector<NewtonMeters>) =>
    rigidBodyRates({
      state,
      mass: new Kilograms(1),
      inertia,
      forceBody: BodyVector.zero(Newtons),
      momentBody: moment,
    });

  it("a pitch moment from rest gives q̇ = M / Iyy", () => {
    const moment = new BodyVector(new NewtonMeters(0), new NewtonMeters(4), new NewtonMeters(0));
    const ω̇ = rates(new RigidBodyState(), moment).angularAccelerationBody;
    expect([ω̇.x.value, ω̇.y.value, ω̇.z.value]).toEqual([0, 2, 0]);
  });

  it("gyroscopic term: spin about x plus a small q produces ṙ ≠ 0", () => {
    const state = new RigidBodyState({
      angularRatesBody: new BodyVector(new RadiansPerSecond(1), new RadiansPerSecond(1), new RadiansPerSecond(0)),
    });
    // ω × Iω = (p,q,r) × (1p, 2q, 3r) → z = p·2q − q·1p = pq = 1, so ṙ = −1/Izz.
    const ω̇ = rates(state, BodyVector.zero(NewtonMeters)).angularAccelerationBody;
    expect(ω̇.z.value).toBeCloseTo(-1 / 3);
  });

  it("a torque-free tumbling body conserves |H| and rotational energy", () => {
    const dynamics: DynamicsModel<NoAuxiliaryState, NoAuxiliaryRates, NoInputs> = {
      computeRates: (s: SimState) =>
        SimRates.rigidBodyOnly(rates(s.rigidBody, BodyVector.zero(NewtonMeters))),
    };
    const initial = new RigidBodyState({
      angularRatesBody: new BodyVector(new RadiansPerSecond(0.1), new RadiansPerSecond(2), new RadiansPerSecond(0.1)),
    });
    const sim = new Simulator({
      initialState: SimState.rigidBodyOnly(initial),
      dynamics,
      timeStep: new Seconds(0.001),
      environment: new Environment(),
    });
    const final = sim.run({ duration: new Seconds(10) }).final.state.rigidBody;

    const H = (s: RigidBodyState) => inertia.times(s.angularRatesBody).magnitude().value;
    const T = (s: RigidBodyState) => 0.5 * s.angularRatesBody.dot(inertia.times(s.angularRatesBody)).value;
    expect(H(final)).toBeCloseTo(H(initial), 6);
    expect(T(final)).toBeCloseTo(T(initial), 6);
    // Spinning about the intermediate axis is unstable, so it really did tumble:
    expect(Math.abs(final.angularRatesBody.y.value - 2)).toBeGreaterThan(0.1);
  });
});
