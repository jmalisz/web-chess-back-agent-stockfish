export const chessEngineCheckScore = (chessEngineOutput: unknown) => {
  const stringifiedChessEngineOutput = String(chessEngineOutput);

  const matchedInfo = stringifiedChessEngineOutput.match(/info depth 1/);
  if (!matchedInfo) return;

  const matchedMate = stringifiedChessEngineOutput.match(/mate/);
  if (matchedMate) {
    return 0;
  }

  // https://github.com/official-stockfish/Stockfish/wiki/Stockfish-FAQ#interpretation-of-the-stockfish-evaluation
  const stringifiedCpScore = stringifiedChessEngineOutput.match(/cp -*\d*/)?.[0].split(" ")[1];
  if (!stringifiedCpScore) {
    throw new Error("stringifiedCpScore couldn't be matched");
  }

  // Interpolate ELO based on perceived chance of victory (from min possible, to maxPossible)
  return Number(stringifiedCpScore);
};
