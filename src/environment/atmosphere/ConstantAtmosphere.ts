import type { Meters } from "../../units";
import { AtmosphereConditions } from "./AtmosphereConditions";
import type { AtmosphereModel } from "./AtmosphereModel";

/**
 * The same air at every altitude. Standard sea-level air unless you pass
 * something else. Handy for checking results against closed-form answers
 * such as terminal velocity.
 */
export class ConstantAtmosphere implements AtmosphereModel {
  constructor(
    public readonly conditions: AtmosphereConditions = AtmosphereConditions.standardSeaLevel(),
  ) {}

  conditionsAt(_altitude: Meters): AtmosphereConditions {
    return this.conditions;
  }
}
