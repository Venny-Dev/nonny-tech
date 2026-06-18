import mongoose, { Document, Model } from "mongoose";

export type PartType = "ram" | "storage";

export interface IPartsLog extends Document {
  serialNumber: string;
  shopIncomingId: mongoose.Types.ObjectId;
  partType: PartType;
  originalValue: string;
  soldValue: string;
  removedValue: string;
  removedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const partsLogSchema = new mongoose.Schema<IPartsLog>(
  {
    serialNumber: { type: String, required: [true, "Serial number is required"] },
    shopIncomingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopIncoming",
      required: [true, "Shop incoming ID is required"],
    },
    partType: {
      type: String,
      enum: ["ram", "storage"],
      required: [true, "Part type is required"],
    },
    originalValue: { type: String, required: [true, "Original value is required"] },
    soldValue: { type: String, required: [true, "Sold value is required"] },
    removedValue: { type: String, required: [true, "Removed value is required"] },
    removedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const PartsLog: Model<IPartsLog> = mongoose.model<IPartsLog>("PartsLog", partsLogSchema);

export default PartsLog;
