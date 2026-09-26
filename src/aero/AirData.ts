import type { AtmosphereConditions, Environment } from "../environment";
import type { RigidBodyState } from "../state";
import { MetersPerSecond, Pascals, Radians, type Seconds } from "../units";
import type { BodyVector, NedVector } from "../vectors";

/**
 * How the air is flowing past the body. Step 1 of every dynamics pipeline
 * that has aerodynamics: the aero model only ever sees air data, never the
 * raw state.
 *
 * The key idea: aerodynamic forces depend on velocity relative to the
 * *air*, not the ground. With wind, the two differ:
 *
 * ```
 * v_air = v_ground − wind      (both in body axes)
 * ```
 */
export class AirData {
  constructor(
    /** Temperature, pressure, density and speed of sound where the body is. */
    public readonly atmosphere: AtmosphereConditions,
    /** The wind at the body, in NED (velocity of the air over the ground). */
    public readonly windNed: NedVector<MetersPerSecond>,
    /** Velocity of the body relative to the air, in body axes. */
    public readonly velocityAirBody: BodyVector<MetersPerSecond>,
    /** True airspeed, V = |v_air|. */
    public readonly airspeed: MetersPerSecond,
    /** Angle of attack α: how far the airflow comes from below the nose. */
    public readonly angleOfAttack: Radians,
    /** Sideslip angle β: how far the airflow comes from the right. */
    public readonly sideslip: Radians,
    /** Dynamic pressure q̄ = ½·ρ·V². Aero forces scale with this. */
    public readonly dynamicPressure: Pascals,
  ) {}

  /**
   * Work out the air data for a body in an environment at a given time.
   *
   * ```
   * v_air = (u, v, w)_air = v_body − C_n→b · wind_ned
   * V     = |v_air|
   * α     = atan2(w, u)
   * β     = asin(v / V)
   * q̄     = ½·ρ·V²
   * ```
   *
   * Source: Stevens, Lewis & Johnson, "Aircraft Control and Simulation",
   * 3rd ed. (2016), Ch. 2, definitions of α and β.
   * TODO(citation): add the exact equation numbers.
   */
  static from(state: RigidBodyState, environment: Environment, time: Seconds): AirData {
    const atmosphere = environment.atmosphere.conditionsAt(state.altitude);
    const windNed = environment.wind.windAt(state.positionNed, time);

    const velocityAirBody = state.velocityBody.subtract(state.attitude.nedToBody(windNed));
    const airspeed = velocityAirBody.magnitude();
    const u = velocityAirBody.x, v = velocityAirBody.y, w = velocityAirBody.z;

    const angleOfAttack = Radians.atan2(w, u);
    const sideslip = airspeed.value === 0 ? new Radians(0) : Radians.asin(v.ratioTo(airspeed));
    const dynamicPressure = atmosphere.density.times(airspeed.times(airspeed)).scale(0.5);

    return new AirData(atmosphere, windNed, velocityAirBody, airspeed, angleOfAttack, sideslip, dynamicPressure);
  }

  /** Mach number, V / a (a plain number). */
  get mach(): number {
    return this.airspeed.ratioTo(this.atmosphere.speedOfSound);
  }
}
