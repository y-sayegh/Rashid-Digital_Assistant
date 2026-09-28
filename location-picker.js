/**
 * pickLocation() opens a modal map overlay, lets the user click to choose a
 * point, and resolves with { lat, lng }. Rejects if the user cancels.
 * Usage: pickLocation().then(({ lat, lng }) => console.log(lat, lng));
 */
function pickLocation(options = {}) {
  const { center = [25.2048, 55.2708], zoom = 15 } = options;

  return new Promise((resolve, reject) => {
    loadLeaflet().then(() => {
      const { overlay, mapEl, coordsEl, confirmBtn, cancelBtn } = buildDom();
      document.body.appendChild(overlay);

      const map = L.map(mapEl).setView(center, zoom);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      let marker = null;
      let selected = null;

      map.on('click', (e) => {
        selected = { lat: e.latlng.lat, lng: e.latlng.lng };
        if (marker) {
          marker.setLatLng(e.latlng);
        } else {
          marker = L.marker(e.latlng).addTo(map);
        }
        coordsEl.textContent = `lat: ${selected.lat.toFixed(6)}, lng: ${selected.lng.toFixed(6)}`;
        confirmBtn.disabled = false;
      });

      function cleanup() {
        map.remove();
        overlay.remove();
      }

      confirmBtn.addEventListener('click', () => {
        if (!selected) return;
        cleanup();
        resolve(selected);
      });

      cancelBtn.addEventListener('click', () => {
        cleanup();
        reject(new Error('Location selection cancelled'));
      });

      // Leaflet needs a resize nudge once it's visible in the DOM.
      setTimeout(() => map.invalidateSize(), 0);
    }).catch(reject);
  });
}

function buildDom() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 999999;
    background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center;
  `;

  const panel = document.createElement('div');
  panel.style.cssText = `
    width: min(900px, 92vw); height: min(600px, 85vh);
    background: #fff; border-radius: 10px; overflow: hidden;
    display: flex; flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  `;

  const bar = document.createElement('div');
  bar.style.cssText = `
    height: 52px; flex: none; display: flex; align-items: center; gap: 12px;
    padding: 0 12px; background: #1f2933; color: #fff; box-sizing: border-box;
  `;

  const coordsEl = document.createElement('span');
  coordsEl.textContent = 'Click the map to select a location';
  coordsEl.style.cssText = 'flex: 1; font-family: monospace; font-size: 13px;';

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = `
    background: transparent; color: #cbd5e0; border: 1px solid #4a5568;
    border-radius: 6px; padding: 8px 14px; font-size: 14px; cursor: pointer;
  `;

  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Confirm location';
  confirmBtn.disabled = true;
  confirmBtn.style.cssText = `
    background: #2f855a; color: #fff; border: none; border-radius: 6px;
    padding: 8px 14px; font-size: 14px; cursor: pointer;
  `;

  const mapEl = document.createElement('div');
  mapEl.style.cssText = 'flex: 1;';

  bar.append(coordsEl, cancelBtn, confirmBtn);
  panel.append(bar, mapEl);
  overlay.append(panel);

  return { overlay, mapEl, coordsEl, confirmBtn, cancelBtn };
}

function loadLeaflet() {
  if (window.L) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load Leaflet'));
    document.head.appendChild(script);
  });
}
