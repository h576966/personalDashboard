"use client";

import { useState, type ReactNode } from "react";

interface DashboardModuleProps {
  title: string;
  defaultExpanded: boolean;
  actions?: ReactNode;
  children: ReactNode;
}

export default function DashboardModule({
  title,
  defaultExpanded,
  actions,
  children,
}: DashboardModuleProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      {/* Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-750 cursor-pointer"
      >
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
          {/* Chevron */}
          <svg
            className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Collapsible body */}
      <div
        className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
          expanded ? "max-h-[2000px]" : "max-h-0"
        }`}
      >
        <div className="border-t border-zinc-200 dark:border-zinc-700">
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
