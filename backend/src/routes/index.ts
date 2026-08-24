import { Application } from "express";
import { AuthController } from "../app/auth/controller/authController.js";
import { authMiddleware } from "../middleware/AuthMiddleware.js";
import { requireRole } from "../middleware/RoleMiddleware.js";
import * as inventoryController from "../app/inventory/controller/inventoryController.js";
import * as saleController from "../app/sales/controller/saleController.js";
import * as shopIncomingController from "../app/shopIncoming/controller/ShopIncomingController.js";
import * as warehouseIncomingController from "../app/warehouseIncoming/controller/WarehouseIncomingController.js";
import * as transferController from "../app/transfers/controller/transferController.js";
import * as userController from "../app/users/UserController.js";
import * as stockController from "../app/stock/stockController.js";
import * as partsLogController from "../app/partsLog/controller/partsLogController.js";
import * as stockRequestController from "../app/stockRequests/controller/stockRequestController.js";
import {
  getDashboardAnalytics,
  getDailyReport,
  getWarehouseAnalytics,
} from "../app/analytics/analyticsController.js";

export function registerAPIRoutes(app: Application) {
  const authController = new AuthController();

  // Public Auth Routes
  app.post("/api/auth/login", authController.login);
  app.get("/api/auth/verify", authController.verify);

  // Protected Auth Routes
  app.post("/api/auth/logout", authMiddleware, authController.logout);

  // Analytics Routes
  app.get("/api/analytics/dashboard", authMiddleware, getDashboardAnalytics);
  app.get("/api/analytics/daily", authMiddleware, getDailyReport);
  app.get("/api/analytics/warehouse", authMiddleware, requireRole("admin", "warehouse"), getWarehouseAnalytics);

  // User Management Routes (admin only)
  app.get("/api/users", authMiddleware, requireRole("admin"), userController.getAllUsers);
  app.post("/api/users", authMiddleware, requireRole("admin"), userController.createUser);
  app.patch("/api/users/:id/role", authMiddleware, requireRole("admin"), userController.updateUserRole);
  app.delete("/api/users/:id", authMiddleware, requireRole("admin"), userController.deleteUser);

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

  // Combined Stock Search (shop + warehouse)
  app.get("/api/stock/search", authMiddleware, stockController.searchAllStock);

  // Warehouse Incoming Routes
  app.post("/api/warehouse-incoming/migrate-from-shop", authMiddleware, requireRole("admin"), warehouseIncomingController.migrateFromShop);
  app.get("/api/warehouse-incoming", authMiddleware, requireRole("admin", "warehouse"), warehouseIncomingController.getAllWarehouseIncoming);
  app.post("/api/warehouse-incoming", authMiddleware, requireRole("admin", "warehouse"), warehouseIncomingController.createWarehouseIncoming);
  app.get("/api/warehouse-incoming/search", authMiddleware, requireRole("admin", "warehouse"), warehouseIncomingController.searchAvailable);
  app.get("/api/warehouse-incoming/available", authMiddleware, requireRole("admin", "warehouse"), warehouseIncomingController.getAvailable);
  app.get("/api/warehouse-incoming/:id", authMiddleware, requireRole("admin", "warehouse"), warehouseIncomingController.getWarehouseIncomingById);
  app.patch("/api/warehouse-incoming/:id", authMiddleware, requireRole("admin", "warehouse"), warehouseIncomingController.updateWarehouseIncoming);
  app.patch("/api/warehouse-incoming/:id/restock", authMiddleware, requireRole("admin", "warehouse"), warehouseIncomingController.restockWarehouseIncoming);
  app.delete("/api/warehouse-incoming/:id", authMiddleware, requireRole("admin", "warehouse"), warehouseIncomingController.deleteWarehouseIncoming);
  app.post("/api/warehouse-incoming/:id/entries", authMiddleware, requireRole("admin", "warehouse"), warehouseIncomingController.addEntries);
  app.patch("/api/warehouse-incoming/:id/entries/:serialNumber", authMiddleware, requireRole("admin", "warehouse"), warehouseIncomingController.updateEntry);
  app.delete("/api/warehouse-incoming/:id/entries/:serialNumber", authMiddleware, requireRole("admin", "warehouse"), warehouseIncomingController.deleteEntry);

  // Transfer Routes
  app.get("/api/transfers", authMiddleware, transferController.getAllTransfers);
  app.post("/api/transfers", authMiddleware, requireRole("admin", "warehouse", "shop"), transferController.createTransfer);
  app.get("/api/transfers/:id", authMiddleware, transferController.getTransferById);
  app.patch("/api/transfers/:id/approve", authMiddleware, requireRole("admin", "shop", "warehouse"), transferController.approveTransfer);
  app.patch("/api/transfers/:id/reject", authMiddleware, requireRole("admin", "shop", "warehouse"), transferController.rejectTransfer);
  app.patch("/api/transfers/:id/cancel", authMiddleware, requireRole("admin", "warehouse"), transferController.cancelTransfer);

  // Shop Incoming Routes (shop + admin only — stock enters via warehouse)
  app.get("/api/shop-incoming", authMiddleware, requireRole("admin", "shop"), shopIncomingController.getAllShopIncoming);
  app.post("/api/shop-incoming", authMiddleware, requireRole("admin", "shop"), shopIncomingController.createShopIncoming);
  app.get("/api/shop-incoming/search", authMiddleware, requireRole("admin", "shop"), shopIncomingController.searchAvailable);
  app.get("/api/shop-incoming/available", authMiddleware, requireRole("admin", "shop"), shopIncomingController.getAvailable);
  app.get("/api/shop-incoming/:id", authMiddleware, requireRole("admin", "shop"), shopIncomingController.getShopIncomingById);
  app.patch("/api/shop-incoming/:id", authMiddleware, requireRole("admin", "shop"), shopIncomingController.updateShopIncoming);
  app.patch("/api/shop-incoming/:id/restock", authMiddleware, requireRole("admin", "shop"), shopIncomingController.restockShopIncoming);
  app.delete("/api/shop-incoming/:id", authMiddleware, requireRole("admin", "shop"), shopIncomingController.deleteShopIncoming);
  app.post("/api/shop-incoming/:id/entries", authMiddleware, requireRole("admin", "shop"), shopIncomingController.addEntries);
  app.patch("/api/shop-incoming/:id/entries/:serialNumber", authMiddleware, requireRole("admin", "shop"), shopIncomingController.updateEntry);
  app.delete("/api/shop-incoming/:id/entries/:serialNumber", authMiddleware, requireRole("admin", "shop"), shopIncomingController.deleteEntry);

  // Stock Request Routes (shop requests availability, warehouse responds)
  app.get("/api/stock-requests", authMiddleware, stockRequestController.getAllStockRequests);
  app.post("/api/stock-requests", authMiddleware, requireRole("admin", "shop"), stockRequestController.createStockRequest);
  app.post("/api/stock-requests/seen", authMiddleware, stockRequestController.markStockRequestsAsSeen);
  app.get("/api/stock-requests/:id", authMiddleware, stockRequestController.getStockRequestById);
  app.patch("/api/stock-requests/:id/respond", authMiddleware, requireRole("admin", "warehouse"), stockRequestController.respondToStockRequest);
}
