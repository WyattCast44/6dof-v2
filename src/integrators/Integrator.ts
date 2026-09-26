import type { Seconds } from "../units";
import type { Combinable, Integrable } from "../state";

/**
 * "Given a state at time t, what are its rates of change?"
 * The simulator builds this from the dynamics model, environment and inputs.
 */
export type RatesFunction<State, Rates> = (state: State, time: Seconds) => Rates;

/**
 * Steps any integrable state forward by dt. An integrator is generic math:
 * it does not know it is simulating a ball or an aircraft, and it never
 * looks inside the state.
 */
export interface Integrator {
  /** A short name for logs and plots, e.g. "RK4". */
  readonly name: string;

  step<State extends Integrable<State, Rates>, Rates extends Combinable<Rates>>(
    state: State,
    time: Seconds,
    dt: Seconds,
    rates: RatesFunction<State, Rates>,
  ): State;
}
