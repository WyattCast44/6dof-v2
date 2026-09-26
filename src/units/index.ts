/**
 * The unit library. Always import units from here (not from the individual
 * files), so the unit algebra is loaded before any math runs.
 *
 * Core (SI) units are used everywhere inside the simulator. Edge units
 * (Feet, Knots, Pounds, Degrees) are for setting up scenarios and displaying
 * results; convert them with `.toMeters()`, `.toRadians()`, and so on.
 */
export { Quantity, type QuantityClass } from "./Quantity";
export type { Product, Quotient, UnknownUnitCombination } from "./UnitAlgebra";

// Core SI units
export { Seconds } from "./Seconds";
export { Meters } from "./Meters";
export { MetersPerSecond } from "./MetersPerSecond";
export { MetersPerSecondSquared } from "./MetersPerSecondSquared";
export { Kilograms } from "./Kilograms";
export { Newtons } from "./Newtons";
export { Radians } from "./Radians";
export { RadiansPerSecond } from "./RadiansPerSecond";
export { RadiansPerSecondSquared } from "./RadiansPerSecondSquared";
export { KilogramMetersSquared } from "./KilogramMetersSquared";
export { KilogramMetersSquaredPerSecond } from "./KilogramMetersSquaredPerSecond";
export { NewtonMeters } from "./NewtonMeters";
export { SquareMeters } from "./SquareMeters";
export { MetersSquaredPerSecondSquared } from "./MetersSquaredPerSecondSquared";
export { KilogramsPerCubicMeter } from "./KilogramsPerCubicMeter";
export { Pascals } from "./Pascals";
export { Kelvin } from "./Kelvin";

// Edge units (convert at the boundary)
export { Feet } from "./Feet";
export { Knots } from "./Knots";
export { Pounds } from "./Pounds";
export { Degrees } from "./Degrees";
export { Celsius } from "./Celsius";

import "./UnitAlgebra";
