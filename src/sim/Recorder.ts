import type { Seconds } from "../units";
import { Recording, type Sample } from "./Recording";

/**
 * Collects the state history as the simulator runs. The simulator hands it
 * each new state; the recorder never drives the simulation.
 *
 * Every step is kept. Sampling and memory limits for long runs are an open
 * question (see docs/design-spec.md).
 */
export class Recorder<State> {
  private readonly samples: Sample<State>[] = [];

  record(time: Seconds, state: State): void {
    this.samples.push({ time, state });
  }

  /** A read-only snapshot of everything recorded so far. */
  toRecording(): Recording<State> {
    return new Recording([...this.samples]);
  }
}
