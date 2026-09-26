import { Quantity } from "./Quantity";
import { Pounds } from "./Pounds";

/** Mass in kilograms (kg). The SI unit of mass. */
export class Kilograms extends Quantity {
  readonly unit = "kg";

  toPounds(): Pounds {
    return new Pounds(this.value / Pounds.KILOGRAMS_PER_POUND);
  }
}
