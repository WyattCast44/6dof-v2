/**
 * Rung 2: a ball with drag.
 *
 * New concepts: the atmosphere, air data, an aerodynamic model, and terminal
 * velocity.
 *
 * The same baseball-sized ball is dropped from 10,000 m three times:
 *   1. in a vacuum (rung 1: no aero),
 *   2. with drag, in air that is the same at every altitude,
 *   3. with drag, in the U.S. Standard Atmosphere 1976, where air is thin
 *      up high and thickens on the way down.
 *
 * Run it with:  npm run example:ball-with-drag
 */
import {
  Ball,
  BallDynamics,
  ConstantAtmosphere,
  ConstantGravity,
  Environment,
  Kilograms,
  Meters,
  MetersPerSecond,
  NedVector,
  NoAero,
  RigidBodyState,
  Seconds,
  SimState,
  Simulator,
  SphereDrag,
  StandardAtmosphere1976,
  type AeroModel,
  type AtmosphereModel,
  type NoInputs,
} from "../src";

const ball = new Ball({ mass: new Kilograms(0.145), radius: new Meters(0.0366), dragCoefficient: 0.47 });
const dropHeight = new Meters(10000);
const ground = new Meters(0);

function drop(aero: AeroModel<NoInputs>, atmosphere: AtmosphereModel) {
  const simulator = new Simulator({
    initialState: SimState.rigidBodyOnly(
      new RigidBodyState({ positionNed: new NedVector(new Meters(0), new Meters(0), dropHeight.negate()) }),
    ),
    dynamics: new BallDynamics(ball, aero),
    environment: new Environment({ atmosphere }),
    timeStep: new Seconds(0.02),
  });
  return simulator.run({
    duration: new Seconds(600),
    stopWhen: (s) => s.altitude.lessThanOrEqual(ground),
  });
}

const constantAir = new ConstantAtmosphere();
const standardAir = new StandardAtmosphere1976();

const vacuum = drop(new NoAero(), constantAir);
const dragConstantAir = drop(SphereDrag.forBall(ball), constantAir);
const dragStandardAir = drop(SphereDrag.forBall(ball), standardAir);

// Terminal velocity by hand: at terminal velocity drag equals weight, so
//   q̄·S·C_D = W   →   q̄ = W / (S·C_D)   →   V = √(2·q̄ / ρ)
function terminalVelocity(density = constantAir.conditions.density): MetersPerSecond {
  const weight = ball.mass.times(ConstantGravity.STANDARD);
  const dynamicPressure = weight.divide(ball.referenceArea).scale(1 / ball.dragCoefficient);
  return dynamicPressure.divide(density).scale(2).sqrt();
}

const fmt = (v: { value: number }, digits = 1) => v.value.toFixed(digits);
const timeAloft = (run: typeof vacuum) => run.timeWhenReaches((s) => s.altitude, ground)!;
const impactSpeed = (run: typeof vacuum) => run.valueAt(timeAloft(run), (s) => s.groundSpeed);

console.log(`Baseball-sized ball dropped from ${fmt(dropHeight, 0)} m\n`);

console.log("1. Vacuum");
console.log(`   time aloft ${fmt(timeAloft(vacuum))} s, impact ${fmt(impactSpeed(vacuum))} m/s\n`);

const settled = dragConstantAir.steadyValue((s) => s.groundSpeed, {
  tolerance: new MetersPerSecond(0.01),
  window: new Seconds(5),
});
console.log("2. Drag, sea-level air everywhere");
console.log(`   time aloft ${fmt(timeAloft(dragConstantAir))} s, impact ${fmt(impactSpeed(dragConstantAir))} m/s`);
console.log(`   steady speed from the run: ${settled ? fmt(settled, 2) : "not settled"} m/s`);
console.log(`   terminal velocity by hand: ${fmt(terminalVelocity(), 2)} m/s\n`);

const fastest = dragStandardAir.max((s) => s.groundSpeed);
const altitudeAtFastest = dragStandardAir.valueAt(fastest.time, (s) => s.altitude);
console.log("3. Drag, 1976 standard atmosphere");
console.log(`   time aloft ${fmt(timeAloft(dragStandardAir))} s, impact ${fmt(impactSpeed(dragStandardAir))} m/s`);
console.log(`   fastest: ${fmt(fastest.value)} m/s at ${fmt(altitudeAtFastest, 0)} m, then slows as the air thickens`);
console.log(`   terminal velocity by hand at that altitude: ${fmt(
  terminalVelocity(standardAir.conditionsAt(altitudeAtFastest).density),
)} m/s`);
