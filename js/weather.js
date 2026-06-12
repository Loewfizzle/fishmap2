let weatherCardsEl = null;

// ============================================================
// Weather (live data from Open-Meteo — free, no API key)
// "Now" + next 4 hours for the Byron Center area, in local
// (America/Detroit) time. Refreshes every 30 minutes.
// ============================================================
const WEATHER_TIMEZONE = 'America/Detroit';
const WEATHER_URL = `https://api.open-meteo.com/v1/forecast?latitude=${DEFAULT_CENTER[0]}&longitude=${DEFAULT_CENTER[1]}`
  + '&hourly=temperature_2m,weather_code,wind_speed_10m'
  + '&temperature_unit=fahrenheit&wind_speed_unit=mph'
  + `&timezone=${encodeURIComponent(WEATHER_TIMEZONE)}&forecast_days=2`;
const WEATHER_REFRESH_MS = 30 * 60 * 1000;

let hourlyData = null;        // last successful fetch: [{ hour, temp, condition, wind }, ...] (48 hrs)
let weatherFetchedAt = null;  // Date of last successful fetch (shown in the "updated" stamp)

// WMO weather interpretation codes -> short display condition.
// https://open-meteo.com/en/docs (weather_code table)
function conditionFromWmoCode(code) {
  if (code === 0) return 'Clear';
  if (code === 1) return 'Mostly Sunny';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code === 85 || code === 86) return 'Snow Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
}

async function fetchWeather() {
  const res = await fetch(WEATHER_URL);
  if (!res.ok) throw new Error(`Weather API responded ${res.status}`);
  const data = await res.json();
  const h = data.hourly;
  hourlyData = h.time.map((t, i) => ({
    hour: parseInt(t.slice(11, 13), 10),   // ISO "YYYY-MM-DDTHH:00" in WEATHER_TIMEZONE
    temp: Math.round(h.temperature_2m[i]),
    condition: conditionFromWmoCode(h.weather_code[i]),
    wind: Math.round(h.wind_speed_10m[i])
  }));
  weatherFetchedAt = new Date();
}

// Current hour in the spots' timezone (visitors elsewhere still see Byron Center conditions).
function getCurrentLocalHour() {
  return parseInt(new Intl.DateTimeFormat('en-US', {
    timeZone: WEATHER_TIMEZONE, hour: 'numeric', hour12: false
  }).format(new Date()), 10) % 24;
}

async function refreshWeather() {
  try {
    await fetchWeather();
    renderWeatherCards();
  } catch (err) {
    // Keep showing the last good data if we have it; otherwise show the error state.
    if (!hourlyData) showWeatherError();
  }
}

function showWeatherError() {
  weatherCardsEl = document.getElementById('weather-cards');
  if (!weatherCardsEl) return;
  weatherCardsEl.innerHTML = `<div class="weather-error">Live weather unavailable right now — tap Near Me anyway and check the sky.</div>`;
}

function getSunIcon() {
  return `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
}
// Night mode: secondary icon strokes (moon/cloud grays) use var(--icon-secondary),
// defined in styles.css for both themes — no re-render needed on theme switch.
// (Set via inline style because SVG presentation attributes don't support var().)
function getMoonIcon() {
  return `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" style="stroke:var(--icon-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
}
function getCloudIcon() {
  return `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" style="stroke:var(--icon-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>`;
}
function getPartlyCloudyIcon() {
  return `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" style="stroke:var(--icon-secondary)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><circle cx="7.5" cy="9.5" r="2.8" stroke="#F59E0B" stroke-width="1.6"/></svg>`;
}
function getRainIcon() {
  return `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/><path d="M8 15l-1 3M12 15l-1 3M16 15l-1 3" stroke-width="1.6"/></svg>`;
}

function getIconForCondition(condition, hour = 12) {
  const c = (condition || '').toLowerCase();
  const isNight = hour < 6 || hour >= 20; // night: before 6am or 8pm+
  if (c.includes('clear')) {
    return isNight ? getMoonIcon() : getSunIcon();
  }
  if (c.includes('sunny')) return getSunIcon();
  if (c.includes('partly')) return getPartlyCloudyIcon();
  if (c.includes('rain') || c.includes('drizzle') || c.includes('shower') || c.includes('storm')) return getRainIcon();
  return getCloudIcon(); // overcast, fog, snow, cloudy, etc.
}

function formatHour(h24) {
  const h = h24 % 12 || 12;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  return `${h} ${ampm}`;
}

function updateWeatherTimestamp() {
  const el = document.getElementById('weather-updated');
  if (!el || !weatherFetchedAt) return;
  const d = weatherFetchedAt;
  let h = d.getHours();
  const ampm = h >= 12 ? 'p' : 'a';
  h = h % 12 || 12;
  const m = String(d.getMinutes()).padStart(2, '0');
  el.textContent = `${h}:${m}${ampm}`;
  el.classList.remove('hidden');
}

function renderWeatherCards() {
  weatherCardsEl = document.getElementById('weather-cards');
  if (!weatherCardsEl) return;

  // No data yet (initial load before the fetch resolves): show dimmed skeleton cards.
  if (!hourlyData) {
    weatherCardsEl.innerHTML = Array.from({ length: 5 }, () => `
      <div class="weather-card loading" aria-hidden="true">
        <div class="text-[9px] sm:text-[10px] font-semibold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">&nbsp;</div>
        <div class="my-0.5 w-8 h-8 sm:w-9 sm:h-9"></div>
        <div class="text-base sm:text-lg font-bold text-[#0284C7] dark:text-[#67E8F9] leading-none">—</div>
        <div class="text-[8px] sm:text-[9px] text-[#475569] dark:text-[#64748B] leading-none mt-0.5">Loading…</div>
      </div>
    `).join('');
    return;
  }

  const currentHour = getCurrentLocalHour();

  let startIndex = hourlyData.findIndex(d => d.hour === currentHour);
  if (startIndex === -1) {
    startIndex = hourlyData.findIndex(d => d.hour > currentHour);
    if (startIndex === -1) startIndex = 0;
  }

  const cards = [];
  for (let i = 0; i < 5; i++) {
    const idx = (startIndex + i) % hourlyData.length;
    const d = hourlyData[idx];
    const label = (i === 0) ? 'Now' : formatHour(d.hour);
    const icon = getIconForCondition(d.condition, d.hour);
    cards.push({
      label,
      temp: d.temp,
      desc: d.condition,
      wind: d.wind,
      icon
    });
  }

  const html = cards.map(c => `
    <div class="weather-card">
      <!-- Night mode: dark: variants ensure text/icons readable on dark surfaces; arbitrary colors + Tailwind dark: work with dynamic insert -->
      <div class="text-[9px] sm:text-[10px] font-semibold text-[#0F172A] dark:text-[#F1F5F9] tracking-tight">${c.label}</div>
      <div class="my-0.5 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center" aria-hidden="true">${c.icon}</div>
      <div class="text-base sm:text-lg font-bold text-[#0284C7] dark:text-[#67E8F9] leading-none">${c.temp}<span class="text-[10px] font-medium">°F</span></div>
      <div class="text-[8px] sm:text-[9px] text-[#475569] dark:text-[#64748B] leading-none mt-0.5">${c.desc}</div>
      <div class="text-[8px] sm:text-[9px] text-[#64748B] dark:text-[#64748B] flex items-center gap-0.5 mt-0.5">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M3 8h11M3 12h14M3 16h9"/></svg>
        ${c.wind} mph
      </div>
    </div>
  `).join('');
  weatherCardsEl.innerHTML = html;

  updateWeatherTimestamp();
}
