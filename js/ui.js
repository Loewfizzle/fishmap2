let spotsGridEl, toastEl, toastMsgEl, toastActionsEl;

const defaultSpotOrder = [...spotsData];   // original Byron Center order + static approx_miles (used for default view + Reset)
function renderSpotList(orderedSpots = defaultSpotOrder, liveDistances = null) {
  const grid = document.getElementById('spots-grid');
  if (!grid) return;
  spotsGridEl = grid;
  grid.innerHTML = '';

  // Update section header to reflect current sort mode
  const titleEl = document.getElementById('spots-section-title');
  if (titleEl) {
    if (liveDistances && liveDistances.length > 0) {
      titleEl.innerHTML = `ALL ${spotsData.length} PUBLIC SPOTS <span class="text-[#0284C7] font-normal text-xs tracking-normal">— sorted by distance from you</span>`;
    } else {
      titleEl.textContent = `ALL ${spotsData.length} PUBLIC SPOTS`;
    }
  }

  // Build quick lookup for live user distances if provided
  const liveDistMap = new Map();
  if (liveDistances && Array.isArray(liveDistances)) {
    liveDistances.forEach(item => {
      if (item.spot && typeof item.dist === 'number') {
        liveDistMap.set(item.spot.name, item.dist);
      }
    });
  }

  orderedSpots.forEach(spot => {
    const isPier = isPierOrDock(spot.access_type);
    const badgeClass = isPier ? 'pier' : 'shore';
    const badgeText = isPier ? 'PIER/DOCK' : 'SHORE';

    const liveDist = liveDistMap.get(spot.name);
    const distText = liveDist !== undefined
      ? `${liveDist.toFixed(1)} mi from you`
      : `${spot.approx_miles} mi away`;

    const card = document.createElement('div');
    card.className = 'spot-card';
    card.dataset.name = spot.name;

    // Night mode: use CSS var(--accent) for live distance highlight so it follows light/dark accent automatically.
    card.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0 flex-1">
          <h4 class="tracking-tight">${spot.name}</h4>
          <p class="meta">${spot.address}</p>
        </div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="species">${spot.species.slice(0,4).map(s => `<span class="species-pill">${s}</span>`).join('')}</div>
      <div class="dist" style="${liveDist !== undefined ? 'color:var(--accent);font-weight:600;' : ''}">${distText}</div>
    `;

    card.addEventListener('click', () => {
      if (window.openSpotModal) window.openSpotModal(spot);
      if (map) map.flyTo([spot.lat, spot.lng], Math.max(map.getZoom(), 13), { duration: 0.5 });
    });
    grid.appendChild(card);
  });
}

// Backwards-compatible alias for initial load
function populateSpotList() {
  renderSpotList();
}
function highlightListCards(closestSpots) {
  document.querySelectorAll('#spots-grid .spot-card').forEach(card => {
    card.classList.remove('near-highlight');
    const name = card.dataset.name;
    if (closestSpots.some(s => s.name === name)) {
      setTimeout(() => card.classList.add('near-highlight'), 80);
    }
  });
}

function showToast(message, hasAction = false, closest = null) {
  if (!toastEl) toastEl = document.getElementById('toast');
  if (!toastMsgEl) toastMsgEl = document.getElementById('toast-msg');
  if (!toastActionsEl) toastActionsEl = document.getElementById('toast-actions');
  if (!toastEl) return;

  toastMsgEl.textContent = message;
  toastActionsEl.innerHTML = '';
  if (hasAction && closest) {
    const showBtn = document.createElement('button');
    showBtn.textContent = 'Show on list';
    showBtn.onclick = () => {
      hideToast();
      const firstCard = document.querySelector('#spots-grid .spot-card');
      if (firstCard) firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
    toastActionsEl.appendChild(showBtn);
  }
  toastEl.classList.add('visible');
  setTimeout(() => { if (toastEl.classList.contains('visible') && !hasAction) hideToast(); }, hasAction ? 9500 : 5200);
}
function hideToast() { if (toastEl) toastEl.classList.remove('visible'); }
