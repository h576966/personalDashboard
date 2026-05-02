import NewsModule from "./NewsModule";
import SearchModule from "./SearchModule";

export default function Home() {
  return (
    <div className="min-h-screen">
      <SearchModule />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <NewsModule />
      </div>
    </div>
  );
}
