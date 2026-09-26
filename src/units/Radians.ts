import { Quantity } from "./Quantity";
import { Degrees } from "./Degrees";

/**
 * An angle in radians (rad). The only angle unit used inside the core.
 * Trigonometry lives here so equations can write `pitch.sin()`.
 */
export class Radians extends Quantity {
  readonly unit = "rad";

  sin(): number {
    return Math.sin(this.value);
  }

  cos(): number {
    return Math.cos(this.value);
  }

  tan(): number {
    return Math.tan(this.value);
  }

  toDegrees(): Degrees {
    return new Degrees((this.value * 180) / Math.PI);
  }
}
