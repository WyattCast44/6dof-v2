import type { Quantity } from "../units";
import { Seconds } from "../units";

/** One recorded instant: the time and the state at that time. */
export interface Sample<State> {
  readonly time: Seconds;
  readonly state: State;
}

/** Picks a value out of a state, e.g. `(s) => s.altitude`. */
export type Selector<State, Q> = (state: State, time: Seconds) => Q;

/** A value and when it happened. */
export interface TimedValue<Q> {
  readonly time: Seconds;
  readonly value: Q;
}

/**
 * The history of one run, with questions you can ask of it in plain terms:
 *
 * ```ts
 * const run = simulator.run({ duration: new Seconds(60) });
 * run.timeWhen((s) => s.altitude.lessThanOrEqual(new Meters(0)));
 * run.max((s) => s.altitude);
 * run.valueAt(new Seconds(3), (s) => s.groundSpeed);
 * ```
 *
 * A recording is read-only. It always holds at least one sample (the state
 * the run started from).
 */
export class Recording<State> {
  readonly samples: readonly Sample<State>[];

  constructor(samples: readonly Sample<State>[]) {
    if (samples.length === 0) {
      throw new Error("A recording needs at least one sample.");
    }
    this.samples = samples;
  }

  get initial(): Sample<State> {
    return this.samples[0]!;
  }

  get final(): Sample<State> {
    return this.samples[this.samples.length - 1]!;
  }

  /** How much simulated time the recording covers. */
  get duration(): Seconds {
    return this.final.time.subtract(this.initial.time);
  }

  /**
   * The time of the first sample where `condition` is true, or `undefined`
   * if it never is. Accurate to one time step; for a crossing of a specific
   * value, `timeWhenReaches` interpolates between samples.
   */
  timeWhen(condition: (state: State, time: Seconds) => boolean): Seconds | undefined {
    return this.samples.find((s) => condition(s.state, s.time))?.time;
  }

  /**
   * The first time a value reaches `target` (from either side), linearly
   * interpolated between the two samples on either side of the crossing.
   *
   * @example run.timeWhenReaches((s) => s.altitude, new Meters(0)) // time aloft
   */
  timeWhenReaches<Q extends Quantity>(select: Selector<State, Q>, target: Q): Seconds | undefined {
    let previous: TimedValue<Q> | undefined;
    for (const { time, state } of this.samples) {
      const value = select(state, time);
      const offset = value.value - target.value;
      if (offset === 0) return time;
      if (previous) {
        const previousOffset = previous.value.value - target.value;
        if (Math.sign(previousOffset) !== Math.sign(offset)) {
          const fraction = previousOffset / (previousOffset - offset);
          return previous.time.add(time.subtract(previous.time).scale(fraction));
        }
      }
      previous = { time, value };
    }
    return undefined;
  }

  /** The largest value over the run, and when it happened. */
  max<Q extends Quantity>(select: Selector<State, Q>): TimedValue<Q> {
    return this.extreme(select, (candidate, best) => candidate.greaterThan(best));
  }

  /** The smallest value over the run, and when it happened. */
  min<Q extends Quantity>(select: Selector<State, Q>): TimedValue<Q> {
    return this.extreme(select, (candidate, best) => candidate.lessThan(best));
  }

  /**
   * A value at any time within the run, linearly interpolated between the
   * two nearest samples.
   */
  valueAt<Q extends Quantity>(time: Seconds, select: Selector<State, Q>): Q {
    const { samples } = this;
    if (time.lessThan(this.initial.time) || time.greaterThan(this.final.time)) {
      throw new RangeError(
        `${time} is outside the recording (${this.initial.time} to ${this.final.time}).`,
      );
    }
    const afterIndex = samples.findIndex((s) => s.time.greaterThanOrEqual(time));
    const after = samples[afterIndex]!;
    const afterValue = select(after.state, after.time);
    if (afterIndex === 0 || after.time.equals(time)) return afterValue;

    const before = samples[afterIndex - 1]!;
    const beforeValue = select(before.state, before.time);
    const fraction = time.subtract(before.time).ratioTo(after.time.subtract(before.time));
    return beforeValue.add(afterValue.subtract(beforeValue).scale(fraction));
  }

  /**
   * The value a quantity settles to, or `undefined` if it has not settled.
   *
   * "Settled" means that over the last `window` of the run, the value never
   * moved by more than `tolerance`. Example: terminal velocity.
   */
  steadyValue<Q extends Quantity>(
    select: Selector<State, Q>,
    options: { tolerance: Q; window?: Seconds },
  ): Q | undefined {
    const window = options.window ?? new Seconds(1);
    const windowStart = this.final.time.subtract(window);
    if (windowStart.lessThan(this.initial.time)) return undefined;

    const values = this.samples
      .filter((s) => s.time.greaterThanOrEqual(windowStart))
      .map((s) => select(s.state, s.time));
    const highest = values.reduce((a, b) => (b.greaterThan(a) ? b : a));
    const lowest = values.reduce((a, b) => (b.lessThan(a) ? b : a));

    return highest.subtract(lowest).lessThanOrEqual(options.tolerance)
      ? values[values.length - 1]
      : undefined;
  }

  private extreme<Q extends Quantity>(
    select: Selector<State, Q>,
    isBetter: (candidate: Q, best: Q) => boolean,
  ): TimedValue<Q> {
    let best: TimedValue<Q> | undefined;
    for (const { time, state } of this.samples) {
      const value = select(state, time);
      if (!best || isBetter(value, best.value)) best = { time, value };
    }
    return best!;
  }
}
