import mongoose, { Document, Model } from "mongoose";

export type TransferStatus = "pending" | "approved" | "rejected" | "cancelled";
export type TransferDirection = "warehouse_to_shop" | "shop_to_warehouse";

export interface ITransferEntry {
  serialNumber: string;
  condition: string[];
  modelNumber: string;
  processor: string;
  ram: string;
  storage: string;
  chargerQuantity: number;
  warehouseEntryId?: mongoose.Types.ObjectId;
  shopEntryId?: mongoose.Types.ObjectId;
}

export interface ITransferRequest extends Document {
  warehouseRecordId?: mongoose.Types.ObjectId;
  shopRecordId?: mongoose.Types.ObjectId;
  direction: TransferDirection;
  entries: ITransferEntry[];
  status: TransferStatus;
  requestedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  requestedAt: Date;
  respondedAt?: Date;
  note?: string;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transferEntrySchema = new mongoose.Schema<ITransferEntry>(
  {
    serialNumber: { type: String, required: [true, "Serial number is required"] },
    condition: { type: [String], default: ["ok"] },
    modelNumber: { type: String, required: [true, "Model number is required"] },
    processor: { type: String, required: [true, "Processor is required"] },
    ram: { type: String, required: [true, "RAM is required"] },
    storage: { type: String, required: [true, "Storage is required"] },
    chargerQuantity: { type: Number, default: 0, min: 0 },
    warehouseEntryId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    shopEntryId: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { _id: false },
);

const transferRequestSchema = new mongoose.Schema<ITransferRequest>(
  {
    warehouseRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WarehouseIncoming",
    },
    shopRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopIncoming",
    },
    direction: {
      type: String,
      enum: ["warehouse_to_shop", "shop_to_warehouse"],
      default: "warehouse_to_shop",
    },
    entries: { type: [transferEntrySchema], default: [] },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "requestedBy is required"],
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    requestedAt: { type: Date, default: Date.now },
    respondedAt: { type: Date, default: null },
    note: String,
    reason: String,
  },
  { timestamps: true },
);

const TransferRequest: Model<ITransferRequest> =
  mongoose.model<ITransferRequest>("TransferRequest", transferRequestSchema);

export default TransferRequest;
