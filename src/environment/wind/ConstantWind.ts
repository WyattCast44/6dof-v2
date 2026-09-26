import { MetersPerSecond, Radians, type Meters, type Seconds } from "../../units";
import { NedVector } from "../../vectors";
import type { WindModel } from "./WindModel";

/** The same wind everywhere, at all times. */
export class ConstantWind implements WindModel {
  constructor(public readonly windNed: NedVector<MetersPerSecond>) {}

  /**
   * A horizontal wind described the way a weather report does: the heading
   * it blows *from*, and its speed.
   *
   * @example ConstantWind.fromDirection(new Degrees(270).toRadians(), new Knots(20).toMetersPerSecond())
   *          // a 20 kt westerly, blowing toward the east
   */
  static fromDirection(fromHeading: Radians, speed: MetersPerSecond): ConstantWind {
    const toward = fromHeading.add(new Radians(Math.PI));
    return new ConstantWind(
      new NedVector(speed.scale(toward.cos()), speed.scale(toward.sin()), new MetersPerSecond(0)),
    );
  }

  windAt(_positionNed: NedVector<Meters>, _time: Seconds): NedVector<MetersPerSecond> {
    return this.windNed;
  }
}
