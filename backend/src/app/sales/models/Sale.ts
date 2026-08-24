import mongoose, { Document, Model } from "mongoose";

export type PaymentStatus = "pending" | "paid" | "returned";

export type SaleSource = "shop" | "warehouse";

export interface ISale extends Document {
  customerName: string;
  modelNumber: string;
  serialNumber: string;
  processor: string;
  ram: string;
  storage: string;
  chargerQuantity: number;
  condition: string[];
  price: number;
  paymentStatus: PaymentStatus;
  source: SaleSource;
  inventoryItem?: mongoose.Types.ObjectId;
  warehouseRecord?: mongoose.Types.ObjectId;
  soldAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const saleSchema = new mongoose.Schema<ISale>(
  {
    customerName: { type: String, required: [true, 'Customer name is required'], trim: true },
    modelNumber: { type: String, required: [true, "Model number is required"] },
    serialNumber: {
      type: String,
      required: [true, "Serial number is required"],
    },
    processor: { type: String, required: [true, "Processor is required"] },
    ram: { type: String, required: [true, "RAM is required"] },
    storage: { type: String, required: [true, "Storage is required"] },
    chargerQuantity: { type: Number, default: 0, min: 0 },
    condition: {
      type: [String],
      required: [true, "Condition is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price must be at least 0"],
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "returned"],
      default: "pending",
      required: [true, "Payment status is required"],
    },
    source: {
      type: String,
      enum: ["shop", "warehouse"],
      default: "shop",
    },
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopIncoming",
    },
    warehouseRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WarehouseIncoming",
    },
    soldAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const Sale: Model<ISale> = mongoose.model<ISale>("Sale", saleSchema);

export default Sale;
