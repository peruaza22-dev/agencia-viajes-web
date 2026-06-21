import process from 'process';

declare global {
  var process: typeof process;
}

globalThis.process = process;
