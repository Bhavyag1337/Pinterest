import { useState } from "react";
import { MoreHorizontal, ArrowUpRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Pin } from "@/hooks/usePins";

interface PinCardProps {
  pin: Pin;
}

export function PinCard({ pin }: PinCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="masonry-item">
      <div className="pin-card group">
        <img
          src={pin.imageUrl}
          alt={pin.title}
          className={`w-full h-auto object-cover transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        
        {!imageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse rounded-2xl" />
        )}

        <div className="pin-overlay" />

        {/* Save Button */}
        <div className="pin-actions">
          <Button
            variant={saved ? "default" : "save"}
            size="sm"
            onClick={() => setSaved(!saved)}
            className="font-bold"
          >
            {saved ? "Saved" : "Save"}
          </Button>
        </div>

        {/* Bottom Actions */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button variant="icon" size="icon" className="w-8 h-8 bg-background/90 hover:bg-background">
            <ArrowUpRight className="w-4 h-4" />
          </Button>
          <div className="flex gap-2">
            <Button variant="icon" size="icon" className="w-8 h-8 bg-background/90 hover:bg-background">
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="icon" size="icon" className="w-8 h-8 bg-background/90 hover:bg-background">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mt-2 px-1">
        <p className="text-sm font-medium line-clamp-2">{pin.title}</p>
      </div>
    </div>
  );
}
