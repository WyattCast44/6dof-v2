import type { Seconds } from "../units";
import type { Combinable, Integrable } from "./Integrable";

/**
 * Extra continuous quantities a scenario integrates alongside the rigid
 * body, such as fuel mass. Each aircraft declares its own fixed schema by
 * implementing this contract (see the fuel-burn rung, coming later).
 */
export type AuxiliaryState<Self, Rates> = Integrable<Self, Rates>;

/** The time derivative of an auxiliary state. */
export type AuxiliaryRates<Self> = Combinable<Self>;

/** For bodies with nothing extra to integrate (a ball, a glider). */
export class NoAuxiliaryState implements AuxiliaryState<NoAuxiliaryState, NoAuxiliaryRates> {
  advance(_rates: NoAuxiliaryRates, _dt: Seconds): NoAuxiliaryState {
    return this;
  }
}

/** The (empty) rates of `NoAuxiliaryState`. */
export class NoAuxiliaryRates implements AuxiliaryRates<NoAuxiliaryRates> {
  add(_other: NoAuxiliaryRates): NoAuxiliaryRates {
    return this;
  }

  scale(_factor: number): NoAuxiliaryRates {
    return this;
  }
}
