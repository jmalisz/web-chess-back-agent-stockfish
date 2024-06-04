import { ChildProcess } from "node:child_process";
import { Writable } from "node:stream";

import { chessEngineLogger } from "@/services/stockfish/config/logger.js";

const decorateStdin = (stdin: Writable) => {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const stdinWrite = stdin.write;

  // Decorate write function with log wrapper
  // eslint-disable-next-line no-param-reassign
  stdin.write = (chunk, ...rest) => {
    // @ts-expect-error https://github.com/microsoft/TypeScript/issues/54539
    const loggingWrite = stdinWrite.apply(stdin, [chunk, ...rest]);

    chessEngineLogger.child({ msgPrefix: "[stdin]" }).info(String(chunk));

    return loggingWrite;
  };
};

export const registerLogMiddleware = (chessEngine: ChildProcess) => {
  const { stdin, stdout, stderr } = chessEngine;

  // Check communication pipes
  if (!stdin || !stdout || !stderr) {
    throw new Error("Communication pipe is undefined in registerLogMiddleware");
  }

  decorateStdin(stdin);

  // Loggers
  chessEngine.on("error", (error) => {
    chessEngineLogger.error(error);
  });
  chessEngine.on("exit", (code) => {
    chessEngineLogger.fatal(`chess-engine exited with code ${code}`);
  });
  stdout.on("data", (data) => {
    chessEngineLogger.child({ msgPrefix: "[stdout]" }).info(String(data));
  });
  stderr.on("data", (data) => {
    chessEngineLogger.child({ msgPrefix: "[stderr]" }).error(String(data));
  });

  return { stdin, stdout, stderr };
};
