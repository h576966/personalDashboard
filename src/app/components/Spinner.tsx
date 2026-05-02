interface SpinnerProps {
  label?: string;
  className?: string;
}

export default function Spinner({ label = "Loading...", className = "" }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <div className="flex items-center gap-2 text-zinc-500">
        <span className="inline-block w-4 h-4 border-2 border-zinc-300 border-t-primary rounded-full animate-spin" />
        <span>{label}</span>
      </div>
    </div>
  );
}
