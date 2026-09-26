import { Quantity } from "./Quantity";
import { MetersPerSecond } from "./MetersPerSecond";

/**
 * Speed in knots (kt): nautical miles per hour. An edge unit: convert to
 * `MetersPerSecond` before handing it to the core.
 */
export class Knots extends Quantity {
  readonly unit = "kt";

  /** 1 kt = 1852 m / 3600 s (exact). */
  static readonly METERS_PER_SECOND_PER_KNOT = 1852 / 3600;

  toMetersPerSecond(): MetersPerSecond {
    return new MetersPerSecond(this.value * Knots.METERS_PER_SECOND_PER_KNOT);
  }
}
