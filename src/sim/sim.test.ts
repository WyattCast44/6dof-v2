import { describe, expect, it } from "vitest";
import { Ball, BallDynamics } from "../bodies";
import { RigidBodyState, SimState } from "../state";
import { Kilograms, Meters, MetersPerSecond, Seconds } from "../units";
import { NedVector } from "../vectors";
import { Recording, Simulator } from "./index";

const recording = new Recording(
  [0, 1, 2, 3, 4].map((t) => ({ time: new Seconds(t), state: { height: new Meters([0, 10, 15, 12, 4][t]!) } })),
);
const height = (s: { height: Meters }) => s.height;

describe("Recording queries", () => {
  it("timeWhen finds the first sample where a condition holds", () => {
    expect(recording.timeWhen((s) => s.height.greaterThan(new Meters(11)))?.value).toBe(2);
    expect(recording.timeWhen((s) => s.height.greaterThan(new Meters(100)))).toBeUndefined();
  });

  it("timeWhenReaches interpolates between samples", () => {
    expect(recording.timeWhenReaches(height, new Meters(5))?.value).toBeCloseTo(0.5);
    expect(recording.timeWhenReaches(height, new Meters(8))?.value).toBeCloseTo(0.8);
  });

  it("max and min report the value and when it happened", () => {
    const peak = recording.max(height);
    expect([peak.time.value, peak.value.value]).toEqual([2, 15]);
    expect(recording.min(height).value.value).toBe(0);
  });

  it("valueAt interpolates, and refuses times outside the run", () => {
    expect(recording.valueAt(new Seconds(2.5), height).value).toBeCloseTo(13.5);
    expect(recording.valueAt(new Seconds(4), height).value).toBe(4);
    expect(() => recording.valueAt(new Seconds(5), height)).toThrow(RangeError);
  });

  it("steadyValue only answers once the value has settled", () => {
    const settling = new Recording(
      [0, 1, 2, 3, 4].map((t) => ({
        time: new Seconds(t),
        state: { speed: new MetersPerSecond([0, 30, 39, 40, 40][t]!) },
      })),
    );
    const speed = (s: { speed: MetersPerSecond }) => s.speed;
    const tolerance = new MetersPerSecond(0.5);
    expect(settling.steadyValue(speed, { tolerance, window: new Seconds(1) })?.value).toBe(40);
    expect(settling.steadyValue(speed, { tolerance, window: new Seconds(2) })).toBeUndefined();
  });
});

describe("Simulator", () => {
  const simulator = () =>
    new Simulator({
      initialState: SimState.rigidBodyOnly(
        new RigidBodyState({ positionNed: new NedVector(new Meters(0), new Meters(0), new Meters(-50)) }),
      ),
      dynamics: new BallDynamics(new Ball(new Kilograms(1), new Meters(0.1))),
      timeStep: new Seconds(0.1),
    });

  it("keeps time by counting steps, so it does not drift", () => {
    const sim = simulator();
    const run = sim.run({ duration: new Seconds(3) });
    expect(sim.time.value).toBe(3); // a running sum of 0.1s would give 3.0000000000000013
    expect(run.samples).toHaveLength(31);
    expect(run.initial.time.value).toBe(0);
  });

  it("stops early when stopWhen becomes true", () => {
    const run = simulator().run({
      duration: new Seconds(60),
      stopWhen: (s) => s.altitude.lessThanOrEqual(new Meters(0)),
    });
    expect(run.final.state.altitude.value).toBeLessThanOrEqual(0);
    expect(run.duration.value).toBeLessThan(4);
  });

  it("can be stepped by hand and resumed", () => {
    const sim = simulator();
    sim.step();
    sim.step();
    sim.run({ duration: new Seconds(1) });
    expect(sim.time.value).toBeCloseTo(1.2);
    expect(sim.recording.samples).toHaveLength(13);
  });
});
