import Inventory, { IInventory } from "../models/Inventory.js";

export class InventoryService {
  async getAll(): Promise<IInventory[]> {
    return await Inventory.find().sort({ createdAt: -1 });
  }

  async getById(id: string): Promise<IInventory | null> {
    return await Inventory.findById(id);
  }

  async getBySerialNumber(serialNumber: string): Promise<IInventory | null> {
    return await Inventory.findOne({ serialNumber });
  }

  async create(data: Partial<IInventory>): Promise<IInventory> {
    return await Inventory.create(data);
  }

  async update(
    id: string,
    data: Partial<IInventory>,
  ): Promise<IInventory | null> {
    return await Inventory.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id: string): Promise<IInventory | null> {
    return await Inventory.findByIdAndDelete(id);
  }

  async getAvailable(): Promise<IInventory[]> {
    return await Inventory.find({ status: "available" }).sort({
      createdAt: -1,
    });
  }
}
