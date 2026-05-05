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
  
  // MEDIUM FIX #2: Standardize error response format
  const errorResponse = {
    status: "error",
    message,
    code: err.code || getErrorCode(statusCode),
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  };

  // Add validation errors if present
  if (err.details) {
    errorResponse.errors = err.details;
  }

  logger.error("request_error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message,
    stack: err.stack
  });

  // Add stack trace in development
  if (process.env.NODE_ENV !== "production") {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

// Helper function to generate error codes
const getErrorCode = (statusCode) => {
  const errorCodes = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    429: "RATE_LIMIT_EXCEEDED",
    500: "INTERNAL_SERVER_ERROR"
  };
  return errorCodes[statusCode] || "UNKNOWN_ERROR";
};
