import { Quantity } from "./Quantity";
import { Meters } from "./Meters";

/**
 * Length in feet (ft). An edge unit: convert to `Meters` before handing it
 * to the core.
 */
export class Feet extends Quantity {
  readonly unit = "ft";

  /** Exact, by international agreement (1959). */
  static readonly METERS_PER_FOOT = 0.3048;

  toMeters(): Meters {
    return new Meters(this.value * Feet.METERS_PER_FOOT);
  }
}
