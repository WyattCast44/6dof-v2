/**
 * Scenario test for rung 2: ask a drag run about terminal velocity and
 * compare with the hand calculation.
 */
import { describe, expect, it } from "vitest";
import {
  Ball,
  BallDynamics,
  ConstantGravity,
  Environment,
  Kilograms,
  Meters,
  MetersPerSecond,
  NedVector,
  RigidBodyState,
  Seconds,
  SimState,
  Simulator,
  SphereDrag,
  StandardAtmosphere1976,
  type AtmosphereModel,
} from "../src";

const ball = new Ball({ mass: new Kilograms(0.145), radius: new Meters(0.0366) });
const ground = new Meters(0);

function drop(height: Meters, atmosphere?: AtmosphereModel) {
  return new Simulator({
    initialState: SimState.rigidBodyOnly(
      new RigidBodyState({ positionNed: new NedVector(new Meters(0), new Meters(0), height.negate()) }),
    ),
    dynamics: new BallDynamics(ball, SphereDrag.forBall(ball)),
    environment: new Environment(atmosphere ? { atmosphere } : {}),
    timeStep: new Seconds(0.02),
  }).run({ duration: new Seconds(600), stopWhen: (s) => s.altitude.lessThanOrEqual(ground) });
}

/** V_t = √(2·q̄/ρ), with q̄ = W / (S·C_D) */
function terminalVelocity(density: number): number {
  const weight = ball.mass.value * ConstantGravity.STANDARD.value;
  return Math.sqrt((2 * weight) / (ball.referenceArea.value * ball.dragCoefficient) / density);
}

describe("Rung 2: baseball-sized ball with drag", () => {
  it("in constant sea-level air, settles at the hand-calculated terminal velocity", () => {
    const run = drop(new Meters(1000));
    const steady = run.steadyValue((s) => s.groundSpeed, {
      tolerance: new MetersPerSecond(0.001),
      window: new Seconds(5),
    });
    expect(steady).toBeDefined();
    expect(steady!.value).toBeCloseTo(terminalVelocity(1.225), 3);
  });

  it("takes much longer to fall than in a vacuum", () => {
    const timeAloft = drop(new Meters(1000)).timeWhenReaches((s) => s.altitude, ground)!;
    const vacuumTime = Math.sqrt((2 * 1000) / ConstantGravity.STANDARD.value);
    expect(timeAloft.value).toBeGreaterThan(2 * vacuumTime);
  });

  describe("in the 1976 standard atmosphere, from 10,000 m", () => {
    const atmosphere = new StandardAtmosphere1976();
    const run = drop(new Meters(10000), atmosphere);

    it("peaks high up, where the air is thin", () => {
      const fastest = run.max((s) => s.groundSpeed);
      const altitude = run.valueAt(fastest.time, (s) => s.altitude);
      expect(altitude.value).toBeGreaterThan(5000);
      // Near the peak, speed ≈ the local terminal velocity (acceleration ≈ 0).
      const local = terminalVelocity(atmosphere.conditionsAt(altitude).density.value);
      expect(fastest.value.value / local).toBeCloseTo(1, 2);
    });

    it("hits the ground close to the sea-level terminal velocity", () => {
      const timeAloft = run.timeWhenReaches((s) => s.altitude, ground)!;
      const impact = run.valueAt(timeAloft, (s) => s.groundSpeed);
      expect(impact.value / terminalVelocity(1.225)).toBeCloseTo(1, 2);
    });
  });
});
