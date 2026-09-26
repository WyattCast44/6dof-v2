import { describe, expect, it } from "vitest";
import {
  Degrees,
  Meters,
  MetersPerSecondSquared,
  Radians,
  RadiansPerSecond,
} from "../units";
import { BodyVector, NedVector } from "../vectors";
import { EulerAngles } from "./index";

const deg = (v: number) => new Degrees(v).toRadians();
const angles = (roll: number, pitch: number, yaw: number) => new EulerAngles(deg(roll), deg(pitch), deg(yaw));
const g = 9.80665;
const gravityNed = new NedVector(
  new MetersPerSecondSquared(0),
  new MetersPerSecondSquared(0),
  new MetersPerSecondSquared(g),
);

describe("direction cosine matrix", () => {
  it("gravity in the body frame gives gx = −g·sinθ (v1 regression)", () => {
    const attitude = angles(20, 30, 45);
    const gBody = attitude.nedToBody(gravityNed);
    const θ = attitude.pitch, φ = attitude.roll;
    expect(gBody.x.value).toBeCloseTo(-g * θ.sin());
    expect(gBody.y.value).toBeCloseTo(g * φ.sin() * θ.cos());
    expect(gBody.z.value).toBeCloseTo(g * φ.cos() * θ.cos());
  });

  it("nose pointing east (ψ = 90°) sends body x to NED east", () => {
    const forward = new BodyVector(new Meters(1), new Meters(0), new Meters(0));
    const ned = angles(0, 0, 90).bodyToNed(forward);
    expect(ned.north.value).toBeCloseTo(0);
    expect(ned.east.value).toBeCloseTo(1);
    expect(ned.down.value).toBeCloseTo(0);
  });

  it("nose up (θ = 30°) sends body x upward (negative down)", () => {
    const forward = new BodyVector(new Meters(1), new Meters(0), new Meters(0));
    const ned = angles(0, 30, 0).bodyToNed(forward);
    expect(ned.down.value).toBeCloseTo(-0.5);
  });

  it("is orthonormal: C·Cᵀ = I", () => {
    const c = angles(-35, 60, 200).nedToBodyMatrix();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const dot = c[i]![0] * c[j]![0] + c[i]![1] * c[j]![1] + c[i]![2] * c[j]![2];
        expect(dot).toBeCloseTo(i === j ? 1 : 0, 12);
      }
    }
  });

  it("bodyToNed undoes nedToBody", () => {
    const attitude = angles(10, -20, 300);
    const v = new NedVector(new Meters(1), new Meters(-2), new Meters(3));
    const roundTrip = attitude.bodyToNed(attitude.nedToBody(v));
    expect(roundTrip.north.value).toBeCloseTo(1);
    expect(roundTrip.east.value).toBeCloseTo(-2);
    expect(roundTrip.down.value).toBeCloseTo(3);
  });
});

describe("Euler kinematic equations", () => {
  const rates = (p: number, q: number, r: number) =>
    new BodyVector(new RadiansPerSecond(p), new RadiansPerSecond(q), new RadiansPerSecond(r));

  it("wings level: angle rates equal body rates", () => {
    const eulerRates = EulerAngles.level().ratesFrom(rates(0.1, 0.2, 0.3));
    expect(eulerRates.rollRate.value).toBeCloseTo(0.1);
    expect(eulerRates.pitchRate.value).toBeCloseTo(0.2);
    expect(eulerRates.yawRate.value).toBeCloseTo(0.3);
  });

  it("banked 90°: pitch rate q turns the heading instead of the pitch (v1 regression)", () => {
    const eulerRates = angles(90, 0, 0).ratesFrom(rates(0, 0.2, 0));
    expect(eulerRates.pitchRate.value).toBeCloseTo(0);
    expect(eulerRates.yawRate.value).toBeCloseTo(0.2);
  });

  it("matches φ̇ = p + (q·sinφ + r·cosφ)·tanθ in a general attitude", () => {
    const attitude = new EulerAngles(new Radians(0.3), new Radians(0.4), new Radians(1));
    const eulerRates = attitude.ratesFrom(rates(0.1, 0.2, 0.3));
    const [φ, θ] = [0.3, 0.4];
    expect(eulerRates.rollRate.value).toBeCloseTo(
      0.1 + (0.2 * Math.sin(φ) + 0.3 * Math.cos(φ)) * Math.tan(θ),
    );
    expect(eulerRates.pitchRate.value).toBeCloseTo(0.2 * Math.cos(φ) - 0.3 * Math.sin(φ));
    expect(eulerRates.yawRate.value).toBeCloseTo((0.2 * Math.sin(φ) + 0.3 * Math.cos(φ)) / Math.cos(θ));
  });
});
