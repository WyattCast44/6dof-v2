import { AirData, NoAero, type AeroModel } from "../aero";
import type { DynamicsModel } from "../dynamics";
import { rigidBodyRates } from "../dynamics";
import type { Environment } from "../environment";
import type { NoInputs } from "../sim/InputSource";
import { SimRates, type NoAuxiliaryRates, type NoAuxiliaryState, type SimState } from "../state";
import type { Seconds } from "../units";
import type { Ball } from "./Ball";

/**
 * Dynamics of a ball. With the default `NoAero` it falls as in a vacuum
 * (rung 1); give it `SphereDrag` and the air pushes back (rung 2).
 *
 * The pipeline is the same shape an aircraft uses, just shorter:
 * air data → aero forces → gravity → sum → equations of motion.
 */
export class BallDynamics implements DynamicsModel<NoAuxiliaryState, NoAuxiliaryRates, NoInputs> {
  constructor(
    public readonly ball: Ball,
    public readonly aero: AeroModel<NoInputs> = new NoAero(),
  ) {}

  computeRates(state: SimState, environment: Environment, inputs: NoInputs, time: Seconds): SimRates {
    const body = state.rigidBody;

    // 1. Air data: how the air flows past the ball (uses atmosphere and wind).
    const airData = AirData.from(body, environment, time);

    // 2. Aerodynamic forces and moments.
    const aero = this.aero.forcesAndMoments(airData, inputs);

    // 3. Gravity: look it up in NED, rotate it into the body frame, W = m·g.
    const gravityBody = body.attitude.nedToBody(environment.gravity.gravityAt(body.positionNed));
    const weightBody = gravityBody.times(this.ball.mass);

    // 4. Sum forces and moments. Weight acts at the CG, so it adds no moment.
    const forceBody = aero.forceBody.add(weightBody);
    const momentBody = aero.momentBody;

    // 5. Equations of motion.
    return SimRates.rigidBodyOnly(
      rigidBodyRates({ state: body, mass: this.ball.mass, inertia: this.ball.inertia, forceBody, momentBody }),
    );
  }
}
