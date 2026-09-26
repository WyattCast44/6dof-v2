import type { Seconds } from "../units";

/**
 * Where the simulator gets its inputs (control deflections, throttle,
 * configuration such as gear and flaps) each tick.
 *
 * Scripts, autopilots and human players all implement this same contract,
 * so the dynamics never know who is flying.
 */
export interface InputSource<Inputs, State> {
  inputsAt(time: Seconds, state: State): Inputs;
}

/** Inputs for bodies that have none, such as a dropped ball. */
export class NoInputs {
  readonly kind = "no-inputs";
}

/** An input source that always returns `NoInputs`. */
export const noInputs: InputSource<NoInputs, unknown> = {
  inputsAt: () => new NoInputs(),
};

/**
 * Build an input source from a plain function of time and state.
 *
 * @example scriptedInputs((t) => ({ throttle: t.value < 10 ? 1 : 0.5 }))
 */
export function scriptedInputs<Inputs, State>(
  script: (time: Seconds, state: State) => Inputs,
): InputSource<Inputs, State> {
  return { inputsAt: script };
}
