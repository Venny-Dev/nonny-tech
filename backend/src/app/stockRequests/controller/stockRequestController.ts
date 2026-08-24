import { Request, Response } from "express";
import { StockRequestService } from "../services/StockRequestService.js";
import catchAsync from "../../../utils/catchAsync.js";

const service = new StockRequestService();

export const createStockRequest = catchAsync(async (req: Request, res: Response) => {
  const request = await service.create(req.body, req.user._id.toString());
  res.status(201).json({ status: "success", data: request });
});

export const getAllStockRequests = catchAsync(async (req: Request, res: Response) => {
  const requests = await service.getAll(req.user.role, req.user._id.toString());
  res.status(200).json({ status: "success", data: requests });
});

export const getStockRequestById = catchAsync(async (req: Request, res: Response) => {
  const request = await service.getById(req.params["id"] as string);
  res.status(200).json({ status: "success", data: request });
});

export const respondToStockRequest = catchAsync(async (req: Request, res: Response) => {
  const request = await service.respond(
    req.params["id"] as string,
    req.body,
    req.user._id.toString(),
  );
  res.status(200).json({ status: "success", data: request });
});

export const markStockRequestsAsSeen = catchAsync(async (req: Request, res: Response) => {
  await service.markAsSeen(req.user._id.toString());
  res.status(200).json({ status: "success" });
});
