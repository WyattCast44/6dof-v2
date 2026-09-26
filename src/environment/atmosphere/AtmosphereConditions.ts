import { Kelvin, KilogramsPerCubicMeter, MetersPerSecond, Pascals } from "../../units";

/**
 * The state of the air at one point: temperature, pressure, density and the
 * speed of sound.
 */
export class AtmosphereConditions {
  /** Specific gas constant of dry air, R = R* ÷ M₀ (U.S. Standard Atmosphere 1976). */
  static readonly GAS_CONSTANT = 287.05287; // J/(kg·K)

  /** Ratio of specific heats for air, γ. */
  static readonly HEAT_CAPACITY_RATIO = 1.4;

  constructor(
    public readonly temperature: Kelvin,
    public readonly pressure: Pascals,
    public readonly density: KilogramsPerCubicMeter,
    public readonly speedOfSound: MetersPerSecond,
  ) {}

  /**
   * Fill in density and speed of sound from temperature and pressure, using
   * the ideal gas law and the speed of sound in an ideal gas:
   *
   * ```
   * ρ = P / (R·T)
   * a = √(γ·R·T)
   * ```
   *
   * (Division by a gas constant and square roots are outside the unit algebra,
   * so this works on SI numbers and labels the results.)
   */
  static fromTemperatureAndPressure(temperature: Kelvin, pressure: Pascals): AtmosphereConditions {
    const R = AtmosphereConditions.GAS_CONSTANT;
    const γ = AtmosphereConditions.HEAT_CAPACITY_RATIO;
    const T = temperature.value;
    return new AtmosphereConditions(
      temperature,
      pressure,
      new KilogramsPerCubicMeter(pressure.value / (R * T)),
      new MetersPerSecond(Math.sqrt(γ * R * T)),
    );
  }

  /** Standard sea-level air: 15 °C, 101,325 Pa, 1.225 kg/m³. */
  static standardSeaLevel(): AtmosphereConditions {
    return AtmosphereConditions.fromTemperatureAndPressure(new Kelvin(288.15), new Pascals(101325));
  }
}
