const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    date: {
      createdAt: {
        type: Date,
        default: Date.now,
      },
      deadline: {
        type: Date,
        required: true,
      },
    },
  },
  { _id: true },
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    todos: [todoSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
