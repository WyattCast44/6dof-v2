import { NewtonMeters, Newtons } from "../units";
import { BodyVector } from "../vectors";
import type { AeroForcesAndMoments, AeroModel } from "./AeroModel";
import type { AirData } from "./AirData";

/** No aerodynamics at all, as if in a vacuum. */
export class NoAero implements AeroModel {
  forcesAndMoments(_airData: AirData): AeroForcesAndMoments {
    return {
      forceBody: BodyVector.zero(Newtons),
      momentBody: BodyVector.zero(NewtonMeters),
    };
  }
}
