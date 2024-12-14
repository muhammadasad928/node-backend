import { ApiError } from "../utils/apiError.js";

const errorHandler = (err, req, res, next) => {
  // Check if the error is an instance of ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    });
  }

  // For other types of errors (e.g., internal server errors)
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    errors: [],
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

export { errorHandler };
