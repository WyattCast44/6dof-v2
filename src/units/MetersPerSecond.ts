import { Quantity } from "./Quantity";
import { Knots } from "./Knots";

/** Speed in meters per second (m/s). The SI unit of speed. */
export class MetersPerSecond extends Quantity {
  readonly unit = "m/s";

  toKnots(): Knots {
    return new Knots(this.value / Knots.METERS_PER_SECOND_PER_KNOT);
  }
}
