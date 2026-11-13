const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DB_PATH = path.join(__dirname, "..", "db.json");

const createEmptyDb = () => ({ users: [] });

const readDb = () => {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(createEmptyDb(), null, 2));
  }

  const raw = fs.readFileSync(DB_PATH, "utf-8");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.users) {
      parsed.users = [];
    }
    return parsed;
  } catch (error) {
    const fallback = createEmptyDb();
    fs.writeFileSync(DB_PATH, JSON.stringify(fallback, null, 2));
    return fallback;
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  return data;
};

const ensureDefaultUser = () => {
  const db = readDb();

  if (db.users.length === 0) {
    db.users.push({
      id: "user-1",
      username: "admin",
      password: bcrypt.hashSync("123456", 10),
      todos: [
        {
          id: "todo-1",
          name: "Learn React",
          priority: "high",
          completed: false,
        },
        {
          id: "todo-2",
          name: "Complete homework",
          priority: "medium",
          completed: true,
        },
      ],
    });

    writeDb(db);
    console.log("✅ Default admin user created in db.json");
  }
};

module.exports = {
  readDb,
  writeDb,
  ensureDefaultUser,
};
