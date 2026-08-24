import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError.js";
import { UserRole } from "../app/auth/models/User.js";

/**
 * Restrict a route to specific roles.
 * Usage: app.get("/api/...", authMiddleware, requireRole("admin", "warehouse"), handler)
 */
export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError("You are not logged in", 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
