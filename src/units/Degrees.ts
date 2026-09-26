import { Quantity } from "./Quantity";
import { Radians } from "./Radians";

/**
 * An angle in degrees (°). An edge unit: convert to `Radians` before handing
 * it to the core.
 */
export class Degrees extends Quantity {
  readonly unit = "°";

  toRadians(): Radians {
    return new Radians((this.value * Math.PI) / 180);
  }
}
