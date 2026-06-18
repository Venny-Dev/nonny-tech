import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError.js";

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, any>;
  errors?: Record<string, any>;
  path?: string;
  value?: any;
}

const handleCastErrorDB = (err: MongoError): AppError =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateFieldsDB = (err: MongoError): AppError => {
  const field = Object.keys(err.keyValue || {})[0];
  const value = err.keyValue?.[field];
  return new AppError(`Duplicate field value: "${value}". Please use another value for ${field}!`, 400);
};

const handleValidationErrorDB = (err: MongoError): AppError => {
  const errors = Object.values(err.errors || {}).map((v: any) => v.message);
  return new AppError(`Invalid input data: ${errors.join(". ")}`, 400);
};

const handleJWTError = (): AppError =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = (): AppError =>
  new AppError("Your token has expired. Please log in again!", 401);

const sendErrorDev = (error: AppError, res: Response): void => {
  res.status(error.statusCode).json({
    status: error.status,
    error,
    message: error.message,
    stack: error.stack,
  });
};

const sendErrorProd = (error: AppError, res: Response): void => {
  if (error.isOperational) {
    res.status(error.statusCode).json({ status: error.status, message: error.message });
  } else {
    console.error("ERROR 💥", error);
    res.status(500).json({ status: "error", message: "Something went very wrong!" });
  }
};

const globalErrorHandler = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(error, res);
  } else {
    let err = { ...error, message: error.message, name: error.name };
    if (error.name === "CastError") err = handleCastErrorDB(error);
    if (error.code === 11000) err = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError") err = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") err = handleJWTError();
    if (error.name === "TokenExpiredError") err = handleJWTExpiredError();
    sendErrorProd(err, res);
  }
};

export default globalErrorHandler;
