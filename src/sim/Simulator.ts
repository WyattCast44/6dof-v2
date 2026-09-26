import type { DynamicsModel } from "../dynamics";
import { Environment } from "../environment";
import { RK4, type Integrator } from "../integrators";
import type { AuxiliaryRates, AuxiliaryState, SimRates, SimState } from "../state";
import { Seconds } from "../units";
import { NoInputs, noInputs, type InputSource } from "./InputSource";
import { Recorder } from "./Recorder";
import type { Recording } from "./Recording";

/**
 * Options for a `Simulator`. `inputs` may be left out only when the dynamics
 * model takes `NoInputs`.
 */
export type SimulatorOptions<
  Aux extends AuxiliaryState<Aux, AuxRates>,
  AuxRates extends AuxiliaryRates<AuxRates>,
  Inputs,
> = {
  initialState: SimState<Aux, AuxRates>;
  dynamics: DynamicsModel<Aux, AuxRates, Inputs>;
  /** The fixed physics step, dt. */
  timeStep: Seconds;
  /** Defaults to constant gravity. */
  environment?: Environment;
  /** Defaults to RK4. */
  integrator?: Integrator;
  /** Simulated time of the initial state. Defaults to 0 s. */
  startTime?: Seconds;
} & (Inputs extends NoInputs
  ? { inputs?: InputSource<Inputs, SimState<Aux, AuxRates>> }
  : { inputs: InputSource<Inputs, SimState<Aux, AuxRates>> });

/**
 * Owns the current state and the clock. The only part of the system that
 * changes over time.
 *
 * Each tick:
 * 1. Ask the input source for the inputs at time t.
 * 2. Let the integrator call `dynamics.computeRates(...)` as often as it
 *    needs, and return the next state.
 * 3. Store the new state, advance the clock, and hand the state to the
 *    recorder.
 *
 * The simulator computes no physics itself.
 */
export class Simulator<
  Aux extends AuxiliaryState<Aux, AuxRates>,
  AuxRates extends AuxiliaryRates<AuxRates>,
  Inputs,
> {
  readonly dynamics: DynamicsModel<Aux, AuxRates, Inputs>;
  readonly environment: Environment;
  readonly integrator: Integrator;
  readonly timeStep: Seconds;
  readonly inputs: InputSource<Inputs, SimState<Aux, AuxRates>>;
  readonly startTime: Seconds;

  private currentState: SimState<Aux, AuxRates>;
  /**
   * Time is stepCount × dt rather than a running sum, so floating-point
   * error does not accumulate in the clock.
   */
  private stepCount = 0;
  private readonly recorder = new Recorder<SimState<Aux, AuxRates>>();

  constructor(options: SimulatorOptions<Aux, AuxRates, Inputs>) {
    if (options.timeStep.value <= 0) {
      throw new RangeError(`timeStep must be positive, got ${options.timeStep}.`);
    }
    this.dynamics = options.dynamics;
    this.environment = options.environment ?? new Environment();
    this.integrator = options.integrator ?? new RK4();
    this.timeStep = options.timeStep;
    this.startTime = options.startTime ?? new Seconds(0);
    // Only reachable without `inputs` when Inputs is NoInputs (see SimulatorOptions).
    this.inputs = options.inputs ?? (noInputs as InputSource<Inputs, SimState<Aux, AuxRates>>);
    this.currentState = options.initialState;
    this.recorder.record(this.time, this.currentState);
  }

  get state(): SimState<Aux, AuxRates> {
    return this.currentState;
  }

  get time(): Seconds {
    return this.startTime.add(this.timeStep.scale(this.stepCount));
  }

  /** Advance one fixed time step. */
  step(): void {
    const time = this.time;
    const inputs = this.inputs.inputsAt(time, this.currentState);

    const rates = (state: SimState<Aux, AuxRates>): SimRates<AuxRates> =>
      this.dynamics.computeRates(state, this.environment, inputs);

    this.currentState = this.integrator.step(this.currentState, time, this.timeStep, rates);
    this.stepCount += 1;
    this.recorder.record(this.time, this.currentState);
  }

  /**
   * Step until `duration` has passed, or until `stopWhen` returns true,
   * whichever comes first. Returns everything recorded so far.
   */
  run(options: {
    duration: Seconds;
    stopWhen?: (state: SimState<Aux, AuxRates>, time: Seconds) => boolean;
  }): Recording<SimState<Aux, AuxRates>> {
    const steps = Math.round(options.duration.ratioTo(this.timeStep));
    for (let i = 0; i < steps; i++) {
      this.step();
      if (options.stopWhen?.(this.currentState, this.time)) break;
    }
    return this.recording;
  }

  /** Everything recorded so far, starting with the initial state. */
  get recording(): Recording<SimState<Aux, AuxRates>> {
    return this.recorder.toRecording();
  }
}
