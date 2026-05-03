"use client";

import { useState } from "react";
import NewsModule from "./NewsModule";
import SearchModule from "./SearchModule";

type ActiveModule = "news";

export default function DashboardShell() {
  const [activeModule, setActiveModule] = useState<ActiveModule>("news");

  return (
    <div className="min-h-screen">
      <SearchModule />
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[minmax(0,7fr)_minmax(260px,3fr)]">
        <aside className="order-1 lg:order-2">
          <div className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Modules
            </p>
            <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              <button
                type="button"
                onClick={() => setActiveModule("news")}
                className={
                  "min-w-[140px] rounded-md border px-3 py-2 text-left text-sm font-medium transition-colors lg:min-w-0 " +
                  (activeModule === "news"
                    ? "border-primary bg-primary-hover text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-primary hover:text-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200")
                }
              >
                <span className="block">News</span>
                <span className="mt-1 block text-xs font-normal opacity-75">
                  Briefing and topics
                </span>
              </button>
            </div>
          </div>
        </aside>

        <main className="order-2 min-w-0 lg:order-1">
          {activeModule === "news" && <NewsModule />}
        </main>
      </div>
    </div>
  );
}
