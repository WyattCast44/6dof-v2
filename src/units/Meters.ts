import { Quantity } from "./Quantity";
import { Feet } from "./Feet";

/** Length in meters (m). The SI unit of length, and the only length used inside the core. */
export class Meters extends Quantity {
  readonly unit = "m";

  toFeet(): Feet {
    return new Feet(this.value / Feet.METERS_PER_FOOT);
  }
}
