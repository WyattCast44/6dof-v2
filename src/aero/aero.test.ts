import { describe, expect, it } from "vitest";
import { EulerAngles } from "../attitude";
import { Ball, BallDynamics } from "../bodies";
import { ConstantGravity, ConstantWind, Environment } from "../environment";
import { Simulator } from "../sim";
import { RigidBodyState, SimState } from "../state";
import {
  Degrees,
  Kilograms,
  Meters,
  MetersPerSecond,
  Radians,
  Seconds,
  SquareMeters,
} from "../units";
import { BodyVector, NedVector } from "../vectors";
import { AirData, SphereDrag } from "./index";

const mps = (v: number) => new MetersPerSecond(v);
const bodyVelocity = (u: number, v: number, w: number) => new BodyVector(mps(u), mps(v), mps(w));
const seaLevel = new Environment();

describe("AirData", () => {
  it("in still air, airspeed is ground speed and q̄ = ½ρV²", () => {
    const air = AirData.from(new RigidBodyState({ velocityBody: bodyVelocity(50, 0, 0) }), seaLevel, new Seconds(0));
    expect(air.airspeed.value).toBe(50);
    expect(air.angleOfAttack.value).toBe(0);
    expect(air.sideslip.value).toBe(0);
    expect(air.dynamicPressure.value).toBeCloseTo(0.5 * 1.225 * 50 * 50, 1);
    expect(air.mach).toBeCloseTo(50 / 340.294, 4);
  });

  it("α is positive when the air comes from below the nose (w > 0)", () => {
    const air = AirData.from(new RigidBodyState({ velocityBody: bodyVelocity(50, 0, 5) }), seaLevel, new Seconds(0));
    expect(air.angleOfAttack.value).toBeCloseTo(Math.atan2(5, 50));
  });

  it("β is positive when the air comes from the right (v > 0)", () => {
    const air = AirData.from(new RigidBodyState({ velocityBody: bodyVelocity(50, 5, 0) }), seaLevel, new Seconds(0));
    expect(air.sideslip.value).toBeCloseTo(Math.asin(5 / Math.hypot(50, 5)));
  });

  it("a headwind adds to airspeed; a crosswind shows up as sideslip", () => {
    // Flying east at 40 m/s over the ground.
    const state = new RigidBodyState({
      velocityBody: bodyVelocity(40, 0, 0),
      attitude: new EulerAngles(new Radians(0), new Radians(0), new Degrees(90).toRadians()),
    });
    const fromEast = ConstantWind.fromDirection(new Degrees(90).toRadians(), mps(10));
    const headwind = AirData.from(state, new Environment({ wind: fromEast }), new Seconds(0));
    expect(headwind.airspeed.value).toBeCloseTo(50);

    const fromNorth = ConstantWind.fromDirection(new Degrees(0).toRadians(), mps(10));
    const crosswind = AirData.from(state, new Environment({ wind: fromNorth }), new Seconds(0));
    // Heading east, a wind from the north blows toward the body's right, so
    // relative to the body the air arrives from the left: v_air < 0, β < 0.
    expect(crosswind.velocityAirBody.y.value).toBeCloseTo(-10);
    expect(crosswind.sideslip.value).toBeCloseTo(Math.asin(-10 / Math.hypot(40, 10)));
  });
});

describe("SphereDrag", () => {
  const drag = new SphereDrag(0.5, new SquareMeters(0.01));

  it("has magnitude q̄·S·C_D and points against the airflow", () => {
    const air = AirData.from(new RigidBodyState({ velocityBody: bodyVelocity(30, 0, 40) }), seaLevel, new Seconds(0));
    const { forceBody, momentBody } = drag.forcesAndMoments(air);
    const expected = 0.5 * 1.225 * 50 * 50 * 0.01 * 0.5;
    expect(forceBody.magnitude().value).toBeCloseTo(expected, 6);
    expect(forceBody.x.value / forceBody.z.value).toBeCloseTo(30 / 40);
    expect(forceBody.x.value).toBeLessThan(0);
    expect(momentBody.magnitude().value).toBe(0);
  });

  it("is zero in still air at rest", () => {
    const air = AirData.from(new RigidBodyState(), seaLevel, new Seconds(0));
    expect(drag.forcesAndMoments(air).forceBody.magnitude().value).toBe(0);
  });
});

describe("falling with drag in constant air", () => {
  const ball = new Ball({ mass: new Kilograms(0.145), radius: new Meters(0.0366) });
  const g = ConstantGravity.STANDARD.value;
  const ρ = 1.225;
  const Vt = Math.sqrt((2 * ball.mass.value * g) / (ρ * ball.referenceArea.value * ball.dragCoefficient));

  const run = new Simulator({
    initialState: SimState.rigidBodyOnly(new RigidBodyState()),
    dynamics: new BallDynamics(ball, SphereDrag.forBall(ball)),
    timeStep: new Seconds(0.01),
  }).run({ duration: new Seconds(10) });

  // Closed-form solution for quadratic drag from rest:
  //   v(t) = Vt·tanh(g·t / Vt),   d(t) = (Vt² / g)·ln cosh(g·t / Vt)
  it.each([1, 3, 10])("matches v = Vt·tanh(g·t/Vt) and the distance fallen at t = %i s", (t) => {
    const speed = run.valueAt(new Seconds(t), (s) => s.groundSpeed).value;
    const fallen = run.valueAt(new Seconds(t), (s) => s.rigidBody.positionNed.down).value;
    expect(speed).toBeCloseTo(Vt * Math.tanh((g * t) / Vt), 6);
    expect(fallen).toBeCloseTo(((Vt * Vt) / g) * Math.log(Math.cosh((g * t) / Vt)), 5);
  });
});

describe("falling in a wind", () => {
  it("drifts until it moves sideways with the air", () => {
    const ball = new Ball({ mass: new Kilograms(0.145), radius: new Meters(0.0366) });
    const wind = new ConstantWind(new NedVector(mps(0), mps(8), mps(0))); // blowing toward the east
    const run = new Simulator({
      initialState: SimState.rigidBodyOnly(new RigidBodyState()),
      dynamics: new BallDynamics(ball, SphereDrag.forBall(ball)),
      environment: new Environment({ wind }),
      timeStep: new Seconds(0.01),
    }).run({ duration: new Seconds(30) });

    const velocityNed = run.final.state.rigidBody.velocityNed;
    expect(velocityNed.east.value).toBeCloseTo(8, 2); // the last few mm/s close slowly
    expect(velocityNed.north.value).toBeCloseTo(0, 6);
  });
});
