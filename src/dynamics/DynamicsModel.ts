import type { Environment } from "../environment";
import type { AuxiliaryRates, AuxiliaryState, SimRates, SimState } from "../state";

/**
 * "Given the state, the environment and the inputs, what are the rates of
 * change?"
 *
 * A dynamics model is a pure function wearing a class. It stores no state,
 * no time and no history, so an integrator can call it as many times per
 * step as it likes (four for RK4).
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
  ): SimRates<AuxRates>;
}
