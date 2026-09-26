import type { Meters } from "../../units";
import type { AtmosphereConditions } from "./AtmosphereConditions";

/**
 * "Given an altitude, what are the density, pressure and temperature?"
 *
 * Implementations range from the same air everywhere (`ConstantAtmosphere`)
 * to the layered U.S. Standard Atmosphere 1976.
 */
export interface AtmosphereModel {
  /** Conditions at a geometric altitude above mean sea level. */
  conditionsAt(altitude: Meters): AtmosphereConditions;
}
