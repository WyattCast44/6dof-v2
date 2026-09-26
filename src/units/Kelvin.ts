import { Quantity } from "./Quantity";
import { Celsius } from "./Celsius";

/** Absolute temperature in kelvin (K). The only temperature used inside the core. */
export class Kelvin extends Quantity {
  readonly unit = "K";

  toCelsius(): Celsius {
    return new Celsius(this.value - Celsius.KELVIN_AT_ZERO_CELSIUS);
  }
}
