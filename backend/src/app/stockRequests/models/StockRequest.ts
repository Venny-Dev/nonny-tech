import mongoose, { Document, Model } from "mongoose";

export type StockRequestStatus = "pending" | "available" | "unavailable";

export interface IStockRequest extends Document {
  modelNumber: string;
  quantity?: number;
  note?: string;
  status: StockRequestStatus;
  availableCount?: number;
  responseNote?: string;
  requestedBy: mongoose.Types.ObjectId;
  respondedBy?: mongoose.Types.ObjectId;
  requestedAt: Date;
  respondedAt?: Date;
  seenByRequester: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const stockRequestSchema = new mongoose.Schema<IStockRequest>(
  {
    modelNumber: {
      type: String,
      required: [true, "Model number is required"],
    },
    quantity: {
      type: Number,
      min: [1, "Quantity must be at least 1"],
    },
    note: String,
    status: {
      type: String,
      enum: ["pending", "available", "unavailable"],
      default: "pending",
    },
    availableCount: {
      type: Number,
      min: 0,
    },
    responseNote: String,
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "requestedBy is required"],
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null },
    seenByRequester: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const StockRequest: Model<IStockRequest> =
  mongoose.model<IStockRequest>("StockRequest", stockRequestSchema);

export default StockRequest;
