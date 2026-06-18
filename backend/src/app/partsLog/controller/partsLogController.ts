import { Request, Response } from "express";
import { PartsLogService } from "../services/PartsLogService.js";
import catchAsync from "../../../utils/catchAsync.js";

const service = new PartsLogService();

export const getAllPartsLogs = catchAsync(async (req: Request, res: Response) => {
  const shopIncomingId = req.query["shopIncomingId"] as string | undefined;
  const serialNumber = req.query["serialNumber"] as string | undefined;

  const filters: { shopIncomingId?: string; serialNumber?: string } = {};
  if (shopIncomingId) filters.shopIncomingId = shopIncomingId;
  if (serialNumber) filters.serialNumber = serialNumber;

  const results = await service.getAll(filters);
  res.status(200).json({ status: "success", data: results });
});
