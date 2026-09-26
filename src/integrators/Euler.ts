import type { Seconds } from "../units";
import type { Combinable, Integrable } from "../state";
import type { Integrator, RatesFunction } from "./Integrator";

/**
 * Forward Euler: follow the slope at the start of the step.
 *
 *   x(t + dt) = x(t) + ẋ(x, t)·dt
 *
 * One rates evaluation per step. First-order accurate: halving dt roughly
 * halves the error. Simple to read, but drifts on long runs.
 */
export class Euler implements Integrator {
  readonly name = "Euler";

  step<State extends Integrable<State, Rates>, Rates extends Combinable<Rates>>(
    state: State,
    time: Seconds,
    dt: Seconds,
    rates: RatesFunction<State, Rates>,
  ): State {
    return state.advance(rates(state, time), dt);
  }
}
