import type { Seconds } from "../units";

/**
 * The contract every continuous state implements, so an integrator can march
 * it forward without knowing what it is (a ball, an aircraft, fuel mass...).
 *
 * `State` is the thing being integrated; `Rates` is its time derivative.
 */
export interface Integrable<State, Rates> {
  /** x + ẋ·dt */
  advance(rates: Rates, dt: Seconds): State;
}

/**
 * Rates must be combinable, because higher-order integrators (RK4) take a
 * weighted average of several rate evaluations.
 */
export interface Combinable<Rates> {
  add(other: Rates): Rates;
  scale(factor: number): Rates;
}
