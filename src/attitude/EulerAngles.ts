import { Radians, RadiansPerSecond, Seconds, type Quantity } from "../units";
import { BodyVector, NedVector } from "../vectors";
import { EulerAngleRates } from "./EulerAngleRates";

/**
 * The body's orientation relative to NED, as a 3-2-1 (yaw, pitch, roll)
 * Euler angle sequence:
 * - yaw ψ:   rotate about down (heading; 0 = north, +π/2 = east)
 * - pitch θ: then about the new y axis (nose up is positive)
 * - roll φ:  then about the new x axis (right wing down is positive)
 *
 * Euler angles are the easiest attitude to read, but they have a singularity
 * ("gimbal lock") at θ = ±90°, where yaw and roll become the same motion and
 * the kinematic equations divide by cos θ = 0. See `ratesFrom`.
 */
export class EulerAngles {
  constructor(
    /** φ, rotation about the body x axis. */
    public readonly roll: Radians,
    /** θ, rotation about the body y axis. */
    public readonly pitch: Radians,
    /** ψ, rotation about the NED down axis. */
    public readonly yaw: Radians,
  ) {}

  /** Wings level, nose on the horizon, pointing north. */
  static level(): EulerAngles {
    return new EulerAngles(new Radians(0), new Radians(0), new Radians(0));
  }

  /**
   * Rotate a vector from the body frame into NED.
   *
   * v_ned = C_b→n · v_body, where C_b→n is the transpose of the NED→body
   * matrix in `nedToBody`.
   */
  bodyToNed<Q extends Quantity>(v: BodyVector<Q>): NedVector<Q> {
    const c = this.nedToBodyMatrix();
    // Transpose: walk down the columns of the NED→body matrix.
    return new NedVector(
      combine(v.x, c[0][0], v.y, c[1][0], v.z, c[2][0]),
      combine(v.x, c[0][1], v.y, c[1][1], v.z, c[2][1]),
      combine(v.x, c[0][2], v.y, c[1][2], v.z, c[2][2]),
    );
  }

  /**
   * Rotate a vector from NED into the body frame.
   *
   * v_body = C_n→b · v_ned. For example, gravity (0, 0, g) in NED becomes
   * (−g·sinθ, g·sinφ·cosθ, g·cosφ·cosθ) in the body frame.
   */
  nedToBody<Q extends Quantity>(v: NedVector<Q>): BodyVector<Q> {
    const c = this.nedToBodyMatrix();
    return new BodyVector(
      combine(v.north, c[0][0], v.east, c[0][1], v.down, c[0][2]),
      combine(v.north, c[1][0], v.east, c[1][1], v.down, c[1][2]),
      combine(v.north, c[2][0], v.east, c[2][1], v.down, c[2][2]),
    );
  }

  /**
   * The direction cosine matrix C_n→b for a 3-2-1 rotation.
   *
   * Source: Beard & McLain, "Small Unmanned Aircraft: Theory and Practice"
   * (2012), Ch. 2, rotation from vehicle frame to body frame.
   * TODO(citation): add the exact equation number.
   *
   * ```
   * ⎡ cθcψ              cθsψ              −sθ   ⎤
   * ⎢ sφsθcψ − cφsψ     sφsθsψ + cφcψ     sφcθ  ⎥
   * ⎣ cφsθcψ + sφsψ     cφsθsψ − sφcψ     cφcθ  ⎦
   * ```
   *
   * Note: v1 used this matrix as body→NED. It is NED→body.
   */
  nedToBodyMatrix(): RotationMatrix {
    const sφ = this.roll.sin(), cφ = this.roll.cos();
    const sθ = this.pitch.sin(), cθ = this.pitch.cos();
    const sψ = this.yaw.sin(), cψ = this.yaw.cos();
    return [
      [cθ * cψ, cθ * sψ, -sθ],
      [sφ * sθ * cψ - cφ * sψ, sφ * sθ * sψ + cφ * cψ, sφ * cθ],
      [cφ * sθ * cψ + sφ * sψ, cφ * sθ * sψ - sφ * cψ, cφ * cθ],
    ];
  }

  /**
   * Euler kinematic equations: how fast the Euler angles change, given the
   * body angular rates (p, q, r). The angle rates are NOT simply p, q, r.
   *
   * Source: Beard & McLain (2012), Ch. 3, rotational kinematics.
   * TODO(citation): add the exact equation number.
   *
   * ```
   * φ̇ = p + (q·sinφ + r·cosφ)·tanθ
   * θ̇ = q·cosφ − r·sinφ
   * ψ̇ = (q·sinφ + r·cosφ) / cosθ
   * ```
   *
   * Singular at θ = ±90° (cosθ = 0): tanθ and 1/cosθ blow up. A quaternion
   * attitude avoids this and is a candidate for a later rung.
   */
  ratesFrom(angularRates: BodyVector<RadiansPerSecond>): EulerAngleRates {
    const p = angularRates.x, q = angularRates.y, r = angularRates.z;
    const φ = this.roll, θ = this.pitch;

    const qSinφ_plus_rCosφ = q.scale(φ.sin()).add(r.scale(φ.cos()));

    const rollRate = p.add(qSinφ_plus_rCosφ.scale(θ.tan()));
    const pitchRate = q.scale(φ.cos()).subtract(r.scale(φ.sin()));
    const yawRate = qSinφ_plus_rCosφ.scale(1 / θ.cos());

    return new EulerAngleRates(rollRate, pitchRate, yawRate);
  }

  /** The attitude after changing at `rates` for `dt`. Used by integrators. */
  advance(rates: EulerAngleRates, dt: Seconds): EulerAngles {
    return new EulerAngles(
      this.roll.add(rates.rollRate.times(dt)),
      this.pitch.add(rates.pitchRate.times(dt)),
      this.yaw.add(rates.yawRate.times(dt)),
    );
  }

  toString(): string {
    const deg = (a: Radians) => a.toDegrees().value.toFixed(2);
    return `φ=${deg(this.roll)}° θ=${deg(this.pitch)}° ψ=${deg(this.yaw)}°`;
  }
}

/** A 3×3 matrix of plain numbers, row by row. */
export type RotationMatrix = readonly [
  readonly [number, number, number],
  readonly [number, number, number],
  readonly [number, number, number],
];

/** a·ka + b·kb + c·kc, keeping the unit of a, b and c. */
function combine<Q extends Quantity>(a: Q, ka: number, b: Q, kb: number, c: Q, kc: number): Q {
  return a.scale(ka).add(b.scale(kb)).add(c.scale(kc));
}
