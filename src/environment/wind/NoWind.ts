import { Meters, MetersPerSecond, Seconds } from "../../units";
import { NedVector } from "../../vectors";
import type { WindModel } from "./WindModel";

/** Still air everywhere: airspeed equals ground speed. */
export class NoWind implements WindModel {
  windAt(_positionNed: NedVector<Meters>, _time: Seconds): NedVector<MetersPerSecond> {
    return NedVector.zero(MetersPerSecond);
  }
}
