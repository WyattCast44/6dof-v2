import { Quantity } from "./Quantity";

/** Angular rate in radians per second (rad/s). Body rates p, q, r use this. */
export class RadiansPerSecond extends Quantity {
  readonly unit = "rad/s";
}
