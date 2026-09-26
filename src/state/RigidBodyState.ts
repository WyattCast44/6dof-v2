import { EulerAngleRates, EulerAngles } from "../attitude";
import {
  Meters,
  MetersPerSecond,
  MetersPerSecondSquared,
  RadiansPerSecond,
  RadiansPerSecondSquared,
  Seconds,
} from "../units";
import { BodyVector, NedVector } from "../vectors";

/**
 * The classic 12 rigid-body state variables, grouped into four vectors.
 *
 * | Group            | Frame | Components       | Unit  |
 * | ---------------- | ----- | ---------------- | ----- |
 * | positionNed      | NED   | north, east, down| m     |
 * | velocityBody     | Body  | u, v, w          | m/s   |
 * | attitude         | —     | φ, θ, ψ          | rad   |
 * | angularRatesBody | Body  | p, q, r          | rad/s |
 *
 * Immutable: `advance` returns a new state.
 */
export class RigidBodyState {
  readonly positionNed: NedVector<Meters>;
  readonly velocityBody: BodyVector<MetersPerSecond>;
  readonly attitude: EulerAngles;
  readonly angularRatesBody: BodyVector<RadiansPerSecond>;

  /**
   * Anything you leave out starts at zero (at rest, level, facing north,
   * at the NED origin).
   */
  constructor(init: {
    positionNed?: NedVector<Meters>;
    velocityBody?: BodyVector<MetersPerSecond>;
    attitude?: EulerAngles;
    angularRatesBody?: BodyVector<RadiansPerSecond>;
  } = {}) {
    this.positionNed = init.positionNed ?? NedVector.zero(Meters);
    this.velocityBody = init.velocityBody ?? BodyVector.zero(MetersPerSecond);
    this.attitude = init.attitude ?? EulerAngles.level();
    this.angularRatesBody = init.angularRatesBody ?? BodyVector.zero(RadiansPerSecond);
  }

  /** Height above the NED origin: −down. */
  get altitude(): Meters {
    return this.positionNed.down.negate();
  }

  /** Speed relative to the ground (not the air): |v|. */
  get groundSpeed(): MetersPerSecond {
    return this.velocityBody.magnitude();
  }

  /** Velocity expressed in NED. */
  get velocityNed(): NedVector<MetersPerSecond> {
    return this.attitude.bodyToNed(this.velocityBody);
  }

  /** x + ẋ·dt for every group. Integrators call this. */
  advance(rates: RigidBodyRates, dt: Seconds): RigidBodyState {
    return new RigidBodyState({
      positionNed: this.positionNed.add(rates.positionRateNed.times(dt)),
      velocityBody: this.velocityBody.add(rates.accelerationBody.times(dt)),
      attitude: this.attitude.advance(rates.attitudeRate, dt),
      angularRatesBody: this.angularRatesBody.add(rates.angularAccelerationBody.times(dt)),
    });
  }
}

/**
 * The time derivative of a `RigidBodyState`: what the dynamics model returns.
 * Each field has the unit of its state field divided by seconds.
 */
export class RigidBodyRates {
  constructor(
    /** ṗ_ned: velocity in NED. */
    public readonly positionRateNed: NedVector<MetersPerSecond>,
    /** v̇_body: (u̇, v̇, ẇ). */
    public readonly accelerationBody: BodyVector<MetersPerSecondSquared>,
    /** (φ̇, θ̇, ψ̇). */
    public readonly attitudeRate: EulerAngleRates,
    /** ω̇_body: (ṗ, q̇, ṙ). */
    public readonly angularAccelerationBody: BodyVector<RadiansPerSecondSquared>,
  ) {}

  add(other: RigidBodyRates): RigidBodyRates {
    return new RigidBodyRates(
      this.positionRateNed.add(other.positionRateNed),
      this.accelerationBody.add(other.accelerationBody),
      this.attitudeRate.add(other.attitudeRate),
      this.angularAccelerationBody.add(other.angularAccelerationBody),
    );
  }

  scale(factor: number): RigidBodyRates {
    return new RigidBodyRates(
      this.positionRateNed.scale(factor),
      this.accelerationBody.scale(factor),
      this.attitudeRate.scale(factor),
      this.angularAccelerationBody.scale(factor),
    );
  }
}
