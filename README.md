Color coded logger for JavaScript/TypeScript. Works on Browser and Node.

- [Install](#install)
- [Basic usage](#basic-usage)
- [Next.js integration sample](#nextjs-integration-sample)

## Install

Using NPM:

```bash
npm i @emmgfx/logger
```

## Basic usage

The usage is so simple:

```js
// Import it:
import { createLogger, loggerConfig } from "@emmgfx/logger";

// Initialize it:
loggerConfig.init({ enabled: true });

// Create a logger for your component, script, whatever:
const logger = createLogger("Login button");

// And use it:
logger.log("Clicked");
```

## Methods

| Method         | Description                                   |
| -------------- | --------------------------------------------- |
| `log`          | Logs a message with the logger label.         |
| `warn`         | Logs a warning message with the logger label. |
| `error`        | Logs an error message with the logger label.  |
| `group`        | Starts a new log group with the logger label. |
| `groupEnd`     | Ends the current log group.                   |
| `createBuffer` | See more about [Buffers](#buffers)            |

## Buffers

The buffer feature allows you to collect multiple log messages and output them together as a group. This is useful when you want to batch related logs and display them at once, instead of logging each message immediately. For example, you can collect logs during a process and flush them all together for better readability.

### Usage Example

```js
const logger = createLogger("MyComponent");
const buffer = logger.createBuffer("Batch logs");
buffer.add("First message");
buffer.add("Second message", { some: "data" });
// ... add more logs as needed
buffer.flush(); // Outputs all buffered logs as a group
```

### Buffer Methods

| Method  | Description                                                                |
| ------- | -------------------------------------------------------------------------- |
| `add`   | Adds a message to the buffer. Accepts any arguments as with `console.log`. |
| `flush` | Outputs all buffered messages as a group and clears the buffer.            |

## Next.js integration sample:

### instrumentation.js

```js
import { loggerConfig } from "@emmgfx/logger";
// ...
loggerConfig.init({
  enabled: process.env.NEXT_PUBLIC_LOGGER_ENABLED === "true",
  serverColors: false, // Default to false
});
```

### instrumentation-client.js

```js
import { loggerConfig } from "@emmgfx/logger";
// ...
loggerConfig.init({
  enabled: process.env.NEXT_PUBLIC_LOGGER_ENABLED === "true",
});
```

### Usage, both on the server and on the client

```js
import { createLogger } from "@emmgfx/logger";
// ...
const logger = createLogger("Layout");
logger.log("On client or server");
```
