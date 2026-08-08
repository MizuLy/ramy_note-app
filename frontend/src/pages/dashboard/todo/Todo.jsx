import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthProvider";
import {
  getTodos,
  createTodo,
  toggleTodoDone,
  deleteTodo,
} from "../../../api/axios";

import {
  LuPlus,
  LuTrash2,
  LuCircle,
  LuCircleCheck,
  LuListTodo,
  LuCalendar,
} from "react-icons/lu";

export default function Todo() {
  const { accessToken } = useAuth();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Filter state
  const [filter, setFilter] = useState("all"); // 'all' | 'active' | 'completed'

  // Fetch todos from API
  const fetchTodoList = async () => {
    if (!accessToken) return;
    try {
      const res = await getTodos(accessToken);
      const list = res?.result || res?.data || res || [];
      setTodos(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to fetch todos:", err);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodoList();
  }, [accessToken]);

  // Create new task
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        dueDate: dueDate || null,
      };

      const res = await createTodo(payload, accessToken);
      const newTodo = res?.result || res?.data;

      if (newTodo) {
        setTodos((prev) => [newTodo, ...prev]);
      } else {
        await fetchTodoList();
      }

      toast.success("Task added successfully!");
      setTitle("");
      setDueDate("");
    } catch (err) {
      console.error("Failed to create todo:", err);
      toast.error(err.response?.data?.message || "Failed to add task");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle isDone
  const handleToggleDone = async (id) => {
    // Optimistic UI update
    const currentTodo = todos.find((t) => (t.id || t._id) === id);
    const nextState = !currentTodo?.isDone;

    setTodos((prev) =>
      prev.map((t) =>
        (t.id || t._id) === id ? { ...t, isDone: nextState } : t,
      ),
    );

    try {
      await toggleTodoDone(id, accessToken);
      toast.success(nextState ? "Task completed!" : "Task marked active");
    } catch (err) {
      console.error("Failed to toggle todo:", err);
      toast.error("Failed to update status");
      // Revert if API fails
      setTodos((prev) =>
        prev.map((t) =>
          (t.id || t._id) === id ? { ...t, isDone: !nextState } : t,
        ),
      );
    }
  };

  // Delete task
  const handleDeleteTodo = async (id) => {
    // Optimistic UI update
    const previousTodos = [...todos];
    setTodos((prev) => prev.filter((t) => (t.id || t._id) !== id));

    try {
      await deleteTodo(id, accessToken);
      toast.success("Task deleted");
    } catch (err) {
      console.error("Failed to delete todo:", err);
      toast.error("Failed to delete task");
      setTodos(previousTodos);
    }
  };

  // Filter tasks
  const filteredTodos = todos.filter((t) => {
    if (filter === "active") return !t.isDone;
    if (filter === "completed") return t.isDone;
    return true;
  });

  const pendingCount = todos.filter((t) => !t.isDone).length;

  return (
    <div className="flex-1 h-screen flex flex-col bg-zinc-950 text-zinc-200 overflow-hidden">
      <div className="w-full max-w-2xl mx-auto flex flex-col h-full px-4 pt-6 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300">
              <LuListTodo size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                To-do List
              </h1>
              <p className="text-xs text-zinc-500">
                {pendingCount} pending task{pendingCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800/80 p-0.5 rounded-lg text-xs">
            {["all", "active", "completed"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                  filter === f
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Create Form */}
        <form onSubmit={handleAddTodo} className="mt-4 flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 bg-zinc-900/60 border border-zinc-800 focus:border-zinc-700 text-sm text-white placeholder-zinc-600 rounded-md px-3 py-2 outline-none transition-colors"
          />

          <div className="relative flex items-center">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-md px-2.5 py-2 outline-none cursor-pointer hover:bg-zinc-800 transition-colors [color-scheme:dark]"
            />
          </div>

          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-300 disabled:opacity-40 text-zinc-900 text-xs font-semibold rounded-md transition-colors shrink-0"
          >
            <LuPlus size={14} />
            <span>{submitting ? "Adding..." : "Add"}</span>
          </button>
        </form>

        {/* Task List */}
        <div className="flex-1 mt-4 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-zinc-500 text-xs">
              Loading tasks...
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-zinc-600 text-xs select-none border border-dashed border-zinc-900 rounded-xl">
              <p>No tasks found</p>
            </div>
          ) : (
            filteredTodos.map((todo) => {
              const id = todo.id || todo._id;
              const isDone = todo.isDone;

              return (
                <div
                  key={id}
                  className={`group flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isDone
                      ? "bg-zinc-900/20 border-zinc-900/80 text-zinc-500"
                      : "bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700/80 text-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    <button
                      type="button"
                      onClick={() => handleToggleDone(id)}
                      className="shrink-0 text-zinc-500 hover:text-white transition-colors"
                    >
                      {isDone ? (
                        <LuCircleCheck size={16} className="text-emerald-500" />
                      ) : (
                        <LuCircle size={16} />
                      )}
                    </button>

                    <span
                      className={`text-sm truncate select-none ${
                        isDone ? "line-through text-zinc-500" : ""
                      }`}
                    >
                      {todo.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {todo.dueDate && (
                      <span className="flex items-center gap-1 text-[11px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                        <LuCalendar size={11} />
                        {new Date(todo.dueDate).toLocaleDateString()}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteTodo(id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-all rounded"
                      title="Delete task"
                    >
                      <LuTrash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
