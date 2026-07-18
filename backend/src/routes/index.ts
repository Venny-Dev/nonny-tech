import { Application } from "express";
import { AuthController } from "../app/auth/controller/authController.js";
import { authMiddleware } from "../middleware/AuthMiddleware.js";
import * as inventoryController from "../app/inventory/controller/inventoryController.js";
import * as saleController from "../app/sales/controller/saleController.js";
import { getDashboardAnalytics } from "../app/analytics/analyticsController.js";
import * as shopIncomingController from "../app/shopIncoming/controller/ShopIncomingController.js";
import * as partsLogController from "../app/partsLog/controller/partsLogController.js";

export function registerAPIRoutes(app: Application) {
  const authController = new AuthController();

  // Public Auth Routes
  app.post("/api/auth/login", authController.login);
  app.get("/api/auth/verify", authController.verify);

  // Protected Auth Routes
  app.post("/api/auth/logout", authMiddleware, authController.logout);

  // Analytics Routes
  app.get("/api/analytics/dashboard", authMiddleware, getDashboardAnalytics);

  // Inventory Routes
  app.get("/api/inventory", authMiddleware, inventoryController.getAllInventory);
  app.get("/api/inventory/available", authMiddleware, inventoryController.getAvailableInventory);
  app.get("/api/inventory/serial/:serialNumber", authMiddleware, inventoryController.getInventoryBySerialNumber);
  app.get("/api/inventory/:id", authMiddleware, inventoryController.getInventoryById);
  app.post("/api/inventory", authMiddleware, inventoryController.createInventory);
  app.patch("/api/inventory/:id", authMiddleware, inventoryController.updateInventory);
  app.delete("/api/inventory/:id", authMiddleware, inventoryController.deleteInventory);

  // Sales Routes
  app.get("/api/sales", authMiddleware, saleController.getAllSales);
  app.get("/api/sales/:id", authMiddleware, saleController.getSaleById);
  app.post("/api/sales", authMiddleware, saleController.createSale);
  app.patch("/api/sales/:id/status", authMiddleware, saleController.updateSaleStatus);
  app.delete("/api/sales/:id", authMiddleware, saleController.deleteSale);

  // Parts Log Routes
  app.get("/api/parts", authMiddleware, partsLogController.getAllPartsLogs);

  // Shop Incoming Routes
  app.get("/api/shop-incoming", authMiddleware, shopIncomingController.getAllShopIncoming);
  app.post("/api/shop-incoming", authMiddleware, shopIncomingController.createShopIncoming);
  app.get("/api/shop-incoming/search", authMiddleware, shopIncomingController.searchAvailable);
  app.get("/api/shop-incoming/available", authMiddleware, shopIncomingController.getAvailable);
  app.get("/api/shop-incoming/:id", authMiddleware, shopIncomingController.getShopIncomingById);
  app.patch("/api/shop-incoming/:id", authMiddleware, shopIncomingController.updateShopIncoming);
  app.delete("/api/shop-incoming/:id", authMiddleware, shopIncomingController.deleteShopIncoming);
  app.post("/api/shop-incoming/:id/entries", authMiddleware, shopIncomingController.addEntries);
  app.patch("/api/shop-incoming/:id/entries/:serialNumber", authMiddleware, shopIncomingController.updateEntry);
  app.delete("/api/shop-incoming/:id/entries/:serialNumber", authMiddleware, shopIncomingController.deleteEntry);
}
