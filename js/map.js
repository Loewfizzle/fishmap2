const DEFAULT_CENTER = [42.81, -85.72];
const DEFAULT_ZOOM = 11;
const HIGHLIGHT_DURATION_MS = 14500;

let map, spotMarkers = [], currentHighlightLayer = null, highlightTimeout = null, lastUserPosition = null;
let userLocationMarker = null;
let userLocationCircle = null;

// Night mode: reference to the active Leaflet tile layer so we can swap light<->dark tiles cleanly.
let currentTileLayer = null;

function toRad(deg) { return deg * Math.PI / 180; }
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function isPierOrDock(type) { return type === 'pier' || type === 'dock'; }
// Night mode: use vibrant cyan/teal that pop as neon on both light backgrounds and dark map tiles.
// (Previously darker #0284C7/#0D9488 were tuned only for light.)
function getColorForType(type) { return isPierOrDock(type) ? '#0EA5E9' : '#14B8A6'; }

// Night mode: swap Leaflet base layer between Carto light_all and dark_all.
// Safe to call multiple times; removes previous layer first.
function updateMapTheme() {
  if (!map) return;
  if (currentTileLayer) {
    map.removeLayer(currentTileLayer);
    currentTileLayer = null;
  }
  const isDark = document.documentElement.classList.contains('dark');
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  currentTileLayer = L.tileLayer(tileUrl, {
    attribution: '&copy; OpenStreetMap &amp; contributors &copy; CARTO',
    subdomains: 'abcd', maxZoom: 19, minZoom: 8
  }).addTo(map);
}

function createCustomIcon(accessType) {
  const color = getColorForType(accessType);
  const isPier = isPierOrDock(accessType);
  const inner = isPier 
    ? `<svg width="26" height="26" viewBox="0 0 26 26" fill="none"><rect x="4" y="10" width="18" height="6" rx="1" stroke="currentColor" stroke-width="2"/><line x1="7" y1="13" x2="7" y2="20" stroke="currentColor" stroke-width="1.5"/><line x1="19" y1="13" x2="19" y2="20" stroke="currentColor" stroke-width="1.5"/></svg>`
    : `<svg width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M5 17 Q8 12 13 17 Q18 12 21 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="13" cy="10" r="2.5" fill="currentColor"/></svg>`;
  const html = `<div class="neon-marker" style="--neon-color:${color}"><div class="marker-glow"><div class="marker-inner">${inner}</div></div></div>`;
  return L.divIcon({ className: '', html, iconSize: [48,48], iconAnchor: [24,24], popupAnchor: [0,-24] });
}

function addMarkers() {
  spotMarkers = [];
  spotsData.forEach(spot => {
    const icon = createCustomIcon(spot.access_type);
    const marker = L.marker([spot.lat, spot.lng], { icon, riseOnHover: true, keyboard: true }).addTo(map);
    marker.on('click', () => {
      if (window.openSpotModal) window.openSpotModal(spot);
      map.flyTo([spot.lat, spot.lng], Math.max(map.getZoom(), 12.5), { duration: 0.45 });
    });
    spotMarkers.push({ spot, marker });
  });
}

function highlightClosestSpots(closest) {
  clearHighlights();
  const layerGroup = L.layerGroup().addTo(map);
  currentHighlightLayer = layerGroup;

  closest.forEach(({ spot }) => {
    const color = getColorForType(spot.access_type);
    const halo = L.circleMarker([spot.lat, spot.lng], {
      radius: 32, color, weight: 3, fill: false, opacity: 0.55, className: 'neon-halo'
    }).addTo(layerGroup);
    halo._path.classList.add('halo-inner');
    halo._path.style.setProperty('--neon-color', color);
  });

  closest.forEach(({ spot }) => {
    const found = spotMarkers.find(m => m.spot === spot);
    if (found && found.marker._icon) {
      const glow = found.marker._icon.querySelector('.marker-glow');
      if (glow) {
        glow.classList.add('pulse-highlight');
        glow.style.setProperty('--neon-color', getColorForType(spot.access_type));
      }
    }
  });

  highlightTimeout = setTimeout(() => clearHighlights(), HIGHLIGHT_DURATION_MS);
}

function clearHighlights() {
  if (currentHighlightLayer) { map.removeLayer(currentHighlightLayer); currentHighlightLayer = null; }
  if (highlightTimeout) { clearTimeout(highlightTimeout); highlightTimeout = null; }
  document.querySelectorAll('.marker-glow.pulse-highlight').forEach(el => el.classList.remove('pulse-highlight'));
  document.querySelectorAll('.spot-card.near-highlight').forEach(el => el.classList.remove('near-highlight'));
}

function clearUserLocation() {
  if (userLocationMarker) {
    map.removeLayer(userLocationMarker);
    userLocationMarker = null;
  }
  if (userLocationCircle) {
    map.removeLayer(userLocationCircle);
    userLocationCircle = null;
  }
}

function setupNearMe() {
  const btn = document.getElementById('near-me-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    // Track with Vercel Analytics (works via the injected script; package installed for reference)
    if (window.va) {
      window.va('event', { name: 'near_me_clicked' });
    }

    if (!navigator.geolocation) {
      showToast('Geolocation not supported on this device.', false);
      return;
    }
    btn.disabled = true;
    btn.style.opacity = '0.6';

    clearUserLocation(); // remove any previous location indicator before getting fresh one

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: userLat, longitude: userLng } = pos.coords;
        lastUserPosition = { lat: userLat, lng: userLng };

        // Pre-compute distances once (used for map view + sorted list + highlights)
        const withDist = spotsData
          .map(spot => ({ spot, dist: calculateDistance(userLat, userLng, spot.lat, spot.lng) }))
          .sort((a, b) => a.dist - b.dist);
        const top5 = withDist.slice(0, 5);

        // Scroll the map into view (so the flyTo is visible even if user was at bottom of page)
        const mapContainer = document.getElementById('map')?.parentElement;
        if (mapContainer) {
          mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Give the scroll a moment to bring the map mostly into view before flying
        setTimeout(() => {
          if (map) {
            // Build a bounds that includes the user's current location + the 5 closest fishing spots.
            // This makes the map zoom to show BOTH your position and the relevant spots without
            // zooming "all the way in" to just the pin. If the 5 spots are clustered near you it stays
            // reasonably close; if they're spread it backs out just enough to frame them all.
            const bounds = L.latLngBounds([userLat, userLng]);
            top5.forEach(({ spot }) => bounds.extend([spot.lat, spot.lng]));

            // flyToBounds + padding + maxZoom gives context around you + nearest options.
            // maxZoom:14 prevents excessive close-up zoom even when all 5 spots are right next to you.
            map.flyToBounds(bounds, { duration: 0.85, padding: [45, 45], maxZoom: 14 });
          }

          // Show a nice "You are here" indicator on the map
          clearUserLocation();

          const accuracy = pos.coords.accuracy || 0;

          // Accuracy circle (only if reasonable precision)
          if (accuracy > 0 && accuracy < 2000) {
            userLocationCircle = L.circle([userLat, userLng], {
              radius: accuracy,
              color: '#0EA5E9',
              weight: 1,
              opacity: 0.4,
              fillColor: '#0EA5E9',
              fillOpacity: 0.12,
              interactive: false
            }).addTo(map);
          }

          // Prominent user location dot (on top of accuracy circle)
          const userIcon = L.divIcon({
            className: 'user-location-marker',
            html: `<div class="user-location-dot"></div>`,
            iconSize: [15, 15],
            iconAnchor: [7.5, 7.5],
            popupAnchor: [0, -8]
          });
          userLocationMarker = L.marker([userLat, userLng], {
            icon: userIcon,
            interactive: false,
            zIndexOffset: 1000
          }).addTo(map);

          // Re-render the entire list in real distance order from the user's location
          renderSpotList(withDist.map(d => d.spot), withDist);

          highlightClosestSpots(top5);
          highlightListCards(top5.map(t => t.spot));

          btn.disabled = false;
          btn.style.opacity = '1';
        }, 380);
      },
      (err) => {
        btn.disabled = false;
        btn.style.opacity = '1';

        // Still bring the map into view so the user sees the error toast in context
        const mapContainer = document.getElementById('map')?.parentElement;
        if (mapContainer) {
          mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        const msg = err.code === 1 ? 'Location permission denied. Enable in browser settings.' : 'Could not get your location. Try again.';
        showToast(msg, false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });
}

function resetMapView() {
  clearHighlights();
  clearUserLocation();

  // Fit map to show all markers (same as initial load)
  if (map && spotMarkers.length > 0) {
    const allMarkers = spotMarkers.map(item => item.marker);
    const group = L.featureGroup(allMarkers);
    map.flyToBounds(group.getBounds(), { duration: 0.7, padding: [30, 30], maxZoom: 12 });
  } else if (map) {
    map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.7 });
  }

  // Restore original Byron Center ordering + static distance labels
  renderSpotList();

  lastUserPosition = null;
}

function setupReset() {
  const btn = document.getElementById('reset-btn');
  if (btn) btn.addEventListener('click', resetMapView);
}

function initMap() {
  const mapEl = document.getElementById('map');
  if (!mapEl) { console.error('Map container missing'); return; }
  mapEl.setAttribute('aria-label', `Interactive map of ${spotsData.length} public fishing spots near Byron Center, Michigan`);

  map = L.map(mapEl, {
    zoomControl: true, attributionControl: true, tap: true, tapTolerance: 18,
    bounceAtZoomLimits: true, wheelPxPerZoomLevel: 90, zoomSnap: 0.25, zoomDelta: 0.5
  });

  // Night mode: use updateMapTheme() which chooses light_all or dark_all based on current .dark class.
  // This is called again from theme toggle to swap without losing markers.
  updateMapTheme();

  addMarkers();

  // Fit map to show all markers
  const allMarkers = spotMarkers.map(item => item.marker);
  if (allMarkers.length > 0) {
    const group = L.featureGroup(allMarkers);
    map.fitBounds(group.getBounds(), { padding: [30, 30], maxZoom: 12 });
  } else {
    map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }

  mapEl.style.touchAction = 'manipulation';
}
