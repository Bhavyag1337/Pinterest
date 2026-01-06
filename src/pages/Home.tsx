import { Header } from "@/components/Header";
import { PinGrid } from "@/components/PinGrid";
import { usePins } from "@/hooks/usePins";

export default function Home() {
  const { pins, loading, searchQuery, setSearchQuery } = usePins();

  return (
    <div className="min-h-screen bg-background">
      <Header searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      {/* Search Results Info */}
      {searchQuery && !loading && (
        <div className="px-4 pt-4">
          <p className="text-muted-foreground">
            {pins.length} result{pins.length !== 1 ? "s" : ""} for "{searchQuery}"
          </p>
        </div>
      )}

      <main>
        <PinGrid pins={pins} loading={loading} />
      </main>
    </div>
  );
}
