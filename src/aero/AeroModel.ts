import type { NewtonMeters, Newtons } from "../units";
import type { BodyVector } from "../vectors";
import type { AirData } from "./AirData";

/** Aerodynamic force and moment on the body, about its CG, in body axes. */
export interface AeroForcesAndMoments {
  readonly forceBody: BodyVector<Newtons>;
  readonly momentBody: BodyVector<NewtonMeters>;
}

/**
 * "Given air data and inputs, what are the aerodynamic forces and moments?"
 *
 * Fidelity ranges from nothing at all (`NoAero`, a ball in a vacuum), to
 * drag only (`SphereDrag`), to a full stability-derivative model for an
 * aircraft, which will read control deflections and configuration from
 * `inputs`.
 */
export interface AeroModel<Inputs = unknown> {
  forcesAndMoments(airData: AirData, inputs: Inputs): AeroForcesAndMoments;
}
