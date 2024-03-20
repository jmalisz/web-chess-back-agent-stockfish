export const linearInterpolation = (minVal: number, maxVal: number, currVal: number) =>
  minVal * (1 - currVal) + maxVal * currVal;
