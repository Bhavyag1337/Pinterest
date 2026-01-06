import { useState, useEffect, useMemo } from "react";

export interface Pin {
  id: string;
  filename: string;
  title: string;
  tags: string[];
  imageUrl: string;
}

interface PinManifest {
  images: {
    id: string;
    filename: string;
    title: string;
    tags: string[];
  }[];
}

export function usePins() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadPins() {
      try {
        const response = await fetch("/images/pins/manifest.json");
        const manifest: PinManifest = await response.json();
        
        const loadedPins: Pin[] = manifest.images.map((img) => ({
          ...img,
          imageUrl: `/images/pins/${img.filename}`,
        }));
        
        setPins(loadedPins);
      } catch (error) {
        console.error("Failed to load pins:", error);
      } finally {
        setLoading(false);
      }
    }

    loadPins();
  }, []);

  const filteredPins = useMemo(() => {
    if (!searchQuery.trim()) return pins;
    
    const query = searchQuery.toLowerCase();
    return pins.filter(
      (pin) =>
        pin.title.toLowerCase().includes(query) ||
        pin.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [pins, searchQuery]);

  return {
    pins: filteredPins,
    allPins: pins,
    loading,
    searchQuery,
    setSearchQuery,
  };
}
