import { Quantity, type Product, type Quotient, type QuantityClass } from "../units";

/** Three components of the same unit, in a fixed order. */
export type Components<Q extends Quantity> = readonly [Q, Q, Q];

/**
 * Base class for 3-component vectors whose components carry units.
 *
 * You won't use this directly. Use a frame-specific vector:
 * - `NedVector`: north, east, down (the inertial frame, for position)
 * - `BodyVector`: x forward, y right, z down (fixed to the body)
 *
 * The frame is part of the type, so the compiler stops you from adding a
 * body-frame vector to an NED vector by accident. To move between frames,
 * use `attitude.bodyToNed(v)` or `attitude.nedToBody(v)`.
 *
 * Math that works the same in every frame (add, scale, dot, cross, ...) is
 * written once here on the raw components. Each frame class wraps the result
 * back into its own type.
 */
export abstract class Vector3<Q extends Quantity> {
  /** Which frame this vector is expressed in. */
  abstract readonly frame: string;

  protected constructor(protected readonly components: Components<Q>) {}

  /** Length of the vector, in the same unit as its components. */
  magnitude(): Q {
    const [a, b, c] = this.components;
    return a.withValue(Math.hypot(a.value, b.value, c.value));
  }

  toString(): string {
    const [a, b, c] = this.components;
    return `${this.frame}[${a.value}, ${b.value}, ${c.value}] ${a.unit}`;
  }

  // ---- Component math shared by every frame ---------------------------------

  protected static addComponents<Q extends Quantity>(a: Components<Q>, b: Components<Q>): Components<Q> {
    return [a[0].add(b[0]), a[1].add(b[1]), a[2].add(b[2])];
  }

  protected static subtractComponents<Q extends Quantity>(a: Components<Q>, b: Components<Q>): Components<Q> {
    return [a[0].subtract(b[0]), a[1].subtract(b[1]), a[2].subtract(b[2])];
  }

  protected static scaleComponents<Q extends Quantity>(a: Components<Q>, factor: number): Components<Q> {
    return [a[0].scale(factor), a[1].scale(factor), a[2].scale(factor)];
  }

  protected static timesComponents<Q extends Quantity, S extends Quantity>(
    a: Components<Q>,
    s: S,
  ): Components<Product<Q, S>> {
    return [a[0].times(s), a[1].times(s), a[2].times(s)] as Components<Product<Q, S>>;
  }

  protected static divideComponents<Q extends Quantity, S extends Quantity>(
    a: Components<Q>,
    s: S,
  ): Components<Quotient<Q, S>> {
    return [a[0].divide(s), a[1].divide(s), a[2].divide(s)] as Components<Quotient<Q, S>>;
  }

  protected static dotComponents<Q extends Quantity, R extends Quantity>(
    a: Components<Q>,
    b: Components<R>,
  ): Product<Q, R> {
    const [a1, a2, a3] = a;
    const [b1, b2, b3] = b;
    return multiply(a1, b1).add(multiply(a2, b2)).add(multiply(a3, b3)) as Product<Q, R>;
  }

  /**
   * a × b = [a₂b₃ − a₃b₂, a₃b₁ − a₁b₃, a₁b₂ − a₂b₁]
   */
  protected static crossComponents<Q extends Quantity, R extends Quantity>(
    a: Components<Q>,
    b: Components<R>,
  ): Components<Product<Q, R>> {
    const [a1, a2, a3] = a;
    const [b1, b2, b3] = b;
    return [
      multiply(a2, b3).subtract(multiply(a3, b2)),
      multiply(a3, b1).subtract(multiply(a1, b3)),
      multiply(a1, b2).subtract(multiply(a2, b1)),
    ] as unknown as Components<Product<Q, R>>;
  }

  protected static zeroComponents<Q extends Quantity>(unit: QuantityClass<Q>): Components<Q> {
    return [new unit(0), new unit(0), new unit(0)];
  }
}

/**
 * Multiply two components whose units are only known as generics. The unit
 * algebra still picks the right result class at runtime; the static type is
 * restored by the caller.
 */
function multiply(a: Quantity, b: Quantity): Quantity {
  return a.times(b);
}
