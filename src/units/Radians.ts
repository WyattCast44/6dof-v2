import { Quantity } from "./Quantity";
import { Degrees } from "./Degrees";

/**
 * An angle in radians (rad). The only angle unit used inside the core.
 * Trigonometry lives here so equations can write `pitch.sin()`.
 */
export class Radians extends Quantity {
  readonly unit = "rad";

  /**
   * The angle of the point (x, y), measured from the +x axis, in (−π, π].
   * Both legs must share a unit, e.g. α = atan2(w, u).
   */
  static atan2<Q extends Quantity>(y: Q, x: Q): Radians {
    return new Radians(Math.atan2(y.value, x.value));
  }

  /** The angle whose sine is `ratio` (a plain number in [−1, 1]). */
  static asin(ratio: number): Radians {
    return new Radians(Math.asin(Math.max(-1, Math.min(1, ratio))));
  }

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
