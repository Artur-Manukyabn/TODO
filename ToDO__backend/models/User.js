const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    text: { type: String, default: "", trim: true },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    completed: { type: Boolean, default: false },
    userId: { type: String, required: true },
  },
  { timestamps: true },
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    todos: { type: [todoSchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
