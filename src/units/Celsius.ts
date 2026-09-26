import { Quantity } from "./Quantity";
import { Kelvin } from "./Kelvin";

/**
 * Temperature in degrees Celsius (°C). An edge unit: convert to `Kelvin`
 * before handing it to the core (gas laws need absolute temperature).
 */
export class Celsius extends Quantity {
  readonly unit = "°C";

  static readonly KELVIN_AT_ZERO_CELSIUS = 273.15;

  toKelvin(): Kelvin {
    return new Kelvin(this.value + Celsius.KELVIN_AT_ZERO_CELSIUS);
  }
}
