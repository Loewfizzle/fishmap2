// ============================================================
// FishMap — Clean, professional static fishing map (classic scripts, no build step)
// Fully responsive, mobile-first, production-ready
// Night mode support added: class-based dark theme on <html>, localStorage + system pref,
// dynamic map tiles (Carto light/dark), adaptive accents/icons, full UI coverage.
// ============================================================

function bootstrap() {
  initMap();
  populateSpotList();
  setupNearMe();
  setupReset();
  renderWeatherCards();      // skeleton until first fetch resolves
  refreshWeather();          // live Open-Meteo data
  setInterval(refreshWeather, WEATHER_REFRESH_MS);

  // Night mode wiring (after DOM + map ready)
  setupThemeToggle();
  setupSystemThemeListener();

  window.openSpotModal = openSpotModal;
  window.fishMapSpots = spotsData;
  window.fishMapCalculateDistance = calculateDistance;
  window.fishMapReset = resetMapView;

  // Clean prod: no console spam
  console.log(`%c[FishMap] Ready — ${spotsData.length} public fishing spots loaded.`, 'color:#0284C7');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
