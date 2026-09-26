/**
 * Rung 1: drop a ball from altitude.
 *
 * New concepts: state, integration, gravity.
 *
 * Run it with:  npm run example:ball-drop
 */
import {
  Ball,
  BallDynamics,
  Feet,
  Kilograms,
  Meters,
  NedVector,
  RigidBodyState,
  Seconds,
  SimState,
  Simulator,
} from "../src";

// A 1 kg ball, 10 cm across...
const ball = new Ball({ mass: new Kilograms(1), radius: new Meters(0.05) });

// ...held still, 1,000 ft above the ground. (Down is positive in NED, so
// altitude is a negative "down".)
const dropHeight = new Feet(1000).toMeters();
const initialState = SimState.rigidBodyOnly(
  new RigidBodyState({
    positionNed: new NedVector(new Meters(0), new Meters(0), dropHeight.negate()),
  }),
);

const simulator = new Simulator({
  initialState,
  dynamics: new BallDynamics(ball),
  timeStep: new Seconds(0.01),
});

// Let go, and stop when it hits the ground.
const ground = new Meters(0);
const run = simulator.run({
  duration: new Seconds(60),
  stopWhen: (state) => state.altitude.lessThanOrEqual(ground),
});

// Ask the run some questions.
const timeAloft = run.timeWhenReaches((s) => s.altitude, ground)!;
const impactSpeed = run.valueAt(timeAloft, (s) => s.groundSpeed);
const halfwayAltitude = run.valueAt(timeAloft.scale(0.5), (s) => s.altitude);

console.log(`Dropped from:        ${dropHeight.value.toFixed(1)} m (${new Feet(1000)})`);
console.log(`Time aloft:          ${timeAloft.value.toFixed(3)} s`);
console.log(`Impact speed:        ${impactSpeed.value.toFixed(2)} m/s (${impactSpeed.toKnots().value.toFixed(1)} kt)`);
console.log(`Altitude at halfway: ${halfwayAltitude.value.toFixed(1)} m  (a quarter of the way down: gravity accelerates)`);
