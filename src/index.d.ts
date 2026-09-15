export interface Logger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  group: (...args: any[]) => void;
  groupEnd: () => void;
  /**
   * Logs a message that costs real work to build. The function is called
   * only if logging is enabled, so nothing is computed while it is off.
   * Its return value is logged as a single argument.
   */
  expensive: (build: () => unknown) => void;
  createBuffer: (label: string) => {
    add: (...args: any[]) => void;
    flush: () => void;
  };
}

export interface LoggerInitOptions {
  enabled?: boolean;
  serverColors?: boolean;
}

export const loggerConfig: {
  init: (options?: LoggerInitOptions) => void;
  enable: () => void;
  disable: () => void;
  readonly status: boolean;
};

export function createLogger(source: string): Logger;
