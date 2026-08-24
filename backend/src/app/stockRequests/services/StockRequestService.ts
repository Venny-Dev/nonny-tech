import mongoose from "mongoose";
import StockRequest, { IStockRequest, StockRequestStatus } from "../models/StockRequest.js";
import WarehouseIncoming from "../../warehouseIncoming/models/WarehouseIncoming.js";
import AppError from "../../../utils/AppError.js";

interface CreateRequestData {
  modelNumber: string;
  quantity?: number;
  note?: string;
}

interface RespondData {
  status: "available" | "unavailable";
  availableCount?: number;
  responseNote?: string;
}

export class StockRequestService {
  async create(data: CreateRequestData, userId: string): Promise<IStockRequest> {
    if (!data.modelNumber || !data.modelNumber.trim()) {
      throw new AppError("Model number is required", 400);
    }

    const request = await StockRequest.create({
      modelNumber: data.modelNumber.trim(),
      quantity: data.quantity,
      note: data.note,
      status: "pending",
      requestedBy: userId,
    });

    return (await this.populateRequest(request))!;
  }

  async respond(
    id: string,
    data: RespondData,
    userId: string,
  ): Promise<IStockRequest> {
    const request = await StockRequest.findById(id);
    if (!request) throw new AppError("Stock request not found", 404);
    if (request.status !== "pending") {
      throw new AppError(
        `Cannot respond to a request that is already ${request.status}`,
        409,
      );
    }

    if (data.status === "available") {
      if (data.availableCount !== undefined) {
        const warehouseRecords = await WarehouseIncoming.find({
          modelNumber: request.modelNumber,
        });
        const totalAvailable = warehouseRecords.reduce((sum, r) => {
          const available = r.serialNumberEntries.filter(
            (e) => e.status === "available",
          ).length;
          return sum + available;
        }, 0);

        if (data.availableCount > totalAvailable) {
          throw new AppError(
            `Only ${totalAvailable} units available in warehouse (you said ${data.availableCount})`,
            400,
          );
        }
      }
    }

    request.status = data.status;
    request.availableCount = data.availableCount;
    request.responseNote = data.responseNote;
    request.respondedBy = new (await import("mongoose")).default.Types.ObjectId(userId);
    request.respondedAt = new Date();
    await request.save();

    return (await this.populateRequest(request))!;
  }

  async getAll(
    viewerRole: string,
    viewerId: string,
  ): Promise<IStockRequest[]> {
    let query: Record<string, unknown> = {};

    if (viewerRole === "shop") {
      // Shop users see their own requests
      query = { requestedBy: viewerId };
    }
    // admin and warehouse see all

    return await StockRequest.find(query)
      .sort({ createdAt: -1 })
      .populate("requestedBy", "firstName lastName email")
      .populate("respondedBy", "firstName lastName email");
  }

  async getById(id: string): Promise<IStockRequest> {
    const request = await StockRequest.findById(id)
      .populate("requestedBy", "firstName lastName email")
      .populate("respondedBy", "firstName lastName email");
    if (!request) throw new AppError("Stock request not found", 404);
    return request;
  }

  async markAsSeen(userId: string): Promise<void> {
    await StockRequest.updateMany(
      { requestedBy: new mongoose.Types.ObjectId(userId), status: { $ne: "pending" }, seenByRequester: false },
      { $set: { seenByRequester: true } },
    );
  }

  private async populateRequest(request: IStockRequest) {
    return await StockRequest.findById(request._id)
      .populate("requestedBy", "firstName lastName email")
      .populate("respondedBy", "firstName lastName email");
  }
}
