const API_BASE = "http://localhost:3000/api";

const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const suggestionsEl = document.getElementById("suggestions");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const cachedList = document.getElementById("cached-list");

let debounceTimer = null;
let activeIndex = -1;
let currentSuggestions = [];

function hideSuggestions() {
  suggestionsEl.hidden = true;
  suggestionsEl.innerHTML = "";
  activeIndex = -1;
  currentSuggestions = [];
}

function formatSuggestionLabel(s) {
  const region = s.admin1 ? `${s.admin1}, ` : "";
  return { title: s.name, sub: `${region}${s.country}` };
}

function renderSuggestions(items) {
  currentSuggestions = items;
  activeIndex = -1;

  if (!items.length) {
    hideSuggestions();
    return;
  }

  suggestionsEl.innerHTML = items
    .map((s, i) => {
      const { title, sub } = formatSuggestionLabel(s);
      return `<li data-index="${i}" role="option">
        <div>${title}</div>
        <div class="sub">${sub}</div>
      </li>`;
    })
    .join("");

  suggestionsEl.hidden = false;

  suggestionsEl.querySelectorAll("li").forEach((li) => {
    li.addEventListener("mousedown", (e) => {
      e.preventDefault();
      selectSuggestion(Number(li.dataset.index));
    });
  });
}

function selectSuggestion(index) {
  const item = currentSuggestions[index];
  if (!item) return;
  cityInput.value = item.name;
  hideSuggestions();
  searchWeather(item.name);
}

function highlightActive() {
  const items = suggestionsEl.querySelectorAll("li");
  items.forEach((li, i) => {
    li.classList.toggle("active", i === activeIndex);
  });
  if (activeIndex >= 0 && items[activeIndex]) {
    items[activeIndex].scrollIntoView({ block: "nearest" });
  }
}

async function fetchSuggestions(query) {
  if (query.length < 2) {
    hideSuggestions();
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE}/weather/suggestions?q=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Suggestions failed");
    if (cityInput.value.trim() === query) {
      renderSuggestions(data);
    }
  } catch {
    hideSuggestions();
  }
}

cityInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const query = cityInput.value.trim();
  debounceTimer = setTimeout(() => fetchSuggestions(query), 300);
});

cityInput.addEventListener("keydown", (e) => {
  if (suggestionsEl.hidden || !currentSuggestions.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeIndex = Math.min(activeIndex + 1, currentSuggestions.length - 1);
    highlightActive();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeIndex = Math.max(activeIndex - 1, 0);
    highlightActive();
  } else if (e.key === "Enter" && activeIndex >= 0) {
    e.preventDefault();
    selectSuggestion(activeIndex);
  } else if (e.key === "Escape") {
    hideSuggestions();
  }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrap")) {
    hideSuggestions();
  }
});

async function searchWeather(city) {
  hideSuggestions();
  statusEl.textContent = "Loading...";
  resultEl.hidden = true;

  try {
    const res = await fetch(
      `${API_BASE}/weather/search?city=${encodeURIComponent(city)}`
    );
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Search failed");
    }

    renderWeather(data);
    loadCached();
  } catch (err) {
    statusEl.textContent = err.message;
  }
}

function renderWeather(data) {
  const { city, country, weather, source, fetchedAt } = data;
  const { current } = weather;

  statusEl.textContent = `Source: ${source} · Updated: ${fetchedAt}`;
  resultEl.hidden = false;
  resultEl.innerHTML = `
    <h2>${city}, ${country}</h2>
    <p><strong>Temperature:</strong> ${current.temperature_2m}°C</p>
    <p><strong>Wind:</strong> ${current.wind_speed_10m} km/h</p>
    <p><strong>Time:</strong> ${current.time}</p>
  `;
}

async function loadCached() {
  try {
    const res = await fetch(`${API_BASE}/weather/cached`);
    const cities = await res.json();

    cachedList.innerHTML = cities
      .map(
        (c) =>
          `<li><button type="button" data-city="${c.city}">${c.city}, ${c.country}</button></li>`
      )
      .join("");

    cachedList.querySelectorAll("button").forEach((btn) => {
      btn.addEventListener("click", () => {
        cityInput.value = btn.dataset.city;
        searchWeather(btn.dataset.city);
      });
    });
  } catch {
    cachedList.innerHTML = "<li>Could not load history</li>";
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  searchWeather(cityInput.value.trim());
});

loadCached();
