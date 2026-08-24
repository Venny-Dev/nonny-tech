import { Request, Response, NextFunction } from "express";
import User, { IUser, UserRole } from "../auth/models/User.js";
import catchAsync from "../../utils/catchAsync.js";
import AppError from "../../utils/AppError.js";

const ROLES: UserRole[] = ["admin", "warehouse", "shop"];

export const getAllUsers = catchAsync(async (_req: Request, res: Response) => {
  const users = await User.find().select("email firstName lastName role createdAt");
  res.status(200).json({ status: "success", data: users });
});

export const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password, passwordConfirm, firstName, lastName, role } = req.body;

    if (!email || !password || !passwordConfirm) {
      return next(new AppError("email, password and passwordConfirm are required", 400));
    }

    const roleValue: UserRole = ROLES.includes(role) ? role : "warehouse";

    const user = await User.create({
      email,
      password,
      passwordConfirm,
      firstName,
      lastName,
      role: roleValue,
      isVerified: true,
    });

    res.status(201).json({
      status: "success",
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  },
);

export const updateUserRole = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { role } = req.body;
    if (!ROLES.includes(role)) {
      return next(new AppError(`role must be one of: ${ROLES.join(", ")}`, 400));
    }

    const target = await User.findById(req.params["id"] as string);
    if (!target) return next(new AppError("User not found", 404));

    // Never demote the last admin — avoids locking everyone out
    if (target.role === "admin" && role !== "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return next(new AppError("Cannot demote the last admin", 400));
      }
    }

    target.role = role;
    await target.save();
    res.status(200).json({
      status: "success",
      data: {
        id: target._id,
        email: target.email,
        role: target.role,
        firstName: target.firstName,
        lastName: target.lastName,
      },
    });
  },
);

export const deleteUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findByIdAndDelete(req.params["id"] as string);
    if (!user) return next(new AppError("User not found", 404));
    res.status(204).json({ status: "success", data: null });
  },
);

export type { IUser };
