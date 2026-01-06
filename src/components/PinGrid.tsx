import { PinCard } from "./PinCard";
import type { Pin } from "@/hooks/usePins";

interface PinGridProps {
  pins: Pin[];
  loading?: boolean;
}

export function PinGrid({ pins, loading }: PinGridProps) {
  if (loading) {
    return (
      <div className="masonry-grid p-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="masonry-item">
            <div 
              className="bg-muted rounded-2xl animate-pulse"
              style={{ height: `${Math.random() * 200 + 200}px` }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 mb-4 rounded-full bg-muted flex items-center justify-center">
          <span className="text-4xl">🔍</span>
        </div>
        <h2 className="text-xl font-semibold mb-2">No pins found</h2>
        <p className="text-muted-foreground">Try searching for something else</p>
      </div>
    );
  }

  return (
    <div className="masonry-grid p-4">
      {pins.map((pin, index) => (
        <div
          key={pin.id}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <PinCard pin={pin} />
        </div>
      ))}
    </div>
  );
}
