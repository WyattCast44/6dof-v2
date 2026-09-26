import { describe, expect, it } from "vitest";
import { Meters, MetersPerSecond, Seconds } from "../units";
import type { Integrator } from "./index";
import { Euler, RK4 } from "./index";

/**
 * A one-number state for testing integrators on their own: x(t) with
 * ẋ = −x, whose exact solution is x₀·e^(−t).
 */
class Scalar {
  constructor(readonly x: Meters) {}
  advance(rate: ScalarRate, dt: Seconds): Scalar {
    return new Scalar(this.x.add(rate.ẋ.times(dt)));
  }
}
class ScalarRate {
  constructor(readonly ẋ: MetersPerSecond) {}
  add(o: ScalarRate) {
    return new ScalarRate(this.ẋ.add(o.ẋ));
  }
  scale(k: number) {
    return new ScalarRate(this.ẋ.scale(k));
  }
}
const decay = (s: Scalar) => new ScalarRate(new MetersPerSecond(-s.x.value));

function errorAfterOneSecond(integrator: Integrator, dt: number): number {
  let state = new Scalar(new Meters(1));
  const steps = Math.round(1 / dt);
  for (let i = 0; i < steps; i++) {
    state = integrator.step(state, new Seconds(i * dt), new Seconds(dt), decay);
  }
  return Math.abs(state.x.value - Math.exp(-1));
}

describe.each([
  { integrator: new Euler(), order: 1 },
  { integrator: new RK4(), order: 4 },
])("$integrator.name", ({ integrator, order }) => {
  it(`is order ${order}: halving dt cuts the error by about 2^${order}`, () => {
    const coarse = errorAfterOneSecond(integrator, 0.02);
    const fine = errorAfterOneSecond(integrator, 0.01);
    expect(Math.log2(coarse / fine)).toBeCloseTo(order, 0);
  });
});

describe("RK4", () => {
  it("is far more accurate than Euler at the same step", () => {
    expect(errorAfterOneSecond(new RK4(), 0.1)).toBeLessThan(1e-6);
    expect(errorAfterOneSecond(new Euler(), 0.1)).toBeGreaterThan(1e-2);
  });

  it("passes the time of each stage to the rates function", () => {
    const times: number[] = [];
    new RK4().step(new Scalar(new Meters(1)), new Seconds(2), new Seconds(0.5), (s, t) => {
      times.push(t.value);
      return decay(s);
    });
    expect(times).toEqual([2, 2.25, 2.25, 2.5]);
  });
});
