import { describe, expect, it } from "vitest";
import { Feet, Meters } from "../../units";
import { AtmosphereConditions, ConstantAtmosphere, StandardAtmosphere1976 } from "../index";

const atmosphere = new StandardAtmosphere1976();

describe("U.S. Standard Atmosphere 1976", () => {
  // Reference values: the 1976 standard's tables, at geometric altitude.
  it.each([
    { z: 0, T: 288.15, P: 101325, ρ: 1.225, a: 340.294 },
    { z: 1000, T: 281.651, P: 89874.6, ρ: 1.11166, a: 336.435 },
    { z: 5000, T: 255.676, P: 54048.3, ρ: 0.736429, a: 320.545 },
    { z: 10000, T: 223.252, P: 26499.9, ρ: 0.413510, a: 299.532 },
    { z: 20000, T: 216.65, P: 5529.31, ρ: 0.0889099, a: 295.070 },
    { z: 30000, T: 226.509, P: 1197.03, ρ: 0.0184101, a: 301.709 },
    { z: 50000, T: 270.65, P: 79.7787, ρ: 0.00102688, a: 329.799 },
    { z: 80000, T: 198.639, P: 1.05247, ρ: 1.84580e-5, a: 282.538 },
    { z: -1000, T: 294.651, P: 113929, ρ: 1.34700, a: 344.111 },
  ])("matches the tables at $z m", ({ z, T, P, ρ, a }) => {
    const c = atmosphere.conditionsAt(new Meters(z));
    expect(c.temperature.value).toBeCloseTo(T, 2);
    expect(c.pressure.value / P).toBeCloseTo(1, 4);
    expect(c.density.value / ρ).toBeCloseTo(1, 4);
    expect(c.speedOfSound.value).toBeCloseTo(a, 2);
  });

  it("is continuous across the tropopause", () => {
    const tropopause = new Meters(11000 * 6356766 / (6356766 - 11000)); // H = 11 km
    const below = atmosphere.conditionsAt(tropopause.subtract(new Meters(1e-6)));
    const above = atmosphere.conditionsAt(tropopause.add(new Meters(1e-6)));
    // Within the rounding of the published base pressure (22,632.06 Pa).
    expect(below.pressure.value / above.pressure.value).toBeCloseTo(1, 5);
    expect(below.temperature.value).toBeCloseTo(above.temperature.value, 6);
  });

  it("accepts edge units once converted", () => {
    const c = atmosphere.conditionsAt(new Feet(30000).toMeters());
    expect(c.temperature.toCelsius().value).toBeCloseTo(-44.4, 1);
  });

  it("refuses altitudes outside the model", () => {
    expect(() => atmosphere.conditionsAt(new Meters(90000))).toThrow(RangeError);
    expect(() => atmosphere.conditionsAt(new Meters(-6000))).toThrow(RangeError);
  });
});

describe("ConstantAtmosphere", () => {
  it("defaults to standard sea-level air everywhere", () => {
    const c = new ConstantAtmosphere().conditionsAt(new Meters(8000));
    expect(c.density.value).toBeCloseTo(1.225, 4);
    expect(c).toEqual(AtmosphereConditions.standardSeaLevel());
  });
});
