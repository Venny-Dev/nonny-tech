import mongoose, { Document, Model } from "mongoose";

export interface IInventory extends Document {
  name: string;
  modelNumber: string;
  serialNumber: string;
  processor: string;
  ram: string;
  storage: string;
  price: number;
  quantity: number;
  chargerQuantity: number;
  status: "available" | "sold";
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new mongoose.Schema<IInventory>(
  {
    name: { type: String, required: [true, "Name is required"] },
    modelNumber: { type: String, required: [true, "Model number is required"] },
    serialNumber: {
      type: String,
      required: [true, "Serial number is required"],
      unique: true,
    },
    processor: { type: String, required: [true, "Processor is required"] },
    ram: { type: String, required: [true, "RAM is required"] },
    storage: { type: String, required: [true, "Storage is required"] },
    price: { type: Number, required: [true, "Price is required"], min: 0 },
    quantity: { type: Number, default: 1, min: 1 },
    chargerQuantity: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["available", "sold"], default: "available" },
  },
  { timestamps: true },
);

const Inventory: Model<IInventory> = mongoose.model<IInventory>(
  "Inventory",
  inventorySchema,
);

export default Inventory;
