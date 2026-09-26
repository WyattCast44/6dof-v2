import { Quantity } from "./Quantity";
import { MetersPerSecond } from "./MetersPerSecond";

/** A speed squared (m²/s²), as in the V² of dynamic pressure ½ρV². */
export class MetersSquaredPerSecondSquared extends Quantity {
  readonly unit = "m²/s²";

  /** The speed whose square this is: √(V²) = V. */
  sqrt(): MetersPerSecond {
    return new MetersPerSecond(Math.sqrt(this.value));
  }
}
