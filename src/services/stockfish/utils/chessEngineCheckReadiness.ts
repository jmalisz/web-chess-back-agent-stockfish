import { Readable, Writable } from "node:stream";

import { flushReadable } from "./flushReadable.js";

export const chessEngineCheckReadiness = async (stdin: Writable, stdout: Readable) => {
  stdin.write("isready\n");

  await new Promise<boolean>((resolve, reject) => {
    const checkIsReady = (data: unknown) => {
      const matchedReadyOk = String(data).includes("readyok");

      if (matchedReadyOk) {
        flushReadable(stdout);
        stdout.removeListener("data", checkIsReady);
        resolve(matchedReadyOk);
      }
    };

    stdout.on("data", checkIsReady);
    setTimeout(() => {
      stdout.removeListener("data", checkIsReady);
      reject(new Error("chess-engine timed out waiting for isReady"));
    }, 3000);
  });
};
