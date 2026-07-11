"use client";

import { FormEvent, useEffect, useState } from "react";

type Day = { date: string; code: number; max: number; min: number; rain: number };
type Weather = { city: string; country: string; temperature: number; apparent: number; wind: number; code: number; days: Day[] };

const weatherText: Record<number, string> = {
  0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 48: "Icy fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
  61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow",
  75: "Heavy snow", 80: "Rain showers", 81: "Showers", 82: "Heavy showers",
  95: "Thunderstorm", 96: "Storm & hail", 99: "Storm & hail",
};

function iconFor(code: number) {
  if (code === 0) return "☀";
  if (code <= 2) return "◑";
  if (code <= 48) return "☁";
  if (code >= 71 && code <= 75) return "❄";
  if (code >= 95) return "ϟ";
  return "☂";
}

async function loadWeather(city: string): Promise<Weather> {
  const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
  const place = (await geo.json()).results?.[0];
  if (!place) throw new Error("We couldn’t find that place. Try a nearby city.");
  const params = new URLSearchParams({
    latitude: String(place.latitude), longitude: String(place.longitude), timezone: "auto",
    current: "temperature_2m,apparent_temperature,weather_code,wind_speed_10m",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    forecast_days: "6",
  });
  const data = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`).then((r) => r.json());
  return {
    city: place.name, country: place.country_code, temperature: Math.round(data.current.temperature_2m),
    apparent: Math.round(data.current.apparent_temperature), wind: Math.round(data.current.wind_speed_10m),
    code: data.current.weather_code,
    days: data.daily.time.slice(1).map((date: string, i: number) => ({
      date, code: data.daily.weather_code[i + 1], max: Math.round(data.daily.temperature_2m_max[i + 1]),
      min: Math.round(data.daily.temperature_2m_min[i + 1]), rain: data.daily.precipitation_probability_max[i + 1] ?? 0,
    })),
  };
}

export default function Home() {
  const [query, setQuery] = useState("Istanbul");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function search(city: string) {
    setLoading(true); setError("");
    try { setWeather(await loadWeather(city)); }
    catch (e) { setError(e instanceof Error ? e.message : "Weather data is unavailable right now."); }
    finally { setLoading(false); }
  }

  useEffect(() => { search("Istanbul"); }, []);
  function submit(e: FormEvent) { e.preventDefault(); if (query.trim()) search(query.trim()); }

  return (
    <main>
      <nav><a className="brand" href="#">Morrow<span>°</span></a><span className="nav-note">Weather, made simple.</span></nav>
      <section className="hero">
        <p className="eyebrow">YOUR DAILY OUTLOOK</p>
        <h1>Know what’s<br />coming <em>next.</em></h1>
        <form onSubmit={submit}>
          <label htmlFor="city">Search a city</label>
          <div className="search-row"><input id="city" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="City name" /><button disabled={loading}>{loading ? "Checking…" : "See forecast →"}</button></div>
        </form>
      </section>

      <section className="weather-shell" aria-live="polite">
        {error && <div className="message">{error}</div>}
        {!error && weather && <>
          <div className="current">
            <div><p className="place">{weather.city}, {weather.country}</p><p className="condition">{weatherText[weather.code] ?? "Changing skies"}</p></div>
            <div className="current-temp"><span className="weather-icon">{iconFor(weather.code)}</span><strong>{weather.temperature}°</strong></div>
            <div className="details"><span>Feels like <b>{weather.apparent}°</b></span><span>Wind <b>{weather.wind} km/h</b></span></div>
          </div>
          <div className="forecast">
            {weather.days.map((day) => <article key={day.date}>
              <p className="day">{new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(`${day.date}T12:00:00`))}</p>
              <span className="day-icon">{iconFor(day.code)}</span>
              <p className="temps"><b>{day.max}°</b> <span>{day.min}°</span></p>
              <p className="rain">{day.rain}% rain</p>
            </article>)}
          </div>
        </>}
        {loading && !weather && <div className="message">Reading the skies…</div>}
      </section>
      <footer><span>Live data from Open-Meteo</span><span>Forecasts update automatically</span></footer>
    </main>
  );
}
