import { NewtonMeters, type SquareMeters } from "../units";
import { BodyVector } from "../vectors";
import type { AeroForcesAndMoments, AeroModel } from "./AeroModel";
import type { AirData } from "./AirData";

/**
 * Drag on a sphere: a force straight against the airflow, with a constant
 * drag coefficient.
 *
 * ```
 * D = q̄ · S · C_D
 * D_body = −D · (v_air / |v_air|)
 * ```
 *
 * A sphere looks the same from every direction, so there is no lift and no
 * moment about its center. (Real balls have a C_D that changes with Reynolds
 * number, and spinning balls feel a Magnus force; both are left out.)
 */
export class SphereDrag implements AeroModel {
  constructor(
    /** C_D, about 0.47 for a smooth sphere at everyday speeds. */
    public readonly dragCoefficient: number,
    /** S, the area the coefficient is based on (π·r² for a sphere). */
    public readonly referenceArea: SquareMeters,
  ) {}

  /** Drag for a ball, using its own drag coefficient and frontal area. */
  static forBall(ball: { dragCoefficient: number; referenceArea: SquareMeters }): SphereDrag {
    return new SphereDrag(ball.dragCoefficient, ball.referenceArea);
  }

  forcesAndMoments(airData: AirData): AeroForcesAndMoments {
    const drag = airData.dynamicPressure.times(this.referenceArea).scale(this.dragCoefficient);
    const forceBody = airData.velocityAirBody.withMagnitude(drag).negate();
    return { forceBody, momentBody: BodyVector.zero(NewtonMeters) };
  }
}
