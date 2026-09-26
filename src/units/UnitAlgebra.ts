import { Quantity, type QuantityClass } from "./Quantity";
import { Kilograms } from "./Kilograms";
import { KilogramMetersSquaredPerSecond } from "./KilogramMetersSquaredPerSecond";
import { Meters } from "./Meters";
import { MetersPerSecond } from "./MetersPerSecond";
import { MetersPerSecondSquared } from "./MetersPerSecondSquared";
import { NewtonMeters } from "./NewtonMeters";
import { Newtons } from "./Newtons";
import { Radians } from "./Radians";
import { RadiansPerSecond } from "./RadiansPerSecond";
import { RadiansPerSecondSquared } from "./RadiansPerSecondSquared";
import { Seconds } from "./Seconds";

/**
 * The unit algebra: which units you get when you multiply or divide.
 *
 * This is a curated list, not full dimensional analysis. If an equation needs
 * a combination that is not here, add one line to the right table. The
 * compiler then knows the result type, and so does your editor's hover.
 *
 * Radians are treated as dimensionless, as is usual in rigid-body mechanics:
 * (rad/s) × (kg·m²/s) = N·m.
 */

/** A × B = C. Each pair is looked up in both orders, so list it once. */
const products = () => ({
  // rate × time = change (used by integrators: x + ẋ·dt)
  "m/s * s": Meters,
  "m/s² * s": MetersPerSecond,
  "rad/s * s": Radians,
  "rad/s² * s": RadiansPerSecond,
  // Newton's second law: F = m·a
  "m/s² * kg": Newtons,
  // ω × v (transport term in the body-frame force equation)
  "rad/s * m/s": MetersPerSecondSquared,
  // angular momentum H = I·ω, and ω × H
  "kg·m² * rad/s": KilogramMetersSquaredPerSecond,
  "rad/s * kg·m²/s": NewtonMeters,
});

/** A ÷ B = C. */
const quotients = () => ({
  "m / s": MetersPerSecond,
  "m/s / s": MetersPerSecondSquared,
  "m / m/s": Seconds,
  "rad / s": RadiansPerSecond,
  "rad/s / s": RadiansPerSecondSquared,
  // a = F / m
  "N / kg": MetersPerSecondSquared,
  "N / m/s²": Kilograms,
  // α = M / I (about a single principal axis)
  "N·m / kg·m²": RadiansPerSecondSquared,
});

// ---- Type-level mirror of the tables above ---------------------------------

type Instances<T extends Record<string, QuantityClass<Quantity>>> = {
  [K in keyof T]: InstanceType<T[K]>;
};
type ProductTable = Instances<ReturnType<typeof products>>;
type QuotientTable = Instances<ReturnType<typeof quotients>>;

/**
 * Returned (as a type) when two units have no listed combination. It is still
 * a `Quantity`, so generic code compiles, but it will not fit anywhere a real
 * unit such as `Newtons` is expected, and the hover text says what is missing.
 */
export type UnknownUnitCombination<Description extends string> = Quantity & {
  readonly unitError: Description;
};

/** The unit you get from A × B. Hover over a `.times(...)` call to see it. */
export type Product<A extends Quantity, B extends Quantity> =
  `${A["unit"]} * ${B["unit"]}` extends keyof ProductTable
    ? ProductTable[`${A["unit"]} * ${B["unit"]}`]
    : `${B["unit"]} * ${A["unit"]}` extends keyof ProductTable
      ? ProductTable[`${B["unit"]} * ${A["unit"]}`]
      : UnknownUnitCombination<`no rule for ${A["unit"]} * ${B["unit"]}`>;

/** The unit you get from A ÷ B. Hover over a `.divide(...)` call to see it. */
export type Quotient<A extends Quantity, B extends Quantity> =
  `${A["unit"]} / ${B["unit"]}` extends keyof QuotientTable
    ? QuotientTable[`${A["unit"]} / ${B["unit"]}`]
    : UnknownUnitCombination<`no rule for ${A["unit"]} / ${B["unit"]}`>;

// ---- Runtime lookup ---------------------------------------------------------

type Table = Record<string, QuantityClass<Quantity>>;
let productTable: Table | undefined;
let quotientTable: Table | undefined;

Quantity.useAlgebra({
  product(a, b) {
    productTable ??= products();
    const result = productTable[`${a.unit} * ${b.unit}`] ?? productTable[`${b.unit} * ${a.unit}`];
    if (!result) {
      throw new TypeError(`No unit rule for ${a.unit} * ${b.unit}. Add one to UnitAlgebra.ts.`);
    }
    return result;
  },
  quotient(a, b) {
    quotientTable ??= quotients();
    const result = quotientTable[`${a.unit} / ${b.unit}`];
    if (!result) {
      throw new TypeError(`No unit rule for ${a.unit} / ${b.unit}. Add one to UnitAlgebra.ts.`);
    }
    return result;
  },
});
