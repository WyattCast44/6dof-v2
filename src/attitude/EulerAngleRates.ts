import type { RadiansPerSecond } from "../units";

/**
 * How fast each Euler angle is changing: (φ̇, θ̇, ψ̇).
 *
 * These are not the body rates (p, q, r). Get them from body rates with
 * `EulerAngles.ratesFrom(...)`.
 */
export class EulerAngleRates {
  constructor(
    public readonly rollRate: RadiansPerSecond,
    public readonly pitchRate: RadiansPerSecond,
    public readonly yawRate: RadiansPerSecond,
  ) {}

  add(other: EulerAngleRates): EulerAngleRates {
    return new EulerAngleRates(
      this.rollRate.add(other.rollRate),
      this.pitchRate.add(other.pitchRate),
      this.yawRate.add(other.yawRate),
    );
  }

  scale(factor: number): EulerAngleRates {
    return new EulerAngleRates(
      this.rollRate.scale(factor),
      this.pitchRate.scale(factor),
      this.yawRate.scale(factor),
    );
  }
}
