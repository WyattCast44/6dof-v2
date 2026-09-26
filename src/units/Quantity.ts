import type { Product, Quotient } from "./UnitAlgebra";

/**
 * The shape of any concrete unit class, e.g. `Meters` or `Newtons`.
 * Used when code needs to build a quantity of a unit it was handed.
 */
export type QuantityClass<Q extends Quantity> = new (value: number) => Q;

/**
 * How units combine when multiplied or divided. Filled in by `UnitAlgebra.ts`.
 *
 * It is a function (not a table) so the unit classes can all finish loading
 * before anything looks up a combination.
 */
type AlgebraLookup = {
  product(a: Quantity, b: Quantity): QuantityClass<Quantity>;
  quotient(a: Quantity, b: Quantity): QuantityClass<Quantity>;
};

let algebra: AlgebraLookup | undefined;

/**
 * Base class for every physical quantity: a number plus the unit it is in.
 *
 * The math lives here so equations never have to unwrap `.value`:
 *
 * ```ts
 * const distance = new Meters(100);
 * const time = new Seconds(20);
 * const speed = distance.divide(time); // MetersPerSecond, 5 m/s
 * ```
 *
 * Adding and subtracting only work between the same unit (you cannot add
 * meters to seconds). Multiplying and dividing produce a new unit, looked up
 * in `UnitAlgebra.ts`.
 *
 * All quantities are immutable. Every operation returns a new instance.
 */
export abstract class Quantity {
  /** The unit symbol, e.g. "m" or "m/s²". Each subclass sets a literal. */
  abstract readonly unit: string;

  constructor(public readonly value: number) {
    if (!Number.isFinite(value)) {
      throw new RangeError(`${new.target.name} value must be finite, got ${value}`);
    }
  }

  /** @internal Called once by `UnitAlgebra.ts`. */
  static useAlgebra(lookup: AlgebraLookup): void {
    algebra = lookup;
  }

  /** A new quantity with the same unit and a different number. */
  withValue<T extends Quantity>(this: T, value: number): T {
    const UnitClass = this.constructor as QuantityClass<T>;
    return new UnitClass(value);
  }

  // ---- Same-unit arithmetic ------------------------------------------------

  add<T extends Quantity>(this: T, other: T): T {
    return this.withValue(this.value + other.value);
  }

  subtract<T extends Quantity>(this: T, other: T): T {
    return this.withValue(this.value - other.value);
  }

  negate<T extends Quantity>(this: T): T {
    return this.withValue(-this.value);
  }

  abs<T extends Quantity>(this: T): T {
    return this.withValue(Math.abs(this.value));
  }

  /** Multiply by a plain (unitless) number. */
  scale<T extends Quantity>(this: T, factor: number): T {
    return this.withValue(this.value * factor);
  }

  /** How many times bigger this is than `other` (a plain number). */
  ratioTo<T extends Quantity>(this: T, other: T): number {
    return this.value / other.value;
  }

  // ---- Unit-changing arithmetic --------------------------------------------

  /**
   * Multiply two quantities. The result's unit comes from `UnitAlgebra.ts`.
   *
   * @example new MetersPerSecondSquared(9.8).times(new Kilograms(2)) // Newtons
   */
  times<A extends Quantity, B extends Quantity>(this: A, other: B): Product<A, B> {
    const ResultClass = requireAlgebra().product(this, other);
    return new ResultClass(this.value * other.value) as Product<A, B>;
  }

  /**
   * Divide two quantities. The result's unit comes from `UnitAlgebra.ts`.
   *
   * @example new Meters(100).divide(new Seconds(20)) // MetersPerSecond
   */
  divide<A extends Quantity, B extends Quantity>(this: A, other: B): Quotient<A, B> {
    const ResultClass = requireAlgebra().quotient(this, other);
    return new ResultClass(this.value / other.value) as Quotient<A, B>;
  }

  // ---- Comparisons ---------------------------------------------------------

  lessThan<T extends Quantity>(this: T, other: T): boolean {
    return this.value < other.value;
  }

  lessThanOrEqual<T extends Quantity>(this: T, other: T): boolean {
    return this.value <= other.value;
  }

  greaterThan<T extends Quantity>(this: T, other: T): boolean {
    return this.value > other.value;
  }

  greaterThanOrEqual<T extends Quantity>(this: T, other: T): boolean {
    return this.value >= other.value;
  }

  /** Equal within an absolute tolerance, expressed in the same unit. */
  equals<T extends Quantity>(this: T, other: T, tolerance = 1e-9): boolean {
    return Math.abs(this.value - other.value) <= tolerance;
  }

  toString(): string {
    return `${this.value} ${this.unit}`;
  }
}

function requireAlgebra(): AlgebraLookup {
  if (!algebra) {
    throw new Error(
      "Unit algebra is not loaded. Import units from 'src/units' (the index file)."
    );
  }
  return algebra;
}
