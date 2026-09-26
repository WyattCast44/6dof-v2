import { Quantity } from "./Quantity";
import { Kilograms } from "./Kilograms";

/**
 * Mass in pounds (lb, avoirdupois pound-mass). An edge unit: convert to
 * `Kilograms` before handing it to the core. Not to be confused with
 * pound-force, which is a force.
 */
export class Pounds extends Quantity {
  readonly unit = "lb";

  /** Exact, by international agreement (1959). */
  static readonly KILOGRAMS_PER_POUND = 0.45359237;

  toKilograms(): Kilograms {
    return new Kilograms(this.value * Pounds.KILOGRAMS_PER_POUND);
  }
}
