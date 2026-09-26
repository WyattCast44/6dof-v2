import { Kelvin, Meters, Pascals } from "../../units";
import { AtmosphereConditions } from "./AtmosphereConditions";
import type { AtmosphereModel } from "./AtmosphereModel";

/** One layer of the standard atmosphere, in which temperature varies linearly. */
interface Layer {
  /** Geopotential altitude where the layer starts, H_b (m'). */
  readonly baseGeopotentialAltitude: number;
  /** Temperature at the base, T_b (K). */
  readonly baseTemperature: number;
  /** Temperature lapse rate, L_b (K/m'). Zero for isothermal layers. */
  readonly lapseRate: number;
  /** Pressure at the base, P_b (Pa). */
  readonly basePressure: number;
}

/**
 * The U.S. Standard Atmosphere, 1976, from 5 km below sea level to 86 km.
 *
 * The lower atmosphere is modeled as seven layers. In each, temperature
 * changes linearly with geopotential altitude, and pressure follows from
 * hydrostatic balance:
 *
 * ```
 * T = T_b + L_b·(H − H_b)
 * P = P_b · (T_b / T)^(g₀ / (R·L_b))       when L_b ≠ 0
 * P = P_b · exp(−g₀·(H − H_b) / (R·T_b))    when L_b = 0
 * ```
 *
 * Density and speed of sound then come from the ideal gas law (see
 * `AtmosphereConditions.fromTemperatureAndPressure`).
 *
 * Geopotential altitude H is the altitude that would give the same
 * potential energy if gravity were constant (g₀). It is slightly less than
 * geometric altitude z:  H = r₀·z / (r₀ + z).
 *
 * The standard defines g₀ as a fixed constant, so this model deliberately
 * does not use the simulation's gravity model.
 *
 * Source: U.S. Standard Atmosphere, 1976 (NOAA-S/T 76-1562), Part 1.
 * TODO(citation): add the exact equation numbers.
 */
export class StandardAtmosphere1976 implements AtmosphereModel {
  /** Standard gravity, g₀ (m/s²). */
  static readonly G0 = 9.80665;
  /** Effective Earth radius used for geopotential altitude, r₀ (m). */
  static readonly EARTH_RADIUS = 6356766;
  /** Lowest and highest geometric altitudes the model covers (m). */
  static readonly MIN_ALTITUDE = new Meters(-5000);
  static readonly MAX_ALTITUDE = new Meters(86000);

  private static readonly LAYERS: readonly Layer[] = [
    { baseGeopotentialAltitude: 0, baseTemperature: 288.15, lapseRate: -0.0065, basePressure: 101325 }, // troposphere
    { baseGeopotentialAltitude: 11000, baseTemperature: 216.65, lapseRate: 0, basePressure: 22632.06 }, // tropopause
    { baseGeopotentialAltitude: 20000, baseTemperature: 216.65, lapseRate: 0.001, basePressure: 5474.889 }, // stratosphere
    { baseGeopotentialAltitude: 32000, baseTemperature: 228.65, lapseRate: 0.0028, basePressure: 868.0187 },
    { baseGeopotentialAltitude: 47000, baseTemperature: 270.65, lapseRate: 0, basePressure: 110.9063 }, // stratopause
    { baseGeopotentialAltitude: 51000, baseTemperature: 270.65, lapseRate: -0.0028, basePressure: 66.93887 }, // mesosphere
    { baseGeopotentialAltitude: 71000, baseTemperature: 214.65, lapseRate: -0.002, basePressure: 3.956420 },
  ];

  conditionsAt(altitude: Meters): AtmosphereConditions {
    const { MIN_ALTITUDE, MAX_ALTITUDE } = StandardAtmosphere1976;
    if (altitude.lessThan(MIN_ALTITUDE) || altitude.greaterThan(MAX_ALTITUDE)) {
      throw new RangeError(
        `${altitude} is outside the U.S. Standard Atmosphere 1976 (${MIN_ALTITUDE} to ${MAX_ALTITUDE}).`,
      );
    }

    const H = StandardAtmosphere1976.geopotentialAltitude(altitude).value;
    const layer = StandardAtmosphere1976.layerAt(H);
    const R = AtmosphereConditions.GAS_CONSTANT;
    const g0 = StandardAtmosphere1976.G0;
    const Tb = layer.baseTemperature, Lb = layer.lapseRate, Pb = layer.basePressure;
    const ΔH = H - layer.baseGeopotentialAltitude;

    const T = Tb + Lb * ΔH;
    const P = Lb === 0
      ? Pb * Math.exp((-g0 * ΔH) / (R * Tb))
      : Pb * Math.pow(Tb / T, g0 / (R * Lb));

    return AtmosphereConditions.fromTemperatureAndPressure(new Kelvin(T), new Pascals(P));
  }

  /** H = r₀·z / (r₀ + z) */
  static geopotentialAltitude(geometricAltitude: Meters): Meters {
    const r0 = StandardAtmosphere1976.EARTH_RADIUS;
    const z = geometricAltitude.value;
    return new Meters((r0 * z) / (r0 + z));
  }

  /** The highest layer whose base is at or below H (the first layer below sea level). */
  private static layerAt(geopotentialAltitude: number): Layer {
    const layers = StandardAtmosphere1976.LAYERS;
    for (let i = layers.length - 1; i > 0; i--) {
      if (geopotentialAltitude >= layers[i]!.baseGeopotentialAltitude) return layers[i]!;
    }
    return layers[0]!;
  }
}
