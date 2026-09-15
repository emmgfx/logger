Color coded logger for JavaScript/TypeScript. Works on Browser and Node.

- [Install](#install)
- [Basic usage](#basic-usage)
- [Configuration](#configuration)
- [Methods](#methods)
- [Expensive messages](#expensive-messages)
- [Buffers](#buffers)
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

## Configuration

Logging is disabled by default, so nothing is printed until you enable it.

| Method                 | Description                                              |
| ---------------------- | -------------------------------------------------------- |
| `init(options?)`       | Sets the options given. Keys left out are not modified.  |
| `enable()`             | Enables logging.                                         |
| `disable()`            | Disables logging.                                        |
| `status`               | Read-only. Whether logging is currently enabled.         |

### Options

| Option         | Default | Description                                                                    |
| -------------- | ------- | ------------------------------------------------------------------------------ |
| `enabled`      | `false` | Whether messages are printed at all.                                           |
| `serverColors` | `false` | ANSI colors for labels outside the browser. Leave off when the output is not a terminal, such as a log file or a collector. |

Configuration is global and can be changed at any time, including after your
loggers have been created.

## Methods

| Method         | Description                                   |
| -------------- | --------------------------------------------- |
| `log`          | Logs a message with the logger label.         |
| `warn`         | Logs a warning message with the logger label. |
| `error`        | Logs an error message with the logger label.  |
| `group`        | Starts a new log group with the logger label. |
| `groupEnd`     | Ends the current log group.                   |
| `expensive`    | See more about [Expensive messages](#expensive-messages) |
| `createBuffer` | See more about [Buffers](#buffers)            |

## Expensive messages

Building a log message sometimes costs real work: serializing a big object, reading layout from the DOM, walking a long list. That work happens even when logging is disabled, because the argument is built before `log` ever runs:

```js
// state is serialized on every call, printed or not
logger.log("state", JSON.stringify(state));
```

`expensive` takes a function instead of a value, and only calls it if logging is enabled:

```js
// serialized only when logging is on
logger.expensive(() => `state: ${JSON.stringify(state)}`);
```

Whatever the function returns is logged as a single argument, so return a string or an object rather than a list of values.

Reach for it when the message is costly to build **and** the code runs often — inside a render, a scroll handler, a loop. For plain values it is not worth it: `logger.log("saved", id)` is already free, and wrapping it in a function costs more than the value itself.

Two notes. If the function throws, the error is reported and swallowed: turning the logger on never breaks what works with it off. And unlike the other methods, `expensive` reports the library as the source of the message in devtools instead of your own file, because the returned value has to be unwrapped before printing.

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
