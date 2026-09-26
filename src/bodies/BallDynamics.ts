import type { DynamicsModel } from "../dynamics";
import { rigidBodyRates } from "../dynamics";
import type { Environment } from "../environment";
import type { NoInputs } from "../sim/InputSource";
import { SimRates, type NoAuxiliaryRates, type NoAuxiliaryState, type SimState } from "../state";
import { NewtonMeters } from "../units";
import { BodyVector } from "../vectors";
import type { Ball } from "./Ball";

/**
 * Dynamics of a ball in a vacuum: gravity is the only force, and nothing
 * pushes it to spin. (Drag arrives in rung 2.)
 *
 * The pipeline is the same shape an aircraft uses, just shorter:
 * forces → moments → equations of motion.
 */
export class BallDynamics implements DynamicsModel<NoAuxiliaryState, NoAuxiliaryRates, NoInputs> {
  constructor(public readonly ball: Ball) {}

  computeRates(state: SimState, environment: Environment, _inputs: NoInputs): SimRates {
    const body = state.rigidBody;

    // 1. Gravity: look it up in NED, rotate it into the body frame, W = m·g.
    const gravityNed = environment.gravity.gravityAt(body.positionNed);
    const gravityBody = body.attitude.nedToBody(gravityNed);
    const weightBody = gravityBody.times(this.ball.mass);

    // 2. Sum forces and moments. Weight acts at the CG, so it makes no moment.
    const forceBody = weightBody;
    const momentBody = BodyVector.zero(NewtonMeters);

    // 3. Equations of motion.
    return SimRates.rigidBodyOnly(
      rigidBodyRates({
        state: body,
        mass: this.ball.mass,
        inertia: this.ball.inertia,
        forceBody,
        momentBody,
      }),
    );
  }
}
