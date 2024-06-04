import { cloneDeep } from "lodash-es";

type ArrayRecord = Record<string, string | number>;

type FindCrossOverByProps = {
  searchedArray: ArrayRecord[];
  searchedNumber: number;
  indexLow: number;
  indexHigh: number;
  by: string;
};

// Assuming that array is sorted
const findCrossOverBy = ({
  searchedArray,
  searchedNumber,
  indexLow,
  indexHigh,
  by,
}: FindCrossOverByProps): number => {
  const valueLow = searchedArray[indexLow]?.[by];
  const valueHigh = searchedArray[indexHigh]?.[by];
  if (valueLow === undefined) throw new Error("Programmatic error: indexLow out of bounds");
  if (typeof valueLow !== "number") throw new Error("Programmatic error: valueLow is not a number");
  if (valueHigh === undefined) throw new Error("Programmatic error: indexHigh out of bounds");
  if (typeof valueHigh !== "number")
    throw new Error("Programmatic error: valueHigh is not a number");

  // Searched number is smaller than lowest number in array
  if (valueLow >= searchedNumber) return indexLow;
  // Searched number is greater than biggest number in array
  if (valueHigh <= searchedNumber) return indexHigh;

  const indexMid = Math.floor((indexLow + indexHigh) / 2);
  const valueMid = searchedArray[indexMid]?.[by];
  if (valueMid === undefined) throw new Error("Programmatic error: indexMid out of bounds");
  if (typeof valueMid !== "number") throw new Error("Programmatic error: valueMid is not a number");

  if (valueMid === searchedNumber) return indexMid;

  // Searched number is in the upper part
  if (valueMid < searchedNumber) {
    return findCrossOverBy({
      searchedArray,
      searchedNumber,
      indexLow: indexMid + 1,
      indexHigh,
      by,
    });
  }

  // Searched number is in the lower part
  return findCrossOverBy({ searchedArray, searchedNumber, indexLow, indexHigh: indexMid - 1, by });
};

type FindClosestNumbersByProps = {
  searchedArray: ArrayRecord[];
  searchedNumber: number;
  amount: number;
  by: string;
};

export const findClosestNumbersBy = ({
  searchedArray,
  searchedNumber,
  amount,
  by,
}: FindClosestNumbersByProps): ArrayRecord[] => {
  const output: ArrayRecord[] = [];
  const searchedArrayLength = searchedArray.length;

  if (searchedArrayLength === 0) return [];

  let indexLeft = findCrossOverBy({
    searchedArray,
    searchedNumber,
    indexLow: 0,
    indexHigh: searchedArray.length - 1,
    by,
  });
  let indexRight = indexLeft + 1;

  while ((indexLeft >= 0 || indexRight < searchedArrayLength - 1) && output.length < amount) {
    const recordLeft = searchedArray[indexLeft];
    const valueLeft = recordLeft?.[by];

    const recordRight = searchedArray[indexRight];
    const valueRight = recordRight?.[by];

    if (
      recordLeft &&
      typeof valueLeft === "number" &&
      recordRight &&
      typeof valueRight === "number"
    ) {
      const offsetLeft = Math.abs(searchedNumber - valueLeft);
      const offsetRight = Math.abs(searchedNumber - valueRight);

      if (offsetLeft < offsetRight) {
        output.push(recordLeft);
        indexLeft -= 1;
      } else {
        output.push(recordRight);
        indexRight += 1;
      }
    } else if (recordLeft && typeof valueLeft === "number") {
      output.push(recordLeft);
      indexLeft -= 1;
    } else if (recordRight && typeof valueRight === "number") {
      output.push(recordRight);
      indexRight += 1;
    }
  }

  return cloneDeep(output);
};
