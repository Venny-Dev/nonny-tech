import mongoose from "mongoose";

export async function createMongooseConnection(uri?: string) {
  const DB =
    uri ||
    process.env.DATABASE?.replace(
      "<PASSWORD>",
      process.env.DATABASE_PASSWORD || "",
    );

  if (!DB) {
    console.log("⚠️ No database connection string found");
    throw new Error("Database connection string is required");
  }

  if (mongoose.connection.readyState === 1) {
    console.log("✅ Database already connected");
    return mongoose.connection;
  }

  await mongoose.connect(DB);
  console.log("✅ Database connected successfully");

  return mongoose.connection;
}

export async function closeMongooseConnection() {
  await mongoose.disconnect();
  console.log("Database connection closed");
}
