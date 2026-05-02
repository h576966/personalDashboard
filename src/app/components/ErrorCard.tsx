interface ErrorCardProps {
  message: string;
  className?: string;
}

export default function ErrorCard({ message, className = "" }: ErrorCardProps) {
  return (
    <div
      className={`w-full rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400 ${className}`}
    >
      {message}
    </div>
  );
}
