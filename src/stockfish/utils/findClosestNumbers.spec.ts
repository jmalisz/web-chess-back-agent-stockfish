import { assert, describe, it } from "vitest";

import { findClosestNumbersBy } from "./findClosestNumbers.js";

describe("findClosestNumber()", () => {
  it("Handles regular searchedArray", () => {
    const searchedArray = Array.from({ length: 1000 }).map((_, index) => ({ val: index }));
    const searchedNumber = 15;
    const amount = 3;
    const by = "val";

    const output = findClosestNumbersBy({ searchedArray, searchedNumber, amount, by });

    assert.deepEqual(output, [{ val: 15 }, { val: 16 }, { val: 14 }]);
  });

  it("Handles empty searchedArray", () => {
    const searchedArray: Parameters<typeof findClosestNumbersBy>[0]["searchedArray"] = [];
    const searchedNumber = 15;
    const amount = 3;
    const by = "val";

    const output = findClosestNumbersBy({ searchedArray, searchedNumber, amount, by });

    assert.deepEqual(output, []);
  });

  it("Handles smaller searchedArray than amount", () => {
    const searchedArray = Array.from({ length: 3 }).map((_, index) => ({ val: index }));
    const searchedNumber = 15;
    const amount = 5;
    const by = "val";

    const output = findClosestNumbersBy({ searchedArray, searchedNumber, amount, by });

    assert.deepEqual(output, [{ val: 2 }, { val: 1 }, { val: 0 }]);
  });

  it("Handles searchedNumber smaller than smallest number of searchedArray", () => {
    const searchedArray = Array.from({ length: 100 }).map((_, index) => ({ val: index }));
    const searchedNumber = -15;
    const amount = 3;
    const by = "val";

    const output = findClosestNumbersBy({ searchedArray, searchedNumber, amount, by });

    assert.deepEqual(output, [{ val: 0 }, { val: 1 }, { val: 2 }]);
  });

  it("Handles searchedNumber bigger than biggest number of searchedArray", () => {
    const searchedArray = Array.from({ length: 100 }).map((_, index) => ({ val: index }));
    const searchedNumber = 1000;
    const amount = 3;
    const by = "val";

    const output = findClosestNumbersBy({ searchedArray, searchedNumber, amount, by });

    assert.deepEqual(output, [{ val: 99 }, { val: 98 }, { val: 97 }]);
  });

  it("Handles searchedNumber equality", () => {
    const searchedArray = Array.from({ length: 100 }).map(() => ({ val: 0.5 }));
    const searchedNumber = 0.5;
    const amount = 3;
    const by = "val";

    const output = findClosestNumbersBy({ searchedArray, searchedNumber, amount, by });

    assert.deepEqual(output, [{ val: 0.5 }, { val: 0.5 }, { val: 0.5 }]);
  });
});
