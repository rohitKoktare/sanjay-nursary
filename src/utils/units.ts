import type { UnitCode } from "@/types";

const CONVERSIONS: Record<UnitCode, number> = {
  kg: 1,
  gm: 0.001,
};

export const BASE_UNIT: UnitCode = "kg";

export function convertToBaseUnit(value: number, unit: UnitCode): number {
  const factor = CONVERSIONS[unit];
  if (factor === undefined) {
    throw new Error(`Unknown unit: ${unit}`);
  }
  return value * factor;
}

export function convertFromBaseUnit(value: number, unit: UnitCode): number {
  const factor = CONVERSIONS[unit];
  if (factor === undefined) {
    throw new Error(`Unknown unit: ${unit}`);
  }
  return value / factor;
}

export function formatQuantity(valueInBase: number, unit: UnitCode = BASE_UNIT): string {
  const v = convertFromBaseUnit(valueInBase, unit);
  return `${v.toLocaleString("en-IN", { maximumFractionDigits: 3 })} ${unit}`;
}
