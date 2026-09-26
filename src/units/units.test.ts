import { describe, expect, expectTypeOf, it } from "vitest";
import {
  Degrees,
  Feet,
  Kilograms,
  Knots,
  Meters,
  MetersPerSecond,
  MetersPerSecondSquared,
  Newtons,
  Pounds,
  Radians,
  Seconds,
  type UnknownUnitCombination,
} from "./index";

describe("same-unit arithmetic", () => {
  it("adds, subtracts, scales and keeps the unit", () => {
    const total = new Meters(3).add(new Meters(4)).subtract(new Meters(2)).scale(2);
    expect(total).toBeInstanceOf(Meters);
    expect(total.value).toBe(10);
  });

  it("compares quantities of the same unit", () => {
    expect(new Meters(-1).lessThanOrEqual(new Meters(0))).toBe(true);
    expect(new Meters(1).greaterThan(new Meters(0))).toBe(true);
  });

  it("rejects non-finite values", () => {
    expect(() => new Meters(Number.NaN)).toThrow(RangeError);
  });
});

describe("unit-changing arithmetic", () => {
  it("length ÷ time gives a velocity", () => {
    const speed = new Meters(100).divide(new Seconds(20));
    expectTypeOf(speed).toEqualTypeOf<MetersPerSecond>();
    expect(speed).toBeInstanceOf(MetersPerSecond);
    expect(speed.value).toBe(5);
  });

  it("mass × acceleration gives a force, in either order", () => {
    const weight = new Kilograms(2).times(new MetersPerSecondSquared(9.8));
    expectTypeOf(weight).toEqualTypeOf<Newtons>();
    expect(weight).toBeInstanceOf(Newtons);
    expect(weight.value).toBeCloseTo(19.6);
  });

  it("force ÷ mass gives an acceleration", () => {
    const a = new Newtons(10).divide(new Kilograms(2));
    expectTypeOf(a).toEqualTypeOf<MetersPerSecondSquared>();
    expect(a.value).toBe(5);
  });

  it("unlisted combinations are a type error and a runtime error", () => {
    expectTypeOf(() => new Meters(1).times(new Kilograms(1))).returns.toEqualTypeOf<
      UnknownUnitCombination<"no rule for m * kg">
    >();
    expect(() => new Meters(1).times(new Kilograms(1))).toThrow(TypeError);
  });
});

describe("edge-unit conversions", () => {
  it("converts feet, knots, pounds and degrees", () => {
    expect(new Feet(30000).toMeters().value).toBeCloseTo(9144);
    expect(new Meters(9144).toFeet().value).toBeCloseTo(30000);
    expect(new Knots(1).toMetersPerSecond().value).toBeCloseTo(0.514444, 5);
    expect(new Pounds(5000).toKilograms().value).toBeCloseTo(2267.96, 2);
    expect(new Degrees(180).toRadians().value).toBeCloseTo(Math.PI);
    expect(new Radians(Math.PI / 2).toDegrees().value).toBeCloseTo(90);
  });
});
