import { Request, Response, NextFunction } from "express";
import { TransferService } from "../services/TransferService.js";
import catchAsync from "../../../utils/catchAsync.js";
import AppError from "../../../utils/AppError.js";

const service = new TransferService();

export const createTransfer = catchAsync(async (req: Request, res: Response) => {
  const { direction, reason, ...rest } = req.body;
  const transfer = await service.create(
    { ...rest, direction, reason },
    req.user._id.toString(),
  );
  res.status(201).json({ status: "success", data: transfer });
});

export const getAllTransfers = catchAsync(async (req: Request, res: Response) => {
  const dateFrom = req.query["dateFrom"] as string | undefined;
  const dateTo = req.query["dateTo"] as string | undefined;
  const transfers = await service.getAll(
    req.user.role,
    req.user._id.toString(),
    dateFrom,
    dateTo,
  );
  res.status(200).json({ status: "success", data: transfers });
});

export const getTransferById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const transfer = await service.getById(req.params["id"] as string);
    res.status(200).json({ status: "success", data: transfer });
  },
);

export const approveTransfer = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const transfer = await service.approve(
      req.params["id"] as string,
      req.user._id.toString(),
    );
    if (!transfer) return next(new AppError("Transfer request not found", 404));
    res.status(200).json({ status: "success", data: transfer });
  },
);

export const rejectTransfer = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const transfer = await service.reject(
      req.params["id"] as string,
      req.user._id.toString(),
    );
    if (!transfer) return next(new AppError("Transfer request not found", 404));
    res.status(200).json({ status: "success", data: transfer });
  },
);

export const cancelTransfer = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const transfer = await service.cancel(
      req.params["id"] as string,
      req.user._id.toString(),
    );
    if (!transfer) return next(new AppError("Transfer request not found", 404));
    res.status(200).json({ status: "success", data: transfer });
  },
);
