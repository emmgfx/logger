export interface Logger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  group: (...args: any[]) => void;
  groupEnd: () => void;
  createBuffer: (label: string) => {
    add: (...args: any[]) => void;
    flush: () => void;
  };
}

export const loggerConfig: {
  enable: () => void;
  disable: () => void;
  readonly status: boolean;
};

export function createLogger(source: string): Logger;
