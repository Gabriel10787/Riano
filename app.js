const API_KEY = "463d02ffeb6cf999d75a2d02a996bc32";

const WEATHER_LOCATIONS = [
  { name: "Riaño", lat: 42.9755, lon: -5.0017 },
  { name: "Lois", lat: 42.9374, lon: -5.0458 },
  { name: "Buron", lat: 43.0228, lon: -5.0518 },
  { name: "Acebedo", lat: 43.0394, lon: -5.1167 },
  { name: "Posada de Valdeon", lat: 43.1521, lon: -4.9198 },
  { name: "Oseja de Sajambre", lat: 43.1382, lon: -5.0382 },
];

const MAP_POINTS = [
  { name: "Plasencia", lat: 40.0297, lon: -6.0900 },
  { name: "Riaño", lat: 42.9755, lon: -5.0017 },
  { name: "Mirador Las Hazas", lat: 42.9750, lon: -5.0108 },
  { name: "Mirador Valcayo", lat: 42.9834, lon: -5.0186 },
  { name: "Lois", lat: 42.9374, lon: -5.0458 },
  { name: "Buron", lat: 43.0228, lon: -5.0518 },
  { name: "Acebedo", lat: 43.0394, lon: -5.1167 },
  { name: "Posada de Valdeon", lat: 43.1521, lon: -4.9198 },
  { name: "Mirador del Tombo", lat: 43.1632, lon: -4.9010 },
  { name: "Plasencia", lat: 40.0297, lon: -6.0900 },
];

const ROUTE_API = "https://router.project-osrm.org/route/v1/driving/";

const TRAVEL_DAYS = [
  {
    label: "Dia 1 · Viernes",
    cardId: "dia1",
    nav: "https://www.google.com/maps/search/?api=1&query=42.9834,-5.0186",
    eat: "https://www.google.com/maps/search/?api=1&query=Parrilla+El+Molino+Ria%C3%B1o",
    route: "https://www.google.com/maps/dir/?api=1&origin=Ria%C3%B1o&destination=Mirador+de+Valcayo&travelmode=walking",
    sleep: "https://www.google.com/maps/search/?api=1&query=42.9755,-5.0017",
  },
  {
    label: "Dia 2 · Sabado",
    cardId: "dia2",
    nav: "https://www.google.com/maps/search/?api=1&query=Mirador+de+Las+Hazas",
    eat: "https://www.google.com/maps/search/?api=1&query=Restaurante+El+Meson+Ria%C3%B1o",
    route: "https://www.google.com/maps/dir/?api=1&origin=Ria%C3%B1o&destination=Mirador+de+Valcayo&travelmode=walking",
    sleep: "https://www.google.com/maps/search/?api=1&query=42.9755,-5.0017",
  },
  {
    label: "Dia 3 · Domingo",
    cardId: "dia3",
    nav: "https://www.google.com/maps/dir/?api=1&origin=Ria%C3%B1o&destination=Acebedo&waypoints=Lois%7CBuron&travelmode=driving",
    eat: "https://www.google.com/maps/search/?api=1&query=Restaurante+Lois+Le%C3%B3n",
    route: "https://www.google.com/maps/search/?api=1&query=Valle+de+Anciles",
    sleep: "https://www.google.com/maps/search/?api=1&query=43.0230,-5.0515",
  },
  {
    label: "Dia 4 · Lunes",
    cardId: "dia4",
    nav: "https://www.google.com/maps/dir/?api=1&origin=Posada+de+Valdeon&destination=Mirador+del+Tombo&travelmode=walking",
    eat: "https://www.google.com/maps/search/?api=1&query=Restaurante+Begona+Posada+de+Valdeon",
    route: "https://www.google.com/maps/search/?api=1&query=Mirador+del+Tombo",
    sleep: "https://www.google.com/maps/dir/?api=1&origin=Posada+de+Valdeon&destination=Plasencia&travelmode=driving",
  },
];

function runWhenIdle(task, timeout = 1500) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(task, { timeout });
    return;
  }
  window.setTimeout(task, 250);
}

function appendHeadLink(rel, href, extra = {}) {
  if (!href) return;
  const selector = `link[rel="${rel}"][href="${href}"]`;
  if (document.head.querySelector(selector)) return;

  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  Object.entries(extra).forEach(([key, value]) => {
    if (value !== undefined && value !== null) link.setAttribute(key, String(value));
  });
  document.head.appendChild(link);
}

function smartPreloadMobile() {
  const connection = navigator.connection;
  const saveData = Boolean(connection?.saveData);
  const effectiveType = connection?.effectiveType || "";
  const isSlowNetwork = /2g|slow-2g/i.test(effectiveType);
  const isMidNetwork = /3g/i.test(effectiveType);
  const isMobileViewport = window.matchMedia("(max-width: 900px)").matches;
  const lowMemory = typeof navigator.deviceMemory === "number" && navigator.deviceMemory <= 2;

  if (saveData || isSlowNetwork) return;

  const gallerySources = Array.from(document.querySelectorAll(".gallery-item"))
    .map((item) => item.getAttribute("href"))
    .filter((href) => Boolean(href));

  const criticalImages = ["img/Pantano de riaño.jpg", ...gallerySources];

  let preloadBudget = 5;
  if (isMobileViewport) preloadBudget = 3;
  if (isMidNetwork || lowMemory) preloadBudget = Math.min(preloadBudget, 2);

  const preloadTargets = criticalImages.slice(0, preloadBudget);

  // Adelanta DNS/TLS de hosts remotos de galeria solo cuando la red lo permite.
  const externalOrigins = new Set(
    preloadTargets
      .filter((src) => /^https?:\/\//i.test(src))
      .map((src) => new URL(src).origin)
  );

  runWhenIdle(() => {
    externalOrigins.forEach((origin) => {
      appendHeadLink("preconnect", origin, { crossorigin: "anonymous" });
      appendHeadLink("dns-prefetch", origin);
    });

    preloadTargets.forEach((src) => {
      appendHeadLink("preload", src, { as: "image" });
    });
  });

  // Precarga por proximidad: al acercarse a galeria, precarga siguiente bloque.
  const galeria = document.getElementById("galeria");
  if (!galeria || !gallerySources.length) return;

  const nextBatchStart = preloadTargets.length;
  const nextBatch = criticalImages.slice(nextBatchStart, nextBatchStart + 4);
  if (!nextBatch.length) return;

  const preloadNextBatch = () => {
    runWhenIdle(() => {
      nextBatch.forEach((src) => appendHeadLink("preload", src, { as: "image" }));
    });
  };

  if (!("IntersectionObserver" in window)) {
    preloadNextBatch();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        preloadNextBatch();
        observer.disconnect();
      });
    },
    { rootMargin: "400px 0px" }
  );

  observer.observe(galeria);
}

function showToast(message) {
  const root = document.getElementById("toastRoot");
  if (!root) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  root.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 2400);
}

function setupReveal() {
  const elements = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );
  elements.forEach((el) => observer.observe(el));
}

function setupParallaxHero() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const updateParallax = () => {
    const offset = Math.min(window.scrollY * 0.22, 120);
    hero.style.setProperty("--parallax", `${offset}px`);
  };

  updateParallax();
  window.addEventListener("scroll", updateParallax, { passive: true });
}

function setupTopMenu() {
  const toggle = document.getElementById("menuToggle");
  const menu = document.getElementById("mainMenu");
  if (!menu) return;

  const dropdowns = Array.from(menu.querySelectorAll(".menu-dropdown"));

  const closeDropdown = (dropdown) => {
    const button = dropdown.querySelector(".menu-btn");
    const panel = dropdown.querySelector(".menu-panel");
    if (!button || !panel) return;
    panel.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
    button.classList.remove("is-active");
  };

  const closeAllDropdowns = () => {
    dropdowns.forEach(closeDropdown);
  };

  if (toggle) {
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      if (!isOpen) closeAllDropdowns();
    });
  }

  dropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector(".menu-btn");
    const panel = dropdown.querySelector(".menu-panel");
    if (!button || !panel) return;

    button.addEventListener("click", () => {
      const isOpen = !panel.classList.contains("is-open");
      closeAllDropdowns();
      panel.classList.toggle("is-open", isOpen);
      button.setAttribute("aria-expanded", String(isOpen));
      button.classList.toggle("is-active", isOpen);
    });
  });

  menu.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;
    closeAllDropdowns();
    if (menu.classList.contains("is-open")) {
      menu.classList.remove("is-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.closest("#topbar")) return;
    closeAllDropdowns();
    if (menu.classList.contains("is-open")) {
      menu.classList.remove("is-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function setupPersistedCheckboxes() {
  const checkboxes = document.querySelectorAll("input[type='checkbox'][data-persist]");
  if (!checkboxes.length) return;

  checkboxes.forEach((checkbox) => {
    const key = checkbox.getAttribute("data-persist");
    if (!key) return;

    checkbox.checked = localStorage.getItem(key) === "true";
    checkbox.addEventListener("change", () => {
      localStorage.setItem(key, String(checkbox.checked));
      showToast("Checklist guardado");
    });
  });
}

function setupQueHacerAdder() {
  const buttons = document.querySelectorAll(".add-quehacer-btn[data-storage-key]");
  if (!buttons.length) return;

  const loadItems = (key) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  };

  const renderList = (key) => {
    const list = document.querySelector(`.custom-quehacer-list[data-storage-key="${key}"]`);
    if (!list) return;

    const items = loadItems(key);
    list.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
  };

  buttons.forEach((button) => {
    const key = button.getAttribute("data-storage-key");
    if (!key) return;

    renderList(key);

    button.addEventListener("click", () => {
      const value = window.prompt("Añade una nueva actividad en Qué hacer");
      if (!value || !value.trim()) return;

      const items = loadItems(key);
      items.push(value.trim());
      localStorage.setItem(key, JSON.stringify(items));
      renderList(key);
      showToast("Actividad añadida");
    });
  });
}

function setupTripNotes() {
  const area = document.getElementById("tripNotes");
  const saveButton = document.getElementById("saveTripNotes");
  const counter = document.getElementById("tripNotesCount");
  if (!area || !saveButton || !counter) return;

  const key = "trip-notes";
  const limit = 200;
  area.maxLength = limit;

  const initialValue = (localStorage.getItem(key) || "").slice(0, limit);
  area.value = initialValue;

  const updateCounter = () => {
    const length = area.value.length;
    counter.textContent = `${length}/${limit}`;
    counter.classList.toggle("is-limit", length >= limit);
  };

  const save = () => {
    const value = area.value.slice(0, limit);
    area.value = value;
    localStorage.setItem(key, value);
    updateCounter();
    showToast("Notas guardadas");
  };

  area.addEventListener("input", updateCounter);
  saveButton.addEventListener("click", save);
  updateCounter();
}

function setupBudgetPlanner() {
  const kmInput = document.getElementById("budgetKm");
  const consumoInput = document.getElementById("budgetConsumo");
  const precioGasoilInput = document.getElementById("budgetPrecioGasoil");
  const gasoilGastadoInput = document.getElementById("budgetGasoilGastado");
  const comidasInput = document.getElementById("budgetComidas");
  const barcoHechoInput = document.getElementById("budgetBarcoHecho");
  const barcoCosteInput = document.getElementById("budgetBarcoCoste");
  const areasInput = document.getElementById("budgetAreas");
  const fuelEstimateEl = document.getElementById("budgetFuelEstimate");
  const fuelUsedEl = document.getElementById("budgetFuelUsed");
  const totalEl = document.getElementById("budgetTotal");
  const budgetSectionTotalEl = document.getElementById("budgetSectionTotal");
  const saveButton = document.getElementById("saveBudgetPlanner");

  const controls = [
    kmInput,
    consumoInput,
    precioGasoilInput,
    gasoilGastadoInput,
    comidasInput,
    barcoHechoInput,
    barcoCosteInput,
    areasInput,
    fuelEstimateEl,
    fuelUsedEl,
    totalEl,
    saveButton,
  ];

  if (controls.some((item) => !item)) return;

  const key = "trip-budget-planner-v1";

  const toNumber = (value) => {
    if (typeof value !== "string") return Number.isFinite(value) ? value : 0;
    const normalized = value.trim().replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const money = (value) =>
    new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + " EUR";

  const updateBudgetMirrors = (value) => {
    if (budgetSectionTotalEl) budgetSectionTotalEl.textContent = money(value);
  };

  const restore = () => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const data = JSON.parse(raw);
      kmInput.value = data.km ?? kmInput.value;
      consumoInput.value = data.consumo ?? "";
      precioGasoilInput.value = data.precioGasoil ?? "";
      gasoilGastadoInput.value = data.gasoilGastado ?? "";
      comidasInput.value = data.comidas ?? "";
      barcoHechoInput.checked = Boolean(data.barcoHecho);
      barcoCosteInput.value = data.barcoCoste ?? barcoCosteInput.value;
      areasInput.value = data.areas ?? areasInput.value;
    } catch (error) {
      // Si falla la lectura, se usan valores por defecto del formulario.
    }
  };

  const calculate = () => {
    const km = Math.max(0, toNumber(kmInput.value));
    const consumo = Math.max(0, toNumber(consumoInput.value));
    const precioGasoil = Math.max(0, toNumber(precioGasoilInput.value));
    const gasoilGastado = Math.max(0, toNumber(gasoilGastadoInput.value));
    const comidas = Math.max(0, toNumber(comidasInput.value));
    const barcoCoste = Math.max(0, toNumber(barcoCosteInput.value));
    const areas = Math.max(0, toNumber(areasInput.value));

    const fuelEstimate = (km * consumo * precioGasoil) / 100;
    const fuelUsed = gasoilGastado > 0 ? gasoilGastado : fuelEstimate;
    const boatApplied = barcoHechoInput.checked ? barcoCoste : 0;
    const total = fuelUsed + comidas + boatApplied + areas;

    fuelEstimateEl.textContent = money(fuelEstimate);
    fuelUsedEl.textContent = money(fuelUsed);
    totalEl.textContent = money(total);
    updateBudgetMirrors(total);

    return {
      km,
      consumo,
      precioGasoil,
      gasoilGastado,
      comidas,
      barcoHecho: barcoHechoInput.checked,
      barcoCoste,
      areas,
    };
  };

  const persist = (data) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const onInput = () => {
    const snapshot = calculate();
    persist(snapshot);
  };

  [
    kmInput,
    consumoInput,
    precioGasoilInput,
    gasoilGastadoInput,
    comidasInput,
    barcoCosteInput,
    areasInput,
  ].forEach((input) => input.addEventListener("input", onInput));

  barcoHechoInput.addEventListener("change", onInput);

  saveButton.addEventListener("click", () => {
    const snapshot = calculate();
    persist(snapshot);
    showToast("Presupuesto guardado");
  });

  restore();
  calculate();
}

function setupLightbox() {
  const lightbox = document.getElementById("lightbox");
  const image = document.getElementById("lightboxImage");
  const caption = document.getElementById("lightboxCaption");
  const close = document.getElementById("lightboxClose");
  if (!lightbox || !image || !caption || !close) return;

  lightbox.hidden = true;
  image.setAttribute("src", "");

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const link = target.closest("a[data-lightbox]");
    if (!link) return;
    event.preventDefault();

    const href = link.getAttribute("href");
    const text = link.getAttribute("data-caption") || "";
    if (!href) return;

    image.setAttribute("src", href);
    caption.textContent = text;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  });

  const closeLightbox = () => {
    lightbox.hidden = true;
    image.setAttribute("src", "");
    document.body.style.overflow = "";
  };

  close.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
  });
}

function setupTravelMode() {
  const toggle = document.getElementById("travelModeToggle");
  const panel = document.getElementById("travelModePanel");
  const close = document.getElementById("travelClose");
  const next = document.getElementById("travelNextDay");
  const dayLabel = document.getElementById("travelDayLabel");
  const nav = document.getElementById("travelNav");
  const eat = document.getElementById("travelEat");
  const route = document.getElementById("travelRoute");
  const sleep = document.getElementById("travelSleep");
  if (!toggle || !panel || !close || !next || !dayLabel || !nav || !eat || !route || !sleep) return;

  // Evita huecos visuales por estados antiguos al recargar.
  document.body.classList.remove("travel-mode");
  panel.hidden = true;
  toggle.hidden = false;

  let active = false;
  let dayIndex = Number.parseInt(localStorage.getItem("travel-mode-day") || "0", 10);
  if (!Number.isFinite(dayIndex) || dayIndex < 0 || dayIndex >= TRAVEL_DAYS.length) dayIndex = 0;

  const renderDay = () => {
    const info = TRAVEL_DAYS[dayIndex];
    dayLabel.textContent = info.label;
    nav.setAttribute("href", info.nav);
    eat.setAttribute("href", info.eat);
    route.setAttribute("href", info.route);
    sleep.setAttribute("href", info.sleep);

    document.querySelectorAll("#itinerario .day-card").forEach((card) => {
      card.classList.toggle("is-current", card.id === info.cardId);
    });
  };

  const renderMode = () => {
    document.body.classList.toggle("travel-mode", active);
    panel.hidden = !active;
    toggle.hidden = false;
    close.hidden = false;
    toggle.setAttribute("aria-pressed", String(active));
    toggle.textContent = active ? "🚐 Salir de Modo Viaje" : "🚐 Modo Viaje";
    if (active) renderDay();

    localStorage.setItem("travel-mode-active", String(active));
    localStorage.setItem("travel-mode-day", String(dayIndex));
  };

  toggle.addEventListener("click", () => {
    active = !active;
    renderMode();
    showToast(active ? "Modo viaje activado" : "Modo viaje desactivado");
  });

  close.addEventListener("click", () => {
    active = false;
    renderMode();
  });

  next.addEventListener("click", () => {
    dayIndex = (dayIndex + 1) % TRAVEL_DAYS.length;
    renderDay();
    localStorage.setItem("travel-mode-day", String(dayIndex));
    showToast(`Cambio de dia: ${TRAVEL_DAYS[dayIndex].label}`);
  });

  renderMode();
}

function weatherCardTemplate(location, data) {
  const temp = Math.round(data.main.temp);
  const sky = data.weather[0].description;
  const icon = data.weather[0].icon;

  const card = document.createElement("article");
  card.className = "glass-card weather-card";
  card.innerHTML = `
    <h3>${location.name}</h3>
    <div class="weather-main">
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${sky}" />
      <div>
        <p class="temp">${temp}°C</p>
        <p>${sky}</p>
      </div>
    </div>
    <div class="weather-meta">
      <p><i class="fa-solid fa-wind"></i> Viento: ${data.wind.speed} m/s</p>
      <p><i class="fa-solid fa-droplet"></i> Humedad: ${data.main.humidity}%</p>
    </div>
    <button class="weather-forecast-btn" data-lat="${location.lat}" data-lon="${location.lon}" data-name="${location.name}">
      Ver proximos dias
    </button>
  `;
  return card;
}

function weatherErrorCard(location, message) {
  const card = document.createElement("article");
  card.className = "glass-card weather-card";
  card.innerHTML = `
    <h3>${location.name}</h3>
    <div class="weather-meta">
      <p><i class="fa-solid fa-triangle-exclamation"></i> ${message}</p>
    </div>
  `;
  return card;
}

async function loadWeather() {
  const container = document.getElementById("weatherCards");
  if (!container) return;
  container.innerHTML = "";

  const cards = await Promise.all(
    WEATHER_LOCATIONS.map(async (location) => {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=metric&lang=es`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error ${response.status}`);
        const data = await response.json();
        return weatherCardTemplate(location, data);
      } catch (error) {
        return weatherErrorCard(location, "No se pudo cargar el tiempo en este momento.");
      }
    })
  );

  cards.forEach((card) => container.appendChild(card));
}

function getDailyForecastEntries(list) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const grouped = new Map();

  list.forEach((entry) => {
    const date = entry.dt_txt.slice(0, 10);
    if (date <= today) return;
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date).push(entry);
  });

  const result = [];
  grouped.forEach((entries, date) => {
    const closestToNoon = entries.reduce((best, current) => {
      const bestHour = parseInt(best.dt_txt.slice(11, 13), 10);
      const currentHour = parseInt(current.dt_txt.slice(11, 13), 10);
      return Math.abs(currentHour - 12) < Math.abs(bestHour - 12) ? current : best;
    });
    result.push({ date, entry: closestToNoon });
  });

  return result.slice(0, 4);
}

function renderForecastPanel(cityName, forecastDays) {
  const panel = document.getElementById("forecastPanel");
  if (!panel) return;

  const cards = forecastDays
    .map(({ date, entry }) => {
      const icon = entry.weather[0].icon;
      const sky = entry.weather[0].description;
      const temp = Math.round(entry.main.temp);
      const humidity = entry.main.humidity;
      const wind = entry.wind.speed;
      const label = new Date(`${date}T00:00:00`).toLocaleDateString("es-ES", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });

      return `
        <article class="forecast-day">
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${sky}" />
          <div>
            <strong>${label}</strong>
            <p>${temp}°C · ${sky}</p>
            <p class="forecast-day__meta">Humedad ${humidity}% · Viento ${wind} m/s</p>
          </div>
        </article>
      `;
    })
    .join("");

  panel.hidden = false;
  panel.innerHTML = `
    <h3>Prevision proximos dias · ${cityName}</h3>
    <div class="forecast-grid">${cards || "<p>Sin datos de prevision disponibles.</p>"}</div>
  `;
}

function setupForecastByCity() {
  const container = document.getElementById("weatherCards");
  const panel = document.getElementById("forecastPanel");
  if (!container || !panel) return;

  container.addEventListener("click", async (event) => {
    const button = event.target.closest(".weather-forecast-btn");
    if (!button) return;

    const lat = button.dataset.lat;
    const lon = button.dataset.lon;
    const cityName = button.dataset.name;
    if (!lat || !lon || !cityName) return;

    panel.hidden = false;
    panel.innerHTML = `<p>Cargando prevision para ${cityName}...</p>`;

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error ${response.status}`);
      const data = await response.json();
      const days = getDailyForecastEntries(data.list || []);
      renderForecastPanel(cityName, days);
    } catch (error) {
      panel.innerHTML = `<p>No se pudo cargar la prevision de ${cityName}.</p>`;
    }
  });
}

async function getRoadRoute(points) {
  const coordinates = points.map((point) => `${point.lon},${point.lat}`).join(";");
  const url = `${ROUTE_API}${coordinates}?overview=full&geometries=geojson&alternatives=false`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Error ${response.status}`);

  const data = await response.json();
  const coords = data.routes?.[0]?.geometry?.coordinates;
  if (!coords?.length) throw new Error("Sin geometria de ruta");
  return coords.map(([lon, lat]) => [lat, lon]);
}

async function initMap() {
  const mapElement = document.getElementById("map");
  const mapStatus = document.getElementById("mapStatus");
  if (!mapElement || typeof L === "undefined") return;

  const map = L.map("map", { scrollWheelZoom: false }).setView([42.99, -5.0], 9);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  MAP_POINTS.slice(0, -1).forEach((point) => {
    L.marker([point.lat, point.lon])
      .addTo(map)
      .bindPopup(`<strong>${point.name}</strong>`);
  });

  let latLngs;
  try {
    latLngs = await getRoadRoute(MAP_POINTS);
    if (mapStatus) mapStatus.textContent = "Ruta por carretera cargada.";
  } catch (error) {
    latLngs = MAP_POINTS.map((point) => [point.lat, point.lon]);
    if (mapStatus) mapStatus.textContent = "Ruta mostrada en linea directa (fallback).";
  }

  const route = L.polyline(latLngs, {
    color: "#f08a3e",
    weight: 5,
    opacity: 0.9,
    lineJoin: "round",
  }).addTo(map);

  map.fitBounds(route.getBounds(), { padding: [20, 20] });
}

document.addEventListener("DOMContentLoaded", () => {
  setupTopMenu();
  setupReveal();
  setupParallaxHero();
  smartPreloadMobile();
  setupPersistedCheckboxes();
  setupQueHacerAdder();
  setupTripNotes();
  setupBudgetPlanner();
  setupLightbox();
  setupTravelMode();
  loadWeather();
  setupForecastByCity();
  initMap();
});
