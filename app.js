const AIRPORTS = [
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', lat: 40.6413, lon: -73.7781 },
  { code: 'LGA', name: 'LaGuardia', city: 'New York', lat: 40.7769, lon: -73.8740 },
  { code: 'EWR', name: 'Newark Liberty', city: 'Newark', lat: 40.6895, lon: -74.1745 },
  { code: 'LHR', name: 'Heathrow', city: 'London', lat: 51.4700, lon: -0.4543 },
  { code: 'CDG', name: 'Charles de Gaulle', city: 'Paris', lat: 49.0097, lon: 2.5479 },
  { code: 'HND', name: 'Haneda', city: 'Tokyo', lat: 35.5494, lon: 139.7798 },
  { code: 'NRT', name: 'Narita', city: 'Tokyo', lat: 35.7720, lon: 140.3929 },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', lat: 33.9416, lon: -118.4085 },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', lat: 37.6213, lon: -122.3790 },
  { code: 'ORD', name: "O'Hare International", city: 'Chicago', lat: 41.9742, lon: -87.9073 },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta', city: 'Atlanta', lat: 33.6407, lon: -84.4277 },
  { code: 'MIA', name: 'Miami International', city: 'Miami', lat: 25.7959, lon: -80.2870 },
  { code: 'DFW', name: 'Dallas/Fort Worth', city: 'Dallas', lat: 32.8998, lon: -97.0403 },
  { code: 'SEA', name: 'Seattle-Tacoma', city: 'Seattle', lat: 47.4502, lon: -122.3088 },
  { code: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', lat: 43.6777, lon: -79.6248 },
  { code: 'FRA', name: 'Frankfurt', city: 'Frankfurt', lat: 50.0379, lon: 8.5622 },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai', lat: 25.2532, lon: 55.3657 },
  { code: 'SIN', name: 'Changi', city: 'Singapore', lat: 1.3644, lon: 103.9915 },
  { code: 'SYD', name: 'Sydney', city: 'Sydney', lat: -33.9399, lon: 151.1753 },
  { code: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', lat: 52.3105, lon: 4.7683 }
];

const AIRLINE_MAP = {
  AAL: 'American Airlines', DAL: 'Delta Air Lines', UAL: 'United Airlines', JBU: 'JetBlue', SWA: 'Southwest',
  BAW: 'British Airways', AFR: 'Air France', DLH: 'Lufthansa', KLM: 'KLM', UAE: 'Emirates', QFA: 'Qantas',
  SIA: 'Singapore Airlines', ANA: 'ANA', JAL: 'Japan Airlines', ACA: 'Air Canada', FFT: 'Frontier', NKS: 'Spirit'
};

const PRESETS = [
  { id: 'world', label: 'World', bbox: null, flyTo: { lon: -30, lat: 24, height: 22000000 } },
  { id: 'usa', label: 'USA', bbox: { lamin: 24, lamax: 50, lomin: -126, lomax: -66 }, flyTo: { lon: -98, lat: 38, height: 7000000 } },
  { id: 'europe', label: 'Europe', bbox: { lamin: 35, lamax: 62, lomin: -12, lomax: 28 }, flyTo: { lon: 10, lat: 50, height: 5200000 } },
  { id: 'eastAsia', label: 'East Asia', bbox: { lamin: 20, lamax: 49, lomin: 103, lomax: 146 }, flyTo: { lon: 126, lat: 34, height: 5500000 } },
  { id: 'atlantic', label: 'Atlantic', bbox: { lamin: 20, lamax: 65, lomin: -80, lomax: 15 }, flyTo: { lon: -35, lat: 42, height: 7500000 } },
  { id: 'nyc', label: 'NYC', bbox: { lamin: 39.4, lamax: 42.2, lomin: -75.7, lomax: -72.6 }, flyTo: { lon: -74.0, lat: 40.7, height: 550000 } },
  { id: 'london', label: 'London', bbox: { lamin: 50.2, lamax: 52.3, lomin: -1.7, lomax: 1.2 }, flyTo: { lon: -0.1, lat: 51.5, height: 450000 } }
];

const MAX_FLIGHTS = 70;
const REFRESH_MS = 20000;
let autoRefresh = true;
let trailsEnabled = true;
let labelsEnabled = false;
let currentPreset = PRESETS[5];
let deferredPrompt = null;
let selectedId = null;
let refreshTimer = null;
let lastLiveFetchWorked = false;
const entityMap = new Map();
const trailMap = new Map();
const historyMap = new Map();
let currentFlights = [];

const els = {
  statusText: document.getElementById('statusText'),
  installBtn: document.getElementById('installBtn'),
  locateBtn: document.getElementById('locateBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  airportSearch: document.getElementById('airportSearch'),
  flightSearch: document.getElementById('flightSearch'),
  airlineFilter: document.getElementById('airlineFilter'),
  presetRow: document.getElementById('presetRow'),
  modePill: document.getElementById('modePill'),
  flightCount: document.getElementById('flightCount'),
  updatedAt: document.getElementById('updatedAt'),
  messageBar: document.getElementById('messageBar'),
  flightCard: document.getElementById('flightCard'),
  cardTitle: document.getElementById('cardTitle'),
  cardSubtitle: document.getElementById('cardSubtitle'),
  detailsGrid: document.getElementById('detailsGrid'),
  closeCardBtn: document.getElementById('closeCardBtn'),
  toggleAutoBtn: document.getElementById('toggleAutoBtn'),
  toggleTrailsBtn: document.getElementById('toggleTrailsBtn'),
  toggleLabelsBtn: document.getElementById('toggleLabelsBtn'),
  goAirportBtn: document.getElementById('goAirportBtn')
};

Cesium.Ion.defaultAccessToken = undefined;
const viewer = new Cesium.Viewer('cesiumContainer', {
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  fullscreenButton: false,
  infoBox: false,
  selectionIndicator: false,
  timeline: false,
  animation: false,
  requestRenderMode: true,
  targetFrameRate: 60,
  imageryProvider: new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' }),
  terrainProvider: new Cesium.EllipsoidTerrainProvider()
});
viewer.scene.globe.enableLighting = true;
viewer.scene.skyAtmosphere.show = true;
viewer.scene.fog.enabled = false;
viewer.clock.shouldAnimate = true;
viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(currentPreset.flyTo.lon, currentPreset.flyTo.lat, currentPreset.flyTo.height), duration: 0 });

viewer.selectedEntityChanged.addEventListener((entity) => {
  if (!entity || !entity.properties) return;
  showFlightCard(entity.properties.getValue(Cesium.JulianDate.now()));
});

function formatNumber(value, suffix = '') {
  return value == null || Number.isNaN(value) ? '—' : `${Math.round(value)}${suffix}`;
}
function formatTime(ts = Date.now()) {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
function airlineName(callsign = '') {
  return AIRLINE_MAP[(callsign || '').trim().slice(0, 3).toUpperCase()] || 'Other';
}
function airportMatch(query) {
  const q = query.trim().toLowerCase();
  return AIRPORTS.find(a => [a.code, a.name, a.city].some(v => v.toLowerCase().includes(q)));
}
function setMessage(text, warn = true) {
  if (!text) {
    els.messageBar.classList.add('hidden');
    return;
  }
  els.messageBar.textContent = text;
  els.messageBar.classList.remove('hidden');
  els.messageBar.style.background = warn ? 'rgba(245,158,11,.16)' : 'rgba(94,234,212,.12)';
  els.messageBar.style.borderColor = warn ? 'rgba(245,158,11,.35)' : 'rgba(94,234,212,.28)';
}
function buildPresetButtons() {
  PRESETS.forEach((preset) => {
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.textContent = preset.label;
    btn.addEventListener('click', () => {
      currentPreset = preset;
      flyTo(preset.flyTo);
      loadFlights();
    });
    els.presetRow.appendChild(btn);
  });
}
function buildAirlineFilter() {
  els.airlineFilter.innerHTML = ['<option value="">All airlines</option>']
    .concat(Object.values(AIRLINE_MAP).sort().map(name => `<option value="${name}">${name}</option>`))
    .join('');
}
function flyTo({ lon, lat, height }) {
  viewer.camera.flyTo({ destination: Cesium.Cartesian3.fromDegrees(lon, lat, height), duration: 1.2 });
}
function showFlightCard(flight) {
  selectedId = flight.id;
  els.flightCard.classList.remove('hidden');
  els.cardTitle.textContent = flight.callsign || 'Unknown callsign';
  els.cardSubtitle.textContent = `${flight.airline} • ${flight.origin || 'Unknown origin'} • ${flight.country || 'Unknown country'}`;
  const fields = [
    ['ICAO', flight.id], ['Altitude', formatNumber(flight.altitude, ' m')], ['Speed', formatNumber(flight.velocity, ' m/s')],
    ['Heading', formatNumber(flight.heading, '°')], ['Vertical rate', formatNumber(flight.verticalRate, ' m/s')], ['Baro alt', formatNumber(flight.baroAltitude, ' m')],
    ['Location', `${flight.lat?.toFixed(3) ?? '—'}, ${flight.lon?.toFixed(3) ?? '—'}`], ['Updated', formatTime(flight.timePosition || Date.now())]
  ];
  els.detailsGrid.innerHTML = fields.map(([dt, dd]) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`).join('');
}
function applyFilters(flights) {
  const flightQuery = els.flightSearch.value.trim().toUpperCase();
  const airline = els.airlineFilter.value;
  return flights.filter(f => {
    const flightOk = !flightQuery || (f.callsign || '').toUpperCase().includes(flightQuery) || f.id.toUpperCase().includes(flightQuery);
    const airlineOk = !airline || f.airline === airline;
    return flightOk && airlineOk;
  });
}
function updateEntity(flight) {
  let entity = entityMap.get(flight.id);
  const position = Cesium.Cartesian3.fromDegrees(flight.lon, flight.lat, Math.max(500, flight.altitude || 1000));
  if (!entity) {
    entity = viewer.entities.add({
      id: flight.id,
      position,
      billboard: {
        image: flight.selected ? undefined : undefined,
        color: Cesium.Color.fromCssColorString('#7dd3fc'),
        scale: 0.72,
        verticalOrigin: Cesium.VerticalOrigin.CENTER,
        imageSubRegion: undefined
      },
      point: {
        pixelSize: 9,
        color: Cesium.Color.fromCssColorString('#7dd3fc'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 1,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: labelsEnabled ? {
        text: flight.callsign || flight.id,
        font: '12px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        pixelOffset: new Cesium.Cartesian2(0, -18),
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('rgba(15,23,42,0.75)')
      } : undefined,
      properties: flight
    });
    entityMap.set(flight.id, entity);
  } else {
    entity.position = position;
    entity.properties = flight;
    if (entity.label) {
      entity.label.text = flight.callsign || flight.id;
      entity.label.show = labelsEnabled;
    } else if (labelsEnabled) {
      entity.label = new Cesium.LabelGraphics({
        text: flight.callsign || flight.id,
        font: '12px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        pixelOffset: new Cesium.Cartesian2(0, -18),
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString('rgba(15,23,42,0.75)')
      });
    }
  }
  if (flight.heading != null) {
    entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
      position,
      new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(flight.heading), 0, 0)
    );
  }
  if (trailsEnabled) {
    const history = historyMap.get(flight.id) || [];
    history.push({ lon: flight.lon, lat: flight.lat, alt: Math.max(500, flight.altitude || 1000) });
    if (history.length > 8) history.shift();
    historyMap.set(flight.id, history);
    let trail = trailMap.get(flight.id);
    const positions = history.map(p => Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt));
    if (!trail) {
      trail = viewer.entities.add({
        polyline: {
          positions,
          width: 2,
          material: Cesium.Color.fromCssColorString('#60a5fa').withAlpha(0.55),
          clampToGround: false
        }
      });
      trailMap.set(flight.id, trail);
    } else {
      trail.polyline.positions = positions;
      trail.show = true;
    }
  }
}
function pruneEntities(idsInUse) {
  for (const [id, entity] of entityMap.entries()) {
    if (!idsInUse.has(id)) {
      viewer.entities.remove(entity);
      entityMap.delete(id);
    }
  }
  for (const [id, trail] of trailMap.entries()) {
    if (!idsInUse.has(id) || !trailsEnabled) {
      viewer.entities.remove(trail);
      trailMap.delete(id);
      if (!idsInUse.has(id)) historyMap.delete(id);
    }
  }
}
async function fetchLiveFlights() {
  const params = new URLSearchParams();
  if (currentPreset.bbox) Object.entries(currentPreset.bbox).forEach(([k, v]) => params.set(k, v));
  const url = `https://opensky-network.org/api/states/all${params.toString() ? `?${params}` : ''}`;
  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) throw new Error(`Live fetch failed (${response.status})`);
  const data = await response.json();
  const states = data.states || [];
  const cleaned = states
    .filter(row => row[5] != null && row[6] != null)
    .map(row => ({
      id: row[0], country: row[2], timePosition: row[3] ? row[3] * 1000 : null, lastContact: row[4] ? row[4] * 1000 : null,
      lon: row[5], lat: row[6], baroAltitude: row[7], onGround: row[8], velocity: row[9], heading: row[10], verticalRate: row[11],
      altitude: row[13], callsign: (row[1] || '').trim(), origin: row[2], airline: airlineName(row[1] || '')
    }))
    .sort((a, b) => (b.altitude || 0) - (a.altitude || 0))
    .slice(0, MAX_FLIGHTS);
  return cleaned;
}
function generateDemoFlights() {
  const ref = currentPreset.flyTo;
  const flights = [];
  for (let i = 0; i < 28; i += 1) {
    const lon = ref.lon + (Math.random() - 0.5) * (currentPreset.bbox ? (currentPreset.bbox.lomax - currentPreset.bbox.lomin) * 0.7 : 40);
    const lat = ref.lat + (Math.random() - 0.5) * (currentPreset.bbox ? (currentPreset.bbox.lamax - currentPreset.bbox.lamin) * 0.7 : 24);
    const prefix = Object.keys(AIRLINE_MAP)[i % Object.keys(AIRLINE_MAP).length];
    flights.push({
      id: `demo-${i}`,
      country: 'Demo feed',
      timePosition: Date.now(),
      lastContact: Date.now(),
      lon, lat,
      baroAltitude: 6000 + Math.random() * 7000,
      onGround: false,
      velocity: 160 + Math.random() * 110,
      heading: Math.random() * 360,
      verticalRate: (Math.random() - 0.5) * 8,
      altitude: 6500 + Math.random() * 7000,
      callsign: `${prefix}${100 + i}`,
      origin: 'Demo region',
      airline: AIRLINE_MAP[prefix]
    });
  }
  return flights;
}
function renderFlights(flights) {
  currentFlights = flights;
  const filtered = applyFilters(flights);
  const ids = new Set(filtered.map(f => f.id));
  filtered.forEach(updateEntity);
  pruneEntities(ids);
  els.flightCount.textContent = String(filtered.length);
  els.updatedAt.textContent = formatTime();
  if (selectedId) {
    const selected = filtered.find(f => f.id === selectedId);
    if (selected) showFlightCard(selected);
  }
  viewer.scene.requestRender();
}
async function loadFlights() {
  els.statusText.textContent = 'Refreshing flights…';
  try {
    const live = await fetchLiveFlights();
    lastLiveFetchWorked = live.length > 0;
    renderFlights(live.length ? live : generateDemoFlights());
    els.modePill.textContent = live.length ? 'Live' : 'Demo';
    els.statusText.textContent = live.length ? 'Live flights loaded' : 'Live feed empty — showing demo flights';
    setMessage(live.length ? '' : 'No public live states were returned for this view, so demo flights are shown.', !live.length);
  } catch (error) {
    lastLiveFetchWorked = false;
    const demo = generateDemoFlights();
    renderFlights(demo);
    els.modePill.textContent = 'Demo';
    els.statusText.textContent = 'Live feed unavailable — demo mode';
    setMessage('This static PWA tried to load a public live feed in the browser. If the provider blocks CORS or rate-limits you, the app falls back to demo mode. Host it on HTTPS and try again later for best live results.', true);
  }
}
function scheduleRefresh() {
  clearInterval(refreshTimer);
  if (autoRefresh) refreshTimer = setInterval(loadFlights, REFRESH_MS);
}
function searchAirportAndFly() {
  const match = airportMatch(els.airportSearch.value);
  if (!match) {
    setMessage('Airport not found in the built-in quick list. Try JFK, LHR, Tokyo, Dubai, Sydney, or another major city.', true);
    return;
  }
  setMessage(`${match.code} • ${match.name}`, false);
  currentPreset = {
    id: `airport-${match.code}`,
    label: match.code,
    bbox: { lamin: match.lat - 1.2, lamax: match.lat + 1.2, lomin: match.lon - 1.6, lomax: match.lon + 1.6 },
    flyTo: { lon: match.lon, lat: match.lat, height: 350000 }
  };
  flyTo(currentPreset.flyTo);
  loadFlights();
}
function toggleLabels() {
  labelsEnabled = !labelsEnabled;
  els.toggleLabelsBtn.textContent = `Labels: ${labelsEnabled ? 'On' : 'Off'}`;
  renderFlights(currentFlights);
}

els.refreshBtn.addEventListener('click', loadFlights);
els.goAirportBtn.addEventListener('click', searchAirportAndFly);
els.airportSearch.addEventListener('keydown', e => { if (e.key === 'Enter') searchAirportAndFly(); });
els.flightSearch.addEventListener('input', () => renderFlights(currentFlights));
els.airlineFilter.addEventListener('change', () => renderFlights(currentFlights));
els.closeCardBtn.addEventListener('click', () => els.flightCard.classList.add('hidden'));
els.toggleAutoBtn.addEventListener('click', () => {
  autoRefresh = !autoRefresh;
  els.toggleAutoBtn.textContent = `Auto refresh: ${autoRefresh ? 'On' : 'Off'}`;
  scheduleRefresh();
});
els.toggleTrailsBtn.addEventListener('click', () => {
  trailsEnabled = !trailsEnabled;
  els.toggleTrailsBtn.textContent = `Trails: ${trailsEnabled ? 'On' : 'Off'}`;
  renderFlights(currentFlights);
});
els.toggleLabelsBtn.addEventListener('click', toggleLabels);
els.locateBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    setMessage('Geolocation is not available in this browser.', true);
    return;
  }
  navigator.geolocation.getCurrentPosition((position) => {
    const { latitude: lat, longitude: lon } = position.coords;
    flyTo({ lon, lat, height: 500000 });
    currentPreset = { id: 'nearby', label: 'My area', bbox: { lamin: lat - 1.5, lamax: lat + 1.5, lomin: lon - 2.0, lomax: lon + 2.0 }, flyTo: { lon, lat, height: 500000 } };
    setMessage('Centered on your current area.', false);
    loadFlights();
  }, () => setMessage('Location access was denied, so the app stayed on the current view.', true), { enableHighAccuracy: true, timeout: 10000 });
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  els.installBtn.classList.remove('hidden');
});
els.installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    els.installBtn.classList.add('hidden');
  } else {
    setMessage('On iPhone: tap Share, then Add to Home Screen.', false);
  }
});
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

buildPresetButtons();
buildAirlineFilter();
loadFlights();
scheduleRefresh();
