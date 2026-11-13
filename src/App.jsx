import React, { useState, useEffect } from "react";
import API from "./api";

const normalizeTodo = (todo = []) => {
  const list = Array.isArray(todo) ? todo : [todo];

  return list.map((item) => {
    if (!item) return item;

    return {
      ...item,
      id: item.id || item._id,
      _id: item.id || item._id,
      text: item.text ?? item.name ?? "",
      name: item.name ?? item.text ?? "",
      completed: Boolean(item.completed),
      priority: item.priority || "medium",
    };
  });
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Состояния для форм авторизации
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  // Состояния для Todo list
  const [todos, setTodos] = useState([]);
  const [newTodoText, setNewTodoText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // Новое состояние: фильтр ('all' | 'active' | 'completed')
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      API.get("/auth/me")
        .then((res) => {
          setUser(res.data);
          setTodos(normalizeTodo(res.data.todos || []));
        })
        .catch(() => {
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    const endpoint = isLoginView ? "/auth/login" : "/auth/register";
    const payload = isLoginView
      ? { email, password }
      : { username, email, password };

    try {
      const response = await API.post(endpoint, payload);
      localStorage.setItem("token", response.data.token);
      setUser(response.data.user);

      const todosRes = await API.get("/todos");
      setTodos(normalizeTodo(todosRes.data));
    } catch (err) {
      setError(err.response?.data?.message || "Произошла ошибка");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setTodos([]);
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodoText.trim()) return;

    try {
      const res = await API.post("/todos", { text: newTodoText });
      setTodos(normalizeTodo(res.data));
      setNewTodoText("");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const res = await API.put(`/todos/${id}`, { completed: !completed });
      setTodos(normalizeTodo(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  const saveEditTodo = async (id) => {
    try {
      const res = await API.put(`/todos/${id}`, { text: editText });
      setTodos(normalizeTodo(res.data));
      setEditingId(null);
      setEditText("");
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      const res = await API.delete(`/todos/${id}`);
      setTodos(normalizeTodo(res.data));
    } catch (err) {
      console.error(err);
    }
  };

  const activeCount = todos.filter((todo) => !todo.completed).length;

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50 text-slate-500 font-medium">
        Загрузка...
      </div>
    );
  }

  // Экран авторизации / регистрации
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              {isLoginView ? "С возвращением!" : "Создать аккаунт"}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {isLoginView
                ? "Введите данные для входа в ваш Todo List"
                : "Заполните поля для регистрации"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLoginView && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  placeholder="Иван"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Email
              </label>
              <input
                type="email"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Пароль
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 transition-all cursor-pointer"
            >
              {isLoginView ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isLoginView ? "Нет аккаунта?" : "Уже есть аккаунт?"}{" "}
            <button
              type="button"
              className="text-indigo-600 font-semibold hover:underline focus:outline-none cursor-pointer"
              onClick={() => {
                setIsLoginView(!isLoginView);
                setError("");
              }}
            >
              {isLoginView ? "Создать" : "Войти"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Экран приложения (список задач)
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-100">
        {/* Шапка профиля */}
        <div className="flex justify-between items-center pb-6 border-b border-slate-100">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Мои задачи</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Привет,{" "}
              <span className="font-medium text-indigo-600">
                {user.username}
              </span>{" "}
              👋
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-medium rounded-xl transition-all cursor-pointer text-sm border border-slate-200"
          >
            Выйти
          </button>
        </div>

        {/* Форма добавления задачи */}
        <form onSubmit={addTodo} className="flex gap-3 my-6">
          <input
            type="text"
            placeholder="Что нужно сделать сегодня?"
            value={newTodoText}
            onChange={(e) => setNewTodoText(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-100 transition-all cursor-pointer text-sm whitespace-nowrap"
          >
            Добавить
          </button>
        </form>

        {/* Панель фильтров и счетчика */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <span className="text-xs font-medium text-slate-500">
            Осталось задач:{" "}
            <strong className="text-indigo-600 font-bold">{activeCount}</strong>
          </span>

          <div className="flex gap-1.5">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filter === "active"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              Активные
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filter === "completed"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
              }`}
            >
              Выполненные
            </button>
          </div>
        </div>

        {/* Список задач */}
        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg">Список задач пуст ☕️</p>
              <p className="text-sm mt-1">В этой категории пока нет задач</p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <div
                key={todo.id || todo._id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  todo.completed
                    ? "bg-slate-50 border-slate-200"
                    : "bg-white border-slate-100 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 mr-3">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() =>
                      toggleTodo(todo.id || todo._id, todo.completed)
                    }
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />

                  {editingId === (todo.id || todo._id) ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      autoFocus
                    />
                  ) : (
                    <span
                      className={`text-sm flex-1 break-all ${
                        todo.completed
                          ? "line-through text-slate-400"
                          : "text-slate-700 font-medium"
                      }`}
                    >
                      {todo.text || todo.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {editingId === (todo.id || todo._id) ? (
                    <button
                      onClick={() => saveEditTodo(todo.id || todo._id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    >
                      Сохранить
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(todo.id || todo._id);
                        setEditText(todo.text || todo.name);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                    >
                      Изменить
                    </button>
                  )}
                  <button
                    onClick={() => deleteTodo(todo.id || todo._id)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
