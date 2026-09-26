/**
 * Scenario test for rung 1: ask the ball-drop run questions in plain terms
 * and check the answers against the textbook.
 */
import { describe, expect, it } from "vitest";
import {
  Ball,
  BallDynamics,
  ConstantGravity,
  Feet,
  Kilograms,
  Meters,
  NedVector,
  RigidBodyState,
  Seconds,
  SimState,
  Simulator,
} from "../src";

describe("Rung 1: ball dropped from 1,000 ft", () => {
  const height = new Feet(1000).toMeters();
  const simulator = new Simulator({
    initialState: SimState.rigidBodyOnly(
      new RigidBodyState({ positionNed: new NedVector(new Meters(0), new Meters(0), height.negate()) }),
    ),
    dynamics: new BallDynamics(new Ball({ mass: new Kilograms(1), radius: new Meters(0.05) })),
    timeStep: new Seconds(0.01),
  });
  const ground = new Meters(0);
  const run = simulator.run({
    duration: new Seconds(60),
    stopWhen: (s) => s.altitude.lessThanOrEqual(ground),
  });
  const g = ConstantGravity.STANDARD.value;

  it("is airborne for √(2h/g)", () => {
    const timeAloft = run.timeWhenReaches((s) => s.altitude, ground)!;
    expect(timeAloft.value).toBeCloseTo(Math.sqrt((2 * height.value) / g), 3);
  });

  it("hits the ground at √(2gh)", () => {
    const timeAloft = run.timeWhenReaches((s) => s.altitude, ground)!;
    const impactSpeed = run.valueAt(timeAloft, (s) => s.groundSpeed);
    expect(impactSpeed.value).toBeCloseTo(Math.sqrt(2 * g * height.value), 1);
  });

  it("never climbs above where it was dropped", () => {
    expect(run.max((s) => s.altitude).value.value).toBeCloseTo(height.value, 9);
  });
});
