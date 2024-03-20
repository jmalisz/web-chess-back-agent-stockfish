export const clamp = (currVal: number, minVal = 0, maxVal = 1) =>
  Math.min(maxVal, Math.max(minVal, currVal));
