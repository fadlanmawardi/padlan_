/**
 * Layanan cuaca SchoolHub berbasis lokasi pengguna.
 *
 * Alur:
 * 1. Cache localStorage (TTL ±10 menit) — key `sh-weather`.
 * 2. Auto — Browser Geolocation API → reverse geocode (BigDataCloud) → cuaca Open-Meteo.
 * 3. Manual — kota pilihan pengguna (localStorage `sh-weather-city`) → geocode + cuaca Open-Meteo.
 * 4. Default — Jakarta bila kota manual belum diatur.
 *
 * Semua sumber publik tanpa API key. Fungsi aman dipanggil di sisi server (tidak error).
 */

export type WeatherSource = "auto" | "manual" | "cache" | "default";

export interface WeatherData {
  city: string;
  country: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  code: number;
  description: string;
  icon: string;
  isDay: boolean;
  sunrise: string;
  sunset: string;
  source: WeatherSource;
  updatedAt: string;
}

export interface WeatherResult {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
}

const CACHE_KEY = "sh-weather";
const CITY_KEY = "sh-weather-city";
const GEO_ATTEMPTED_KEY = "sh-geo-attempted";
const CACHE_TTL_MS = 10 * 60 * 1000;

export const MANUAL_CITIES = [
  "Jakarta",
  "Bogor",
  "Depok",
  "Tangerang",
  "Bekasi",
  "Bandung",
  "Semarang",
  "Yogyakarta",
  "Surabaya",
  "Malang",
  "Medan",
  "Pekanbaru",
  "Palembang",
  "Makassar",
  "Denpasar",
  "Balikpapan",
];

interface WmoInfo {
  description: string;
  icon: string;
}

function wmoInfo(code: number): WmoInfo {
  switch (code) {
    case 0:
      return { description: "Cerah", icon: "sunny" };
    case 1:
      return { description: "Cerah berawan", icon: "sunny" };
    case 2:
      return { description: "Berawan sebagian", icon: "partly" };
    case 3:
      return { description: "Berawan", icon: "cloudy" };
    case 45:
    case 48:
      return { description: "Berkabut", icon: "foggy" };
    case 51:
    case 53:
    case 55:
      return { description: "Gerimis", icon: "rainy" };
    case 61:
    case 80:
      return { description: "Hujan ringan", icon: "rainy" };
    case 63:
    case 81:
      return { description: "Hujan", icon: "rainy" };
    case 65:
    case 82:
      return { description: "Hujan lebat", icon: "rainy" };
    case 66:
    case 67:
      return { description: "Hujan beku", icon: "snowy" };
    case 71:
    case 73:
    case 75:
    case 77:
      return { description: "Salju", icon: "snowy" };
    case 85:
    case 86:
      return { description: "Hujan salju", icon: "snowy" };
    case 95:
      return { description: "Badai petir", icon: "storm" };
    case 96:
    case 99:
      return { description: "Badai petir & hujan es", icon: "storm" };
    default:
      return { description: "Berawan", icon: "cloudy" };
  }
}

function formatClock(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "--:--";
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
}

function buildData(
  raw: {
    current: {
      temperature_2m?: number;
      relative_humidity_2m?: number;
      apparent_temperature?: number;
      is_day?: number;
      weather_code?: number;
      wind_speed_10m?: number;
    };
    daily?: { sunrise?: string[]; sunset?: string[] };
  },
  city: string,
  country: string,
  source: WeatherSource
): WeatherData {
  const code = raw.current?.weather_code ?? 3;
  const info = wmoInfo(code);
  return {
    city,
    country,
    temp: Math.round(raw.current?.temperature_2m ?? 0),
    feelsLike: Math.round(raw.current?.apparent_temperature ?? raw.current?.temperature_2m ?? 0),
    humidity: Math.round(raw.current?.relative_humidity_2m ?? 0),
    windSpeed: Math.round((raw.current?.wind_speed_10m ?? 0) * 10) / 10,
    code,
    description: info.description,
    icon: info.icon,
    isDay: raw.current?.is_day === 1,
    sunrise: formatClock(raw.daily?.sunrise?.[0] ?? ""),
    sunset: formatClock(raw.daily?.sunset?.[0] ?? ""),
    source,
    updatedAt: new Date().toISOString(),
  };
}

async function fetchWeatherRaw(
  lat: number,
  lon: number
): Promise<{
  current: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    is_day?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: { sunrise?: string[]; sunset?: string[] };
}> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m` +
    `&daily=sunrise,sunset&timezone=auto&forecast_days=1`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Gagal mengambil data cuaca");
  return (await response.json()) as Awaited<ReturnType<typeof fetchWeatherRaw>>;
}

async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{ city: string; country: string }> {
  try {
    const url =
      `https://api.bigdatacloud.net/data/reverse-geocode-client` +
      `?latitude=${lat}&longitude=${lon}&localityLanguage=id`;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error("Gagal geocode");
    const data = (await response.json()) as {
      city?: string;
      locality?: string;
      countryName?: string;
    };
    return {
      city: data.city ?? data.locality ?? "Lokasi saya",
      country: data.countryName ?? "Indonesia",
    };
  } catch {
    return { city: "Lokasi saya", country: "Indonesia" };
  }
}

async function geocodeCity(city: string): Promise<{ lat: number; lon: number }> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=id&format=json`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Kota tidak ditemukan");
  const data = (await response.json()) as {
    results?: { latitude: number; longitude: number; name?: string }[];
  };
  const result = data.results?.[0];
  if (!result) throw new Error("Kota tidak ditemukan");
  return { lat: result.latitude, lon: result.longitude };
}

function readCache(): WeatherData | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherData;
    if (!parsed.updatedAt) return null;
    const age = Date.now() - new Date(parsed.updatedAt).getTime();
    if (age > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: WeatherData): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // abaikan
  }
}

function readManualCity(): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(CITY_KEY);
  } catch {
    return null;
  }
}

export function setManualCity(city: string): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(CITY_KEY, city);
  } catch {
    // abaikan
  }
}

function geolocationAttempted(): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(GEO_ATTEMPTED_KEY) === "1";
  } catch {
    return false;
  }
}

function markGeolocationAttempted(): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(GEO_ATTEMPTED_KEY, "1");
  } catch {
    // abaikan
  }
}

function getPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation tidak didukung"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        markGeolocationAttempted();
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        markGeolocationAttempted();
        reject(new Error(error.message));
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  });
}

async function fetchByCoords(lat: number, lon: number): Promise<WeatherData> {
  const raw = await fetchWeatherRaw(lat, lon);
  const place = await reverseGeocode(lat, lon);
  return buildData(raw, place.city, place.country, "auto");
}

async function fetchByCity(city: string): Promise<WeatherData> {
  const { lat, lon } = await geocodeCity(city);
  const raw = await fetchWeatherRaw(lat, lon);
  return buildData(raw, city, "Indonesia", "manual");
}

/** Sumber lokasi saat ini (geo vs manual). */
export function currentLocationMode(): "auto" | "manual" {
  try {
    if (typeof localStorage === "undefined") return "manual";
    return readManualCity() && geolocationAttempted() ? "manual" : "auto";
  } catch {
    return "manual";
  }
}

/** Ambil cuaca — memakai cache bila masih segar, lalu auto, lalu manual. */
export async function getWeather(force = false): Promise<WeatherData> {
  if (!force) {
    const cached = readCache();
    if (cached) return cached;
  }

  const errors: string[] = [];

  try {
    const { lat, lon } = await getPosition();
    const data = await fetchByCoords(lat, lon);
    writeCache(data);
    return data;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Geolocation gagal");
  }

  const manualCity = readManualCity();
  if (manualCity) {
    try {
      const data = await fetchByCity(manualCity);
      writeCache(data);
      return data;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Kota tidak ditemukan");
    }
  }

  // Default terakhir: Jakarta.
  try {
    const data = await fetchByCity("Jakarta");
    data.source = "default";
    writeCache(data);
    return data;
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Cuaca tidak tersedia");
  }

  // Semua sumber gagal → tetap beri data minimum tanpa melempar error.
  const info = wmoInfo(3);
  const now = new Date();
  return {
    city: readManualCity() ?? "Cuaca tidak tersedia",
    country: "Indonesia",
    temp: 0,
    feelsLike: 0,
    humidity: 0,
    windSpeed: 0,
    code: 3,
    description: errors.join(" · ") || "Layanan cuaca sedang gangguan",
    icon: info.icon,
    isDay: true,
    sunrise: "--:--",
    sunset: "--:--",
    source: "default",
    updatedAt: now.toISOString(),
  };
}

/** Bersihkan cache + penanda geolocation agar lokasi diproses ulang. */
export function clearWeatherCache(): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // abaikan
  }
}
