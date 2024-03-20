import { clamp } from "./clamp.js";

export const inverseLinearInterpolation = (minVal: number, maxVal: number, currVal: number) =>
  clamp((currVal - minVal) / (maxVal - minVal));
