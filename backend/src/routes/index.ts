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
  app.post("/api/auth/signup", authController.signup);
  app.post("/api/auth/login", authController.login);
  app.post("/api/auth/forgot-password", authController.forgotPassword);
  app.patch("/api/auth/reset-password/:token", authController.resetPassword);
  app.patch("/api/auth/verify-email/:token", authController.verifyEmail);

  // Protected Auth Routes
  app.post("/api/auth/logout", authMiddleware, authController.logout);
  app.get("/api/auth/me", authMiddleware, authController.getMe);

  // Analytics Routes
  app.get("/api/analytics/dashboard", getDashboardAnalytics);

  // Inventory Routes
  app.get("/api/inventory", inventoryController.getAllInventory);
  app.get("/api/inventory/available", inventoryController.getAvailableInventory);
  app.get("/api/inventory/serial/:serialNumber", inventoryController.getInventoryBySerialNumber);
  app.get("/api/inventory/:id", inventoryController.getInventoryById);
  app.post("/api/inventory", inventoryController.createInventory);
  app.patch("/api/inventory/:id", inventoryController.updateInventory);
  app.delete("/api/inventory/:id", inventoryController.deleteInventory);

  // Sales Routes
  app.get("/api/sales", saleController.getAllSales);
  app.get("/api/sales/:id", saleController.getSaleById);
  app.post("/api/sales", saleController.createSale);
  app.patch("/api/sales/:id/status", saleController.updateSaleStatus);
  app.delete("/api/sales/:id", saleController.deleteSale);

  // Parts Log Routes
  app.get("/api/parts", partsLogController.getAllPartsLogs);

  // Shop Incoming Routes
  app.get("/api/shop-incoming", shopIncomingController.getAllShopIncoming);
  app.post("/api/shop-incoming", shopIncomingController.createShopIncoming);
  app.get("/api/shop-incoming/search", shopIncomingController.searchAvailable);
  app.get("/api/shop-incoming/available", shopIncomingController.getAvailable);
  app.get("/api/shop-incoming/:id", shopIncomingController.getShopIncomingById);
  app.patch("/api/shop-incoming/:id", shopIncomingController.updateShopIncoming);
  app.delete("/api/shop-incoming/:id", shopIncomingController.deleteShopIncoming);
  app.post("/api/shop-incoming/:id/entries", shopIncomingController.addEntries);
  app.patch("/api/shop-incoming/:id/entries/:serialNumber", shopIncomingController.updateEntry);
  app.delete("/api/shop-incoming/:id/entries/:serialNumber", shopIncomingController.deleteEntry);
}
