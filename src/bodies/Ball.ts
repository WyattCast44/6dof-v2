import { InertiaTensor } from "../dynamics";
import type { Kilograms, Meters } from "../units";

/**
 * A solid ball: the simplest body in the learning ladder.
 *
 * Like every body, a Ball only describes itself. It never stores position,
 * velocity or time; those live in the state.
 */
export class Ball {
  constructor(
    public readonly mass: Kilograms,
    public readonly radius: Meters,
  ) {}

  /** A uniform solid sphere: I = (2/5)·m·r² about every axis. */
  get inertia(): InertiaTensor {
    return InertiaTensor.solidSphere(this.mass, this.radius);
  }
}
