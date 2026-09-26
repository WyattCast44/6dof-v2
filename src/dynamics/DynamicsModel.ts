import type { Environment } from "../environment";
import type { AuxiliaryRates, AuxiliaryState, SimRates, SimState } from "../state";
import type { Seconds } from "../units";

/**
 * "Given the state, the environment and the inputs, what are the rates of
 * change?"
 *
 * A dynamics model is a pure function wearing a class. It stores no state,
 * no time and no history, so an integrator can call it as many times per
 * step as it likes (four for RK4).
 *
 * `time` is the time of this particular evaluation (RK4 asks about the
 * middle and end of the step too). Models use it to look up anything that
 * changes with time, such as gusting wind.
 */
export interface DynamicsModel<
  Aux extends AuxiliaryState<Aux, AuxRates>,
  AuxRates extends AuxiliaryRates<AuxRates>,
  Inputs,
> {
  computeRates(
    state: SimState<Aux, AuxRates>,
    environment: Environment,
    inputs: Inputs,
    time: Seconds,
  ): SimRates<AuxRates>;
}
