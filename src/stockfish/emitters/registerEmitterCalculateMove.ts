import { Readable, Writable } from "node:stream";

const MIN_ELO = 1320;
const MAX_ELO = 3190;

const chessEngineCheckReadiness = async (stdin: Writable, stdout: Readable) => {
  stdin.write("isready\n");

  await new Promise<boolean>((resolve, reject) => {
    const checkIsReady = (data: unknown) => {
      const matchedReadyOk = String(data).includes("readyok");

      if (matchedReadyOk) {
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

function flushReadable(readable: Readable) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const chunk: unknown = readable.read();
    // Will eventually return null when there's nothing more to read
    if (chunk === null) return;
  }
}

const clamp = (currVal: number, minVal = 0, maxVal = 1) =>
  Math.min(maxVal, Math.max(minVal, currVal));
const linearInterpolation = (minVal: number, maxVal: number, currVal: number) =>
  minVal * (1 - currVal) + maxVal * currVal;
const inverseLinearInterpolation = (minVal: number, maxVal: number, currVal: number) =>
  clamp((currVal - minVal) / (maxVal - minVal));

// Adjust chess engine strength based on perceived advantage
const chessEngineAdjustStrength = (stdin: Writable, stdout: Readable) => {
  stdin.write("go depth 1\n");

  return new Promise<void>((resolve, reject) => {
    const adjustStrength = (data: unknown) => {
      const stringifiedData = String(data);

      const matchedInfo = stringifiedData.includes("info depth 1");
      if (!matchedInfo) return;

      // https://github.com/official-stockfish/Stockfish/wiki/Stockfish-FAQ#interpretation-of-the-stockfish-evaluation
      const stringifiedCpScore = stringifiedData.match(/cp -*\d*/)?.[0].split(" ")[1];

      if (!stringifiedCpScore) {
        reject(new Error("chess-engine stringifiedCpScore is undefined"));
        return;
      }

      // Interpolate ELO based on perceived chance of victory (from min possible, to maxPossible)
      const cpScore = Number(stringifiedCpScore);
      // Cp score of 100 means 100% perceived chance of victory
      const perceivedChanceOfVictory = inverseLinearInterpolation(-100, 100, cpScore);
      // Reversed, because the ELO should be lower for higher chances of victory
      const newElo = linearInterpolation(MAX_ELO, MIN_ELO, perceivedChanceOfVictory);
      stdin.write(`setoption name UCI_Elo value ${newElo}\n`);

      flushReadable(stdout);

      stdout.removeListener("data", adjustStrength);
      resolve();
    };

    stdout.on("data", adjustStrength);
    setTimeout(() => {
      stdout.removeListener("data", adjustStrength);
      reject(new Error("chess-engine timed out waiting for adjustStrength"));
    }, 3000);
  });
};

const chessEngineCalculateMove = (stdin: Writable, stdout: Readable) => {
  stdin.write("go depth 12\n");

  return new Promise<string>((resolve, reject) => {
    const checkBestMove = (data: unknown) => {
      const stringifiedData = String(data);

      const matchedBestMove = stringifiedData.includes("bestmove");
      if (!matchedBestMove) return;

      const calculatedMove = stringifiedData.split(" ")[1];

      if (!calculatedMove) {
        reject(new Error("chess-engine calculatedMove is undefined"));
        return;
      }

      stdout.removeListener("data", checkBestMove);
      resolve(calculatedMove);
    };

    stdout.on("data", checkBestMove);
    setTimeout(() => {
      stdout.removeListener("data", checkBestMove);
      reject(new Error("chess-engine timed out waiting for calculatedMove"));
    }, 3000);
  });
};

// There is a possibility of synchronization issues if chess engine would take a long time to respond
// In practice, chess engine responds much faster than what would be problematic
export const registerEmitterCalculateMove =
  (stdin: Writable, stdout: Readable) => async (positionFen: string) => {
    stdin.write("ucinewgame\n");
    // check if chess-engine is ready to calculate move
    await chessEngineCheckReadiness(stdin, stdout);

    // Load position to engine
    stdin.write(`position fen ${positionFen}\n`);

    await chessEngineAdjustStrength(stdin, stdout);

    return chessEngineCalculateMove(stdin, stdout);
  };
