import type { AtmosphereModel } from "./atmosphere/AtmosphereModel";
import { ConstantAtmosphere } from "./atmosphere/ConstantAtmosphere";
import { ConstantGravity } from "./gravity/ConstantGravity";
import type { GravityModel } from "./gravity/GravityModel";
import { NoWind } from "./wind/NoWind";
import type { WindModel } from "./wind/WindModel";

/**
 * The world the body flies through, bundled into one object so the dynamics
 * model takes a single `environment` argument.
 *
 * Each part is a swappable model family:
 *
 * | Part       | Simplest (the default)  | Richer                   |
 * | ---------- | ----------------------- | ------------------------ |
 * | gravity    | ConstantGravity         | (WGS84, later)           |
 * | atmosphere | ConstantAtmosphere      | StandardAtmosphere1976   |
 * | wind       | NoWind                  | ConstantWind             |
 */
export class Environment {
  readonly gravity: GravityModel;
  readonly atmosphere: AtmosphereModel;
  readonly wind: WindModel;

  /** Anything you leave out uses the simplest model. */
  constructor(
    models: { gravity?: GravityModel; atmosphere?: AtmosphereModel; wind?: WindModel } = {},
  ) {
    this.gravity = models.gravity ?? new ConstantGravity();
    this.atmosphere = models.atmosphere ?? new ConstantAtmosphere();
    this.wind = models.wind ?? new NoWind();
  }
}
