"use client";

import {
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  Loader2,
  LocateFixed,
  MapPin,
  RefreshCw,
  Sunrise,
  Sunset,
  Tornado,
  Umbrella,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  clearWeatherCache,
  getWeather,
  MANUAL_CITIES,
  setManualCity,
  type WeatherData,
} from "@/services/weather-service";

const ICONS: Record<string, LucideIcon> = {
  sunny: CloudSun,
  partly: CloudSun,
  cloudy: Cloud,
  rainy: CloudRain,
  foggy: Cloud,
  snowy: Cloud,
  storm: Tornado,
};

const BG_GRADIENTS: Record<string, string> = {
  sunny: "from-amber-400/20 to-orange-500/10",
  partly: "from-sky-400/20 to-indigo-500/10",
  cloudy: "from-slate-400/20 to-slate-500/10",
  rainy: "from-slate-500/25 to-blue-600/15",
  foggy: "from-slate-400/25 to-slate-500/15",
  snowy: "from-sky-300/25 to-slate-400/15",
  storm: "from-slate-600/25 to-purple-700/15",
};

export function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async (force = false) => {
    if (!mounted.current) return;
    setLoading(true);
    setError(null);
    try {
      const weather = await getWeather(force);
      if (!mounted.current) return;
      setData(weather);
    } catch {
      if (mounted.current) setError("Gagal memuat cuaca");
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  function handleRefresh() {
    clearWeatherCache();
    void load(true);
  }

  function handlePickCity(city: string) {
    setManualCity(city);
    clearWeatherCache();
    void load(true);
  }

  function handleUseMyLocation() {
    clearWeatherCache();
    void load(true);
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-slate-400/15 to-slate-500/10 px-4 py-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    );
  }

  const Icon = data ? (ICONS[data.icon] ?? Cloud) : Cloud;
  const bg = data ? (BG_GRADIENTS[data.icon] ?? BG_GRADIENTS.cloudy) : BG_GRADIENTS.cloudy;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl bg-gradient-to-br px-4 py-3",
        bg
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/60 text-foreground">
        <Icon className="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">
            {data ? `${data.temp}°C · ${data.description}` : "Cuaca"}
          </p>
          {data && data.source === "auto" && (
            <MapPin className="text-muted-foreground size-3.5 shrink-0" />
          )}
        </div>
        <p className="text-muted-foreground truncate text-xs">
          {data ? `${data.city}, ${data.country}` : "Cuaca tidak tersedia"}
        </p>
        {error && (
          <p className="text-destructive mt-0.5 text-[11px]">{error}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {data && (
          <div className="text-muted-foreground mr-1 hidden items-center gap-2 text-[11px] md:flex">
            <span className="flex items-center gap-1">
              <Droplets className="size-3" />
              {data.humidity}%
            </span>
            <span className="flex items-center gap-1">
              <Wind className="size-3" />
              {data.windSpeed}
            </span>
            <span className="flex items-center gap-1">
              <Sunrise className="size-3" />
              {data.sunrise}
            </span>
            <span className="flex items-center gap-1">
              <Sunset className="size-3" />
              {data.sunset}
            </span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" aria-label="Pilih kota">
              <LocateFixed className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={handleUseMyLocation}>
              <MapPin className="size-4" />
              Gunakan lokasi saya
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleRefresh}>
              <RefreshCw className="size-4" />
              Perbarui cuaca
            </DropdownMenuItem>
            <div className="bg-muted/50 mt-1 mb-1 h-px" />
            {MANUAL_CITIES.map((city) => (
              <DropdownMenuItem
                key={city}
                onClick={() => handlePickCity(city)}
                className={cn(data?.city === city && "text-primary")}
              >
                <Umbrella className="size-4" />
                {city}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {loading && (
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        )}
      </div>
    </div>
  );
}
