import type { Meters, MetersPerSecondSquared } from "../../units";
import type { NedVector } from "../../vectors";

/**
 * "Given a position, what is the gravity vector?"
 *
 * Implementations range from a constant 9.80665 m/s² straight down to a
 * WGS84 model that varies with altitude and latitude.
 */
export interface GravityModel {
  gravityAt(positionNed: NedVector<Meters>): NedVector<MetersPerSecondSquared>;
}
