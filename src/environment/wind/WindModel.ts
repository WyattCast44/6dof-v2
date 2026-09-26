import type { Meters, MetersPerSecond, Seconds } from "../../units";
import type { NedVector } from "../../vectors";

/**
 * "Given a position and time, what is the wind vector?"
 *
 * The wind vector is the velocity of the air relative to the ground, in NED:
 * the direction the air is moving *toward*. (Weather reports give the
 * direction wind blows *from*; `ConstantWind.fromDirection` converts.)
 */
export interface WindModel {
  windAt(positionNed: NedVector<Meters>, time: Seconds): NedVector<MetersPerSecond>;
}
