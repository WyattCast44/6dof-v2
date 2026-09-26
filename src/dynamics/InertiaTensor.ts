import {
  KilogramMetersSquared,
  KilogramMetersSquaredPerSecond,
  Kilograms,
  Meters,
  NewtonMeters,
  RadiansPerSecond,
  RadiansPerSecondSquared,
} from "../units";
import { BodyVector } from "../vectors";

/**
 * The body's moment of inertia about its center of gravity, in body axes.
 *
 * Aircraft are symmetric left-to-right, so Ixy = Iyz = 0 and only four
 * numbers are needed:
 *
 * ```
 *     ⎡  Ixx    0   −Ixz ⎤
 * I = ⎢   0    Iyy    0  ⎥
 *     ⎣ −Ixz    0    Izz ⎦
 * ```
 *
 * Sign convention: Ixz = ∫ x·z dm, as in Stevens, Lewis & Johnson.
 */
export class InertiaTensor {
  constructor(
    public readonly Ixx: KilogramMetersSquared,
    public readonly Iyy: KilogramMetersSquared,
    public readonly Izz: KilogramMetersSquared,
    public readonly Ixz: KilogramMetersSquared = new KilogramMetersSquared(0),
  ) {}

  /** A solid sphere of uniform density: I = (2/5)·m·r² about every axis. */
  static solidSphere(mass: Kilograms, radius: Meters): InertiaTensor {
    const I = new KilogramMetersSquared(0.4 * mass.value * radius.value * radius.value);
    return new InertiaTensor(I, I, I);
  }

  /** Angular momentum H = I·ω. */
  times(ω: BodyVector<RadiansPerSecond>): BodyVector<KilogramMetersSquaredPerSecond> {
    const { Ixx, Iyy, Izz, Ixz } = this;
    return new BodyVector(
      Ixx.times(ω.x).subtract(Ixz.times(ω.z)),
      Iyy.times(ω.y),
      Izz.times(ω.z).subtract(Ixz.times(ω.x)),
    );
  }

  /**
   * Solve I·ω̇ = M for ω̇: the angular acceleration a net moment produces.
   *
   * With Ixz ≠ 0, roll and yaw are coupled, so the x-z block is inverted:
   *
   * ```
   * Γ = Ixx·Izz − Ixz²
   * ṗ = (Izz·L + Ixz·N) / Γ
   * q̇ = M / Iyy
   * ṙ = (Ixz·L + Ixx·N) / Γ
   * ```
   *
   * (L, M, N are the roll, pitch and yaw moments.) This is a matrix solve,
   * so it works on the raw numbers; the result is labeled rad/s².
   */
  solve(moment: BodyVector<NewtonMeters>): BodyVector<RadiansPerSecondSquared> {
    const Ixx = this.Ixx.value, Iyy = this.Iyy.value, Izz = this.Izz.value, Ixz = this.Ixz.value;
    const L = moment.x.value, M = moment.y.value, N = moment.z.value;
    const Γ = Ixx * Izz - Ixz * Ixz;
    return new BodyVector(
      new RadiansPerSecondSquared((Izz * L + Ixz * N) / Γ),
      new RadiansPerSecondSquared(M / Iyy),
      new RadiansPerSecondSquared((Ixz * L + Ixx * N) / Γ),
    );
  }
}
