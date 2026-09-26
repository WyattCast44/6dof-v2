import { ConstantGravity } from "./gravity/ConstantGravity";
import type { GravityModel } from "./gravity/GravityModel";

/**
 * The world the body flies through, bundled into one object so the dynamics
 * model takes a single `environment` argument.
 *
 * Each part is a swappable model family. Atmosphere and wind join in the
 * next rung (ball with drag).
 */
export class Environment {
  readonly gravity: GravityModel;

  /** Anything you leave out uses the simplest model. */
  constructor(models: { gravity?: GravityModel } = {}) {
    this.gravity = models.gravity ?? new ConstantGravity();
  }
}
