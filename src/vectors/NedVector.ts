import { Quantity, type Product, type Quotient, type QuantityClass } from "../units";
import { Vector3 } from "./Vector3";

/**
 * A vector in the North-East-Down (NED) frame.
 *
 * NED is the inertial frame of this simulator (a flat, non-rotating Earth):
 * - north: toward true north
 * - east:  toward east
 * - down:  toward the center of the Earth (so altitude is `-down`)
 *
 * The type parameter is the unit of each component:
 * `NedVector<Meters>` is a position, `NedVector<MetersPerSecond>` a velocity.
 */
export class NedVector<Q extends Quantity> extends Vector3<Q> {
  readonly frame = "NED";

  constructor(north: Q, east: Q, down: Q) {
    super([north, east, down]);
  }

  /** A zero vector in the given unit, e.g. `NedVector.zero(Meters)`. */
  static zero<Q extends Quantity>(unit: QuantityClass<Q>): NedVector<Q> {
    return NedVector.from(Vector3.zeroComponents(unit));
  }

  get north(): Q {
    return this.components[0];
  }

  get east(): Q {
    return this.components[1];
  }

  get down(): Q {
    return this.components[2];
  }

  add(other: NedVector<Q>): NedVector<Q> {
    return NedVector.from(Vector3.addComponents(this.components, other.components));
  }

  subtract(other: NedVector<Q>): NedVector<Q> {
    return NedVector.from(Vector3.subtractComponents(this.components, other.components));
  }

  /** The same vector pointing the opposite way. */
  negate(): NedVector<Q> {
    return this.scale(-1);
  }

  /**
   * A vector pointing the same way as this one, with length `magnitude`.
   *
   * @example velocityAirBody.withMagnitude(drag).negate() // drag opposes the airflow
   */
  withMagnitude<R extends Quantity>(magnitude: R): NedVector<R> {
    return NedVector.from(Vector3.withMagnitudeComponents(this.components, magnitude));
  }

  /** Multiply by a plain (unitless) number. */
  scale(factor: number): NedVector<Q> {
    return NedVector.from(Vector3.scaleComponents(this.components, factor));
  }

  /** Multiply every component by a quantity, e.g. velocity × time = displacement. */
  times<S extends Quantity>(scalar: S): NedVector<Product<Q, S>> {
    return NedVector.from(Vector3.timesComponents(this.components, scalar));
  }

  /** Divide every component by a quantity, e.g. force ÷ mass = acceleration. */
  divide<S extends Quantity>(scalar: S): NedVector<Quotient<Q, S>> {
    return NedVector.from(Vector3.divideComponents(this.components, scalar));
  }

  dot<R extends Quantity>(other: NedVector<R>): Product<Q, R> {
    return Vector3.dotComponents(this.components, other.components);
  }

  cross<R extends Quantity>(other: NedVector<R>): NedVector<Product<Q, R>> {
    return NedVector.from(Vector3.crossComponents(this.components, other.components));
  }

  private static from<Q extends Quantity>([north, east, down]: readonly [Q, Q, Q]): NedVector<Q> {
    return new NedVector(north, east, down);
  }
}
