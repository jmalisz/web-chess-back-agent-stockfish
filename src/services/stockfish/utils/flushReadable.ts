import { Readable } from "node:stream";

export const flushReadable = (readable: Readable) => {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const chunk: unknown = readable.read();
    // Will eventually return null when there's nothing more to read
    if (chunk === null) return;
  }
};
