import type { Seconds } from "../units";
import type { Combinable, Integrable } from "../state";
import type { Integrator, RatesFunction } from "./Integrator";

/**
 * The classic fourth-order Runge-Kutta method.
 *
 * Samples the slope four times across the step and takes a weighted average:
 *
 * ```
 * k₁ = f(x,              t)
 * k₂ = f(x + k₁·dt/2,    t + dt/2)
 * k₃ = f(x + k₂·dt/2,    t + dt/2)
 * k₄ = f(x + k₃·dt,      t + dt)
 * x(t + dt) = x + (k₁ + 2k₂ + 2k₃ + k₄)·dt/6
 * ```
 *
 * Fourth-order accurate: halving dt cuts the error by about 16×.
 *
 * Source: Press et al., "Numerical Recipes", 3rd ed. (2007), eq. 17.1.3.
 */
export class RK4 implements Integrator {
  readonly name = "RK4";

  step<State extends Integrable<State, Rates>, Rates extends Combinable<Rates>>(
    state: State,
    time: Seconds,
    dt: Seconds,
    rates: RatesFunction<State, Rates>,
  ): State {
    const halfDt = dt.scale(0.5);
    const midTime = time.add(halfDt);
    const endTime = time.add(dt);

    const k1 = rates(state, time);
    const k2 = rates(state.advance(k1, halfDt), midTime);
    const k3 = rates(state.advance(k2, halfDt), midTime);
    const k4 = rates(state.advance(k3, dt), endTime);

    const averageRate = k1.add(k2.scale(2)).add(k3.scale(2)).add(k4).scale(1 / 6);
    return state.advance(averageRate, dt);
  }
}
