const log = (level, message, meta = {}) => {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(line);
    return;
  }

  // eslint-disable-next-line no-console
  console.log(line);
};

export const logger = {
  info: (message, meta) => log("info", message, meta),
  warn: (message, meta) => log("warn", message, meta),
  error: (message, meta) => log("error", message, meta)
};
