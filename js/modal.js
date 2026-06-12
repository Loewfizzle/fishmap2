let modalEl, currentModalSpot = null;

// === MODAL (premium, dual CTAs, themed, accessible) ===
function openSpotModal(spot) {
  if (!modalEl) modalEl = document.getElementById('modal');
  if (!modalEl) return;
  currentModalSpot = spot;

  const isPier = isPierOrDock(spot.access_type);

  const badge = document.getElementById('modal-badge');
  badge.textContent = isPier ? 'PIER / DOCK' : 'SHORE / BANK';
  badge.className = `badge ${isPier ? 'pier' : 'shore'}`;

  document.getElementById('modal-title').textContent = spot.name;
  document.getElementById('modal-address').textContent = spot.address;
  document.getElementById('modal-hours').textContent = spot.hours;
  document.getElementById('modal-parking').textContent = spot.parking;
  document.getElementById('modal-access').textContent = spot.access_type.charAt(0).toUpperCase() + spot.access_type.slice(1);

  const speciesEl = document.getElementById('modal-species');
  speciesEl.innerHTML = '';
  spot.species.forEach(s => {
    const pill = document.createElement('span');
    // Night mode: rely on .species-pill + .dark .species-pill CSS rules for colors (no hard-coded light bg here).
    // Size/padding kept inline for the modal variant; base styles live in the stylesheet.
    pill.className = 'species-pill';
    pill.style.fontSize = '12px';
    pill.style.padding = '4px 10px';
    pill.style.whiteSpace = 'nowrap';
    pill.textContent = s;
    speciesEl.appendChild(pill);
  });

  const desc = document.getElementById('modal-description');
  desc.textContent = spot.description;

  // Copy address
  const copyBtn = document.getElementById('modal-copy-btn');
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(spot.address);
      const orig = copyBtn.textContent;
      copyBtn.textContent = '✓';
      setTimeout(() => { copyBtn.textContent = orig; }, 1200);
    } catch {
      const range = document.createRange();
      range.selectNode(document.getElementById('modal-address'));
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    }
  };

  // Dual prominent CTAs
  const openBtn = document.getElementById('modal-open-maps-btn');
  openBtn.onclick = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${spot.lat},${spot.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const driveBtn = document.getElementById('modal-drive-btn');
  driveBtn.onclick = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  modalEl.classList.add('visible');

  // Focus first CTA for quick action
  setTimeout(() => openBtn.focus(), 180);

  const close = () => {
    modalEl.classList.remove('visible');
    document.removeEventListener('keydown', escHandler);
  };

  document.getElementById('modal-close-btn').onclick = close;
  document.getElementById('modal-close-secondary').onclick = close;
  modalEl.onclick = (e) => { if (e.target === modalEl) close(); };

  const escHandler = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); } };
  document.addEventListener('keydown', escHandler, { once: true });
}
