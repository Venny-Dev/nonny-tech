import mongoose, { Document, Model } from "mongoose";

export interface IReturnHistoryEntry {
  reason: string;
  returnedAt: Date;
  returnedBy: mongoose.Types.ObjectId;
}

export interface IWarehouseSerialNumberEntry {
  _id: mongoose.Types.ObjectId;
  serialNumber: string;
  condition: string[];
  status: "available" | "transferred" | "sold";
  dateSold: Date | null;
  returnHistory: IReturnHistoryEntry[];
}

export interface IWarehouseIncomingRecord extends Document {
  modelNumber: string;
  processor: string;
  ram: string;
  storage: string;
  quantity: number;
  chargerQuantity: number;
  serialNumberEntries: IWarehouseSerialNumberEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const returnHistorySchema = new mongoose.Schema<IReturnHistoryEntry>({
  reason: { type: String, required: [true, "Reason is required"] },
  returnedAt: { type: Date, default: Date.now },
  returnedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: [true, "returnedBy is required"] },
}, { _id: false });

const serialNumberEntrySchema = new mongoose.Schema<IWarehouseSerialNumberEntry>({
  serialNumber: { type: String, required: [true, "Serial number is required"] },
  condition: { type: [String], default: ["ok"] },
  status: {
    type: String,
    enum: ["available", "transferred", "sold"],
    default: "available",
  },
  dateSold: { type: Date, default: null },
  returnHistory: { type: [returnHistorySchema], default: [] },
});

const warehouseIncomingSchema = new mongoose.Schema<IWarehouseIncomingRecord>(
  {
    modelNumber: { type: String, required: [true, "Model number is required"] },
    processor: { type: String, required: [true, "Processor is required"] },
    ram: { type: String, required: [true, "RAM is required"] },
    storage: { type: String, required: [true, "Storage is required"] },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer",
      },
    },
    chargerQuantity: { type: Number, default: 0, min: 0 },
    serialNumberEntries: { type: [serialNumberEntrySchema], default: [] },
  },
  { timestamps: true },
);

const WarehouseIncoming: Model<IWarehouseIncomingRecord> =
  mongoose.model<IWarehouseIncomingRecord>(
    "WarehouseIncoming",
    warehouseIncomingSchema,
  );

export default WarehouseIncoming;
