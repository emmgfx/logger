export interface Logger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  group: (...args: any[]) => void;
  /**
   * Like `group`, but the group starts collapsed in the browser console.
   * Node prints it the same as `group`. Close it with `groupEnd`.
   */
  groupCollapsed: (...args: any[]) => void;
  groupEnd: () => void;
  /**
   * Logs a message that costs real work to build. The function is called
   * only if logging is enabled, so nothing is computed while it is off.
   * Its return value is logged as a single argument.
   */
  expensive: (build: () => unknown) => void;
  createBuffer: (label: string, options?: BufferOptions) => {
    add: (...args: any[]) => void;
    flush: () => void;
  };
}

export interface BufferOptions {
  /**
   * Flush the buffer as a collapsed group (`console.groupCollapsed`).
   * Defaults to `false`.
   */
  collapsed?: boolean;
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
