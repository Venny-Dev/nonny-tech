import mongoose, { Document, Model } from "mongoose";

export interface ISerialNumberEntry {
  _id: mongoose.Types.ObjectId;
  serialNumber: string;
  condition: string[];
  status: "available" | "sold";
  dateSold: Date | null;
}

export interface IShopIncomingRecord extends Document {
  modelNumber: string;
  processor: string;
  ram: string;
  storage: string;
  quantity: number;
  chargerQuantity: number;
  serialNumberEntries: ISerialNumberEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const serialNumberEntrySchema = new mongoose.Schema<ISerialNumberEntry>({
  serialNumber: { type: String, required: [true, "Serial number is required"] },
  condition: { type: [String], default: ["ok"] },
  status: { type: String, enum: ["available", "sold"], default: "available" },
  dateSold: { type: Date, default: null },
});

const shopIncomingSchema = new mongoose.Schema<IShopIncomingRecord>(
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

const ShopIncoming: Model<IShopIncomingRecord> =
  mongoose.model<IShopIncomingRecord>("ShopIncoming", shopIncomingSchema);

export default ShopIncoming;
