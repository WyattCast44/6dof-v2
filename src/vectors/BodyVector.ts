import { Quantity, type Product, type Quotient, type QuantityClass } from "../units";
import { Vector3 } from "./Vector3";

/**
 * A vector in the body frame: axes fixed to the vehicle, origin at its
 * center of gravity.
 * - x: out the nose (forward)
 * - y: out the right wing
 * - z: out the belly (down)
 *
 * The type parameter is the unit of each component:
 * `BodyVector<MetersPerSecond>` holds the textbook (u, v, w),
 * `BodyVector<RadiansPerSecond>` holds (p, q, r).
 */
export class BodyVector<Q extends Quantity> extends Vector3<Q> {
  readonly frame = "Body";

  constructor(x: Q, y: Q, z: Q) {
    super([x, y, z]);
  }

  /** A zero vector in the given unit, e.g. `BodyVector.zero(Newtons)`. */
  static zero<Q extends Quantity>(unit: QuantityClass<Q>): BodyVector<Q> {
    return BodyVector.from(Vector3.zeroComponents(unit));
  }

  /** Forward component. */
  get x(): Q {
    return this.components[0];
  }

  /** Right component. */
  get y(): Q {
    return this.components[1];
  }

  /** Down component. */
  get z(): Q {
    return this.components[2];
  }

  add(other: BodyVector<Q>): BodyVector<Q> {
    return BodyVector.from(Vector3.addComponents(this.components, other.components));
  }

  subtract(other: BodyVector<Q>): BodyVector<Q> {
    return BodyVector.from(Vector3.subtractComponents(this.components, other.components));
  }

  /** Multiply by a plain (unitless) number. */
  scale(factor: number): BodyVector<Q> {
    return BodyVector.from(Vector3.scaleComponents(this.components, factor));
  }

  /** Multiply every component by a quantity, e.g. acceleration × mass = force. */
  times<S extends Quantity>(scalar: S): BodyVector<Product<Q, S>> {
    return BodyVector.from(Vector3.timesComponents(this.components, scalar));
  }

  /** Divide every component by a quantity, e.g. force ÷ mass = acceleration. */
  divide<S extends Quantity>(scalar: S): BodyVector<Quotient<Q, S>> {
    return BodyVector.from(Vector3.divideComponents(this.components, scalar));
  }

  dot<R extends Quantity>(other: BodyVector<R>): Product<Q, R> {
    return Vector3.dotComponents(this.components, other.components);
  }

  cross<R extends Quantity>(other: BodyVector<R>): BodyVector<Product<Q, R>> {
    return BodyVector.from(Vector3.crossComponents(this.components, other.components));
  }

  private static from<Q extends Quantity>([x, y, z]: readonly [Q, Q, Q]): BodyVector<Q> {
    return new BodyVector(x, y, z);
  }
}
