"use client";

import { useEffect, useState } from "react";

interface Topic {
  id: string;
  name: string;
}

export default function TopicsPanel() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [newTopic, setNewTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTopics() {
    try {
      const res = await fetch("/api/topics");
      const data = await res.json();
      setTopics(data.topics ?? []);
    } catch {
      setError("Failed to load topics");
    }
  }

  async function addTopic() {
    if (!newTopic.trim()) return;

    setIsLoading(true);
    try {
      await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTopic }),
      });
      setNewTopic("");
      await loadTopics();
    } catch {
      setError("Failed to add topic");
    } finally {
      setIsLoading(false);
    }
  }

  async function removeTopic(id: string) {
    await fetch(`/api/topics/${id}`, { method: "DELETE" });
    await loadTopics();
  }

  useEffect(() => {
    void loadTopics();
  }, []);

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <h2 className="text-sm font-semibold">Topics</h2>

      <div className="mt-3 flex gap-2">
        <input
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          placeholder="Add topic (e.g. Mac Studio M5)"
          className="flex-1 rounded-md border p-2 text-sm"
        />
        <button onClick={addTopic} disabled={isLoading} className="px-3 text-sm">
          Add
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      <div className="mt-3 space-y-2">
        {topics.map((t) => (
          <div key={t.id} className="flex justify-between text-sm">
            <span>{t.name}</span>
            <button onClick={() => removeTopic(t.id)} className="text-xs text-red-500">
              remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
