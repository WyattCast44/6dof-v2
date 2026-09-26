import { Quantity } from "./Quantity";

/** Pressure in pascals (Pa = N/m²). Static pressure and dynamic pressure both use this. */
export class Pascals extends Quantity {
  readonly unit = "Pa";
}
