import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ModuleCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-md border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function ModuleHeader({
  title,
  eyebrow,
  description,
  action,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-hover dark:text-secondary">
              {eyebrow}
            </p>
          )}
          <h2 className={cn("text-sm font-semibold text-zinc-900 dark:text-zinc-100", eyebrow && "mt-1")}>
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
        {action && <div className="w-full sm:w-auto sm:shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export function InlineNotice({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "error" | "warning" | "success";
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 text-sm",
        tone === "error" &&
          "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400",
        tone === "warning" &&
          "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
        tone === "success" &&
          "border-muted bg-muted/60 text-primary-hover dark:border-primary-hover dark:bg-primary-hover/20 dark:text-secondary",
        tone === "neutral" &&
          "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50/60 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{title}</p>
      {description && (
        <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-700/70",
        className,
      )}
    />
  );
}

export function SkeletonList({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="mt-3 h-3 w-full" />
          <SkeletonBlock className="mt-2 h-3 w-5/6" />
        </div>
      ))}
    </div>
  );
}

export function ToolbarInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-primary dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100",
        className,
      )}
      {...props}
    />
  );
}

export function ResultCount({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
      {children}
    </p>
  );
}

export function ShowMoreButton({
  hiddenCount,
  onClick,
  label,
}: {
  hiddenCount: number;
  onClick: () => void;
  label?: string;
}) {
  if (hiddenCount <= 0) return null;

  return (
    <div className="flex justify-center pt-1">
      <ActionButton onClick={onClick} variant="secondary" className="min-h-9 px-3 py-1.5 text-xs">
        {label ?? `Show ${Math.min(hiddenCount, 8)} more`}
      </ActionButton>
    </div>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string; count?: number }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex w-full rounded-md border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-900 sm:inline-flex sm:w-auto">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors sm:flex-none",
              active
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100",
            )}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="ml-1 text-[11px] text-zinc-400">{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function ActionButton({
  children,
  variant = "secondary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-primary text-white hover:bg-primary-hover",
        variant === "secondary" &&
          "border border-zinc-300 bg-white text-zinc-700 hover:border-primary hover:text-primary dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        variant === "ghost" &&
          "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",
        variant === "danger" &&
          "border border-zinc-300 bg-white text-zinc-600 hover:border-red-500 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
