const mongoose = require("mongoose");

const connectDB = async () => {
  const databaseUrl = process.env.DATABASE_URL || process.env.MONGODB_URI;

  if (!databaseUrl) {
    throw new Error(
      "Missing DATABASE_URL. Add MongoDB connection string to environment variables.",
    );
  }

  if (mongoose.connection.readyState === 1) {
    return;
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(databaseUrl, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000,
  });

  console.log("MongoDB connected successfully");
};

module.exports = connectDB;
