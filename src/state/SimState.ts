import type { Meters, MetersPerSecond, Seconds } from "../units";
import {
  NoAuxiliaryRates,
  NoAuxiliaryState,
  type AuxiliaryRates,
  type AuxiliaryState,
} from "./AuxiliaryState";
import type { Integrable } from "./Integrable";
import { RigidBodyRates, RigidBodyState } from "./RigidBodyState";

/**
 * Everything the simulator integrates over time, in two named groups:
 * - `rigidBody`: the textbook 12 states
 * - `auxiliary`: scenario-specific extras such as fuel (empty for a ball)
 *
 * Discrete things (gear, flaps) are not here. They are configuration and
 * reach the dynamics model as inputs.
 */
export class SimState<
  Aux extends AuxiliaryState<Aux, AuxRates> = NoAuxiliaryState,
  AuxRates extends AuxiliaryRates<AuxRates> = NoAuxiliaryRates,
> implements Integrable<SimState<Aux, AuxRates>, SimRates<AuxRates>>
{
  constructor(
    public readonly rigidBody: RigidBodyState,
    public readonly auxiliary: Aux,
  ) {}

  /** A state with only rigid-body variables (no auxiliary state). */
  static rigidBodyOnly(rigidBody: RigidBodyState): SimState {
    return new SimState(rigidBody, new NoAuxiliaryState());
  }

  /** Shortcut for `rigidBody.altitude`. */
  get altitude(): Meters {
    return this.rigidBody.altitude;
  }

  /** Shortcut for `rigidBody.groundSpeed`. */
  get groundSpeed(): MetersPerSecond {
    return this.rigidBody.groundSpeed;
  }

  advance(rates: SimRates<AuxRates>, dt: Seconds): SimState<Aux, AuxRates> {
    return new SimState(
      this.rigidBody.advance(rates.rigidBody, dt),
      this.auxiliary.advance(rates.auxiliary, dt),
    );
  }
}

/** The time derivative of a `SimState`. */
export class SimRates<AuxRates extends AuxiliaryRates<AuxRates> = NoAuxiliaryRates> {
  constructor(
    public readonly rigidBody: RigidBodyRates,
    public readonly auxiliary: AuxRates,
  ) {}

  /** Rates with only rigid-body terms (no auxiliary state). */
  static rigidBodyOnly(rigidBody: RigidBodyRates): SimRates {
    return new SimRates(rigidBody, new NoAuxiliaryRates());
  }

  add(other: SimRates<AuxRates>): SimRates<AuxRates> {
    return new SimRates(this.rigidBody.add(other.rigidBody), this.auxiliary.add(other.auxiliary));
  }

  scale(factor: number): SimRates<AuxRates> {
    return new SimRates(this.rigidBody.scale(factor), this.auxiliary.scale(factor));
  }
}
