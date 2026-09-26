import { InertiaTensor } from "../dynamics";
import type { Kilograms, Meters, SquareMeters } from "../units";

/**
 * A solid ball: the simplest body in the learning ladder.
 *
 * Like every body, a Ball only describes itself. It never stores position,
 * velocity or time; those live in the state.
 */
export class Ball {
  readonly mass: Kilograms;
  readonly radius: Meters;
  /** C_D, used when the ball flies with drag. About 0.47 for a smooth sphere. */
  readonly dragCoefficient: number;

  constructor(properties: { mass: Kilograms; radius: Meters; dragCoefficient?: number }) {
    this.mass = properties.mass;
    this.radius = properties.radius;
    this.dragCoefficient = properties.dragCoefficient ?? 0.47;
  }

  /** Frontal area, S = π·r². */
  get referenceArea(): SquareMeters {
    return this.radius.times(this.radius).scale(Math.PI);
  }

  /** A uniform solid sphere: I = (2/5)·m·r² about every axis. */
  get inertia(): InertiaTensor {
    return InertiaTensor.solidSphere(this.mass, this.radius);
  }
}
