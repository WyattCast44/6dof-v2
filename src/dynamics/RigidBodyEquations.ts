import type { Kilograms, NewtonMeters, Newtons } from "../units";
import { RigidBodyRates, type RigidBodyState } from "../state";
import type { BodyVector } from "../vectors";
import type { InertiaTensor } from "./InertiaTensor";

/**
 * The rigid-body equations of motion (flat, non-rotating Earth).
 *
 * Every body in the simulator, from a dropped ball to an aircraft, ends its
 * `computeRates` pipeline here: work out the net force and moment, then hand
 * them to this function.
 *
 * Source: Stevens, Lewis & Johnson, "Aircraft Control and Simulation",
 * 3rd ed. (2016), Ch. 1, flat-Earth body-axis 6-DOF equations; Beard &
 * McLain, "Small Unmanned Aircraft" (2012), Ch. 3.
 * TODO(citation): add the exact equation numbers.
 */
export function rigidBodyRates(args: {
  state: RigidBodyState;
  mass: Kilograms;
  inertia: InertiaTensor;
  /** Net force on the body (gravity included), in body axes. */
  forceBody: BodyVector<Newtons>;
  /** Net moment about the center of gravity, in body axes. */
  momentBody: BodyVector<NewtonMeters>;
}): RigidBodyRates {
  const { state, mass, inertia, forceBody, momentBody } = args;
  const velocityBody = state.velocityBody; // v_b = (u, v, w)
  const ω = state.angularRatesBody; //         ω_b = (p, q, r)

  // Position kinematics:     ṗ_ned = C_b→n · v_b
  const positionRateNed = state.attitude.bodyToNed(velocityBody);

  // Translational dynamics:  v̇_b = F_b / m − ω_b × v_b
  const accelerationBody = forceBody.divide(mass).subtract(ω.cross(velocityBody));

  // Rotational kinematics:   (φ̇, θ̇, ψ̇) = H(φ, θ) · ω_b   (see EulerAngles.ratesFrom)
  const attitudeRate = state.attitude.ratesFrom(ω);

  // Rotational dynamics:     ω̇_b = I⁻¹ (M_b − ω_b × I·ω_b)
  const angularAccelerationBody = inertia.solve(momentBody.subtract(ω.cross(inertia.times(ω))));

  return new RigidBodyRates(positionRateNed, accelerationBody, attitudeRate, angularAccelerationBody);
}
