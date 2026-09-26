import { describe, expect, expectTypeOf, it } from "vitest";
import {
  Kilograms,
  Meters,
  MetersPerSecond,
  MetersPerSecondSquared,
  Newtons,
  RadiansPerSecond,
  Seconds,
} from "../units";
import { BodyVector, NedVector } from "./index";

const m = (v: number) => new Meters(v);

describe("NedVector and BodyVector", () => {
  it("add, subtract and scale component-wise", () => {
    const a = new NedVector(m(1), m(2), m(3));
    const b = new NedVector(m(4), m(5), m(6));
    const c = a.add(b).subtract(new NedVector(m(1), m(1), m(1))).scale(2);
    expect([c.north.value, c.east.value, c.down.value]).toEqual([8, 12, 16]);
  });

  it("magnitude keeps the unit", () => {
    const v = new BodyVector(new MetersPerSecond(3), new MetersPerSecond(4), new MetersPerSecond(0));
    const speed = v.magnitude();
    expectTypeOf(speed).toEqualTypeOf<MetersPerSecond>();
    expect(speed.value).toBe(5);
  });

  it("force ÷ mass gives an acceleration vector", () => {
    const force = new BodyVector(new Newtons(10), new Newtons(0), new Newtons(-20));
    const a = force.divide(new Kilograms(2));
    expectTypeOf(a).toEqualTypeOf<BodyVector<MetersPerSecondSquared>>();
    expect([a.x.value, a.y.value, a.z.value]).toEqual([5, 0, -10]);
  });

  it("velocity × time gives a displacement", () => {
    const v = new NedVector(new MetersPerSecond(1), new MetersPerSecond(2), new MetersPerSecond(3));
    const d = v.times(new Seconds(2));
    expectTypeOf(d).toEqualTypeOf<NedVector<Meters>>();
    expect(d.down.value).toBe(6);
  });

  it("ω × v follows the right-hand rule and gives an acceleration", () => {
    const ω = new BodyVector(new RadiansPerSecond(0), new RadiansPerSecond(0), new RadiansPerSecond(1));
    const v = new BodyVector(new MetersPerSecond(1), new MetersPerSecond(0), new MetersPerSecond(0));
    const result = ω.cross(v); // z × x = y
    expectTypeOf(result).toEqualTypeOf<BodyVector<MetersPerSecondSquared>>();
    expect([result.x.value, result.y.value, result.z.value]).toEqual([0, 1, 0]);
  });

  it("dot product", () => {
    const ω = new BodyVector(new RadiansPerSecond(1), new RadiansPerSecond(2), new RadiansPerSecond(3));
    const v = new BodyVector(new MetersPerSecond(4), new MetersPerSecond(5), new MetersPerSecond(6));
    expect(ω.dot(v).value).toBe(32);
  });

  it("frames cannot be mixed by accident", () => {
    const ned = NedVector.zero(Meters);
    const body = BodyVector.zero(Meters);
    // @ts-expect-error: a body-frame vector is not an NED vector
    ned.add(body);
    // @ts-expect-error: meters cannot be added to seconds
    ned.add(NedVector.zero(Seconds));
  });
});
