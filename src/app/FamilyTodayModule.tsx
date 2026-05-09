"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate: string | null;
  assignedTo: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
}

interface ApiErrorBody {
  error?: {
    message?: string;
  };
}

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseError(data: ApiErrorBody, fallback: string): string {
  return data.error?.message ?? fallback;
}

function formatDate(value: string | null): string {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function isToday(value: string | null): boolean {
  if (!value) return false;
  return value.slice(0, 10) === todayInputValue();
}

export default function FamilyTodayModule() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(todayInputValue());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openTasks = useMemo(
    () => tasks.filter((task) => !task.isCompleted),
    [tasks],
  );

  const todaysEvents = useMemo(
    () => events.filter((event) => isToday(event.startDate)).slice(0, 6),
    [events],
  );

  const loadFamilyToday = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [tasksRes, eventsRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/events"),
      ]);
      const [tasksData, eventsData] = await Promise.all([
        tasksRes.json(),
        eventsRes.json(),
      ]);

      if (!tasksRes.ok) throw new Error(parseError(tasksData, "Failed to load tasks"));
      if (!eventsRes.ok) throw new Error(parseError(eventsData, "Failed to load events"));

      setTasks(tasksData.tasks ?? []);
      setEvents(eventsData.events ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load Family Today");
    } finally {
      setIsLoading(false);
    }
  }, []);

  async function createTask() {
    const title = taskTitle.trim();
    if (!title) return;

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(parseError(data, "Failed to create task"));
      setTasks((prev) => [...prev, data.task]);
      setTaskTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSaving(false);
    }
  }

  async function createEvent() {
    const title = eventTitle.trim();
    if (!title || !eventDate) return;

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, startDate: `${eventDate}T09:00:00`, allDay: true }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(parseError(data, "Failed to create event"));
      setEvents((prev) => [...prev, data.event]);
      setEventTitle("");
      setEventDate(todayInputValue());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setIsSaving(false);
    }
  }

  async function patchTask(id: string, patch: Partial<Pick<Task, "title" | "isCompleted">>) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(parseError(data, "Failed to update task"));
    setTasks((prev) => prev.map((task) => (task.id === id ? data.task : task)));
  }

  async function patchEvent(id: string, patch: Partial<Pick<Event, "title">>) {
    const res = await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(parseError(data, "Failed to update event"));
    setEvents((prev) => prev.map((event) => (event.id === id ? data.event : event)));
  }

  async function deleteTask(id: string) {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) throw new Error(parseError(data, "Failed to delete task"));
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  async function deleteEvent(id: string) {
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) throw new Error(parseError(data, "Failed to delete event"));
    setEvents((prev) => prev.filter((event) => event.id !== id));
  }

  async function runAction(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFamilyToday();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadFamilyToday]);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-hover dark:text-secondary">
          Family Today
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Schedule and open tasks
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          A calm shared view of what needs attention today.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Today&apos;s schedule
            </h2>
            <span className="text-xs text-zinc-400">{todaysEvents.length}</span>
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={eventTitle}
              onChange={(event) => setEventTitle(event.target.value)}
              placeholder="Add event"
              className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <input
              type="date"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              className="w-36 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={createEvent}
              disabled={isSaving}
              className="rounded-md border border-primary px-3 text-xs font-medium text-primary hover:bg-muted disabled:opacity-60"
            >
              Add
            </button>
          </div>

          {isLoading ? (
            <p className="mt-4 text-sm text-zinc-500">Loading schedule...</p>
          ) : todaysEvents.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Nothing scheduled for today.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {todaysEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {event.title}
                      </span>
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(event.startDate)}
                      </span>
                    </span>
                    <span className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const title = window.prompt("Event title", event.title);
                          if (title?.trim()) void runAction(() => patchEvent(event.id, { title }));
                        }}
                        className="font-medium text-primary"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => runAction(() => deleteEvent(event.id))}
                        className="font-medium text-red-600"
                      >
                        Delete
                      </button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Open tasks
            </h2>
            <span className="text-xs text-zinc-400">{openTasks.length}</span>
          </div>

          <div className="mt-3 flex gap-2">
            <input
              value={taskTitle}
              onChange={(event) => setTaskTitle(event.target.value)}
              placeholder="Add task"
              className="min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={createTask}
              disabled={isSaving}
              className="rounded-md border border-primary px-3 text-xs font-medium text-primary hover:bg-muted disabled:opacity-60"
            >
              Add
            </button>
          </div>

          {isLoading ? (
            <p className="mt-4 text-sm text-zinc-500">Loading tasks...</p>
          ) : openTasks.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              No open tasks. Beautifully quiet.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {openTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <label className="flex min-w-0 items-start gap-2">
                      <input
                        type="checkbox"
                        checked={task.isCompleted}
                        onChange={(event) =>
                          runAction(() => patchTask(task.id, { isCompleted: event.target.checked }))
                        }
                        className="mt-1 h-4 w-4"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {task.title}
                        </span>
                        {task.dueDate && (
                          <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                            Due {formatDate(task.dueDate)}
                          </span>
                        )}
                      </span>
                    </label>
                    <span className="flex shrink-0 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          const title = window.prompt("Task title", task.title);
                          if (title?.trim()) void runAction(() => patchTask(task.id, { title }));
                        }}
                        className="font-medium text-primary"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => runAction(() => deleteTask(task.id))}
                        className="font-medium text-red-600"
                      >
                        Delete
                      </button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
