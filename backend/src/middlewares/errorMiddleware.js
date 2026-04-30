import { logger } from "../utils/logger.js";

export const notFound = (req, res) => {
  res.status(404).json({
    message: "Route not found",
    requestId: req.requestId
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (err.name === "MulterError" ? 400 : 500);
  const message = err.message || "Internal server error";

  logger.error("request_error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message,
    stack: err.stack
  });

  res.status(statusCode).json({
    message,
    requestId: req.requestId,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
  void next;
};
