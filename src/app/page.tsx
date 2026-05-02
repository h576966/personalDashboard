import NewsModule from "./NewsModule";
import SearchModule from "./SearchModule";

export default function Home() {
  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto px-4 py-12 gap-8">
      <header className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Family Dashboard
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          News briefing and search
        </p>
      </header>
      <div className="flex flex-col gap-4">
        <NewsModule />
        <SearchModule />
      </div>
    </div>
  );
}
