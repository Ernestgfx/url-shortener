// === DOM REFS ===
const urlInput     = document.getElementById("get-url-input");
const shortenBtn   = document.getElementById("shorten-btn");
const clearBtn     = document.getElementById("clear-btn");
const resultText   = document.getElementById("result-text");
const resultBox    = document.getElementById("result-box");
const copyBtn      = document.getElementById("copy-btn");
const qrBtn        = document.getElementById("qr-btn");
const openBtn      = document.getElementById("open-btn");
const historyList  = document.getElementById("history-list");
const historyEmpty = document.getElementById("history-empty");
const clearHistBtn = document.getElementById("clear-history-btn");
const modeToggle   = document.getElementById("mode");
const toast        = document.getElementById("toast");
const charCount    = document.getElementById("char-count");
const qrModal      = document.getElementById("qr-modal");
const modalClose   = document.getElementById("modal-close");
const qrContainer  = document.getElementById("qr-container");
const modalUrl     = document.getElementById("modal-url");
const downloadQr   = document.getElementById("download-qr");
const statCount    = document.getElementById("stat-count");
const statSaved    = document.getElementById("stat-saved");
const statSession  = document.getElementById("stat-session");

// === STATE ===
const API_KEY = "uBgmdCNHmGnuK3gZabDrG02TXoCGGDlpWIfnsdL2jOB61sHGu6F2hTAkLunH";
let history    = JSON.parse(localStorage.getItem("shrtnr_history") || "[]");
let sessionCount = 0;
let currentShortUrl = "";
let qrScript = null;

// === UTILS ===
function showToast(msg, duration = 2200) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove("show"), duration);
}

function formatTime(ts) {
  const now = Date.now();
  const diff = (now - ts) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function animateNum(el, target) {
  const start = parseInt(el.textContent) || 0;
  const diff  = target - start;
  const dur   = 500;
  const t0    = performance.now();
  function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(start + diff * p);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function updateStats() {
  animateNum(statCount,   history.length);
  animateNum(statSession, sessionCount);
  const saved = history.reduce((acc, item) => {
    return acc + Math.max(0, item.original.length - item.short.length);
  }, 0);
  animateNum(statSaved, saved);
}

// === CHAR COUNTER ===
urlInput.addEventListener("input", () => {
  charCount.textContent = urlInput.value.length;
});

// === THEME ===
const savedTheme = localStorage.getItem("shrtnr_theme");
if (savedTheme === "light") {
  document.body.classList.add("light");
  modeToggle.checked = true;
}

modeToggle.addEventListener("change", () => {
  document.body.classList.toggle("light", modeToggle.checked);
  localStorage.setItem("shrtnr_theme", modeToggle.checked ? "light" : "dark");
});

// === FETCH URL ===
async function fetchShortUrl(longUrl) {
  const response = await fetch("https://api.tinyurl.com/create", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url: longUrl })
  });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  return data.data.tiny_url;
}

// === SHORTEN ===
async function handleShorten(e) {
  e.preventDefault();
  const rawUrl = urlInput.value.trim();
  if (!rawUrl) return;

  // Validate
  try { new URL(rawUrl); } catch {
    showToast("⚠ Please enter a valid URL");
    urlInput.focus();
    return;
  }

  // Check duplicate in history
  const existing = history.find(h => h.original === rawUrl);
  if (existing) {
    setResult(existing.short);
    showToast("↩ Already shortened — showing cached result");
    return;
  }

  // Loading state
  shortenBtn.classList.add("loading");
  shortenBtn.disabled = true;

  try {
    const shortUrl = await fetchShortUrl(rawUrl);
    setResult(shortUrl);
    addToHistory(rawUrl, shortUrl);
    sessionCount++;
    updateStats();
    showToast("✓ URL shortened!");
  } catch (err) {
    showToast("✗ Failed — check your URL or try again");
    console.error(err);
  } finally {
    shortenBtn.classList.remove("loading");
    shortenBtn.disabled = false;
  }
}

function setResult(shortUrl) {
  currentShortUrl = shortUrl;
  resultText.textContent = shortUrl;
  resultText.href = shortUrl;
  resultText.classList.remove("placeholder");
  resultBox.classList.add("has-url");
}

// === HISTORY ===
function addToHistory(original, short) {
  const entry = { original, short, ts: Date.now() };
  history.unshift(entry);
  if (history.length > 20) history.pop();
  localStorage.setItem("shrtnr_history", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  if (history.length === 0) {
    historyEmpty.style.display = "block";
    return;
  }
  historyEmpty.style.display = "none";

  history.forEach((item, i) => {
    const el = document.createElement("div");
    el.className = "history-item";
    el.style.animationDelay = `${i * 0.04}s`;
    el.innerHTML = `
      <span class="history-item-icon">⌁</span>
      <div class="history-item-content">
        <a class="history-short" href="${item.short}" target="_blank">${item.short}</a>
        <span class="history-original">${item.original}</span>
      </div>
      <span class="history-time">${formatTime(item.ts)}</span>
      <button class="history-copy" title="Copy" data-url="${item.short}">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
    `;
    el.querySelector(".history-copy").addEventListener("click", function () {
      navigator.clipboard.writeText(this.dataset.url).then(() => showToast("✓ Copied!"));
    });
    historyList.appendChild(el);
  });
}

clearHistBtn.addEventListener("click", () => {
  if (history.length === 0) return;
  history = [];
  localStorage.removeItem("shrtnr_history");
  renderHistory();
  updateStats();
  showToast("History cleared");
});

// === COPY ===
copyBtn.addEventListener("click", () => {
  if (!currentShortUrl) {
    showToast("⚠ Shorten a URL first!");
    return;
  }
  navigator.clipboard.writeText(currentShortUrl).then(() => {
    showToast("✓ Copied to clipboard!");
  });
});

// === OPEN ===
openBtn.addEventListener("click", () => {
  if (!currentShortUrl) {
    showToast("⚠ Nothing to open yet");
    return;
  }
  window.open(currentShortUrl, "_blank");
});

// === CLEAR ===
clearBtn.addEventListener("click", () => {
  urlInput.value = "";
  charCount.textContent = "0";
  currentShortUrl = "";
  resultText.textContent = "—";
  resultText.href = "#";
  resultText.classList.add("placeholder");
  resultBox.classList.remove("has-url");
  urlInput.focus();
});

// === QR CODE ===
function loadQrLib() {
  return new Promise((resolve, reject) => {
    if (window.QRCode) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

qrBtn.addEventListener("click", async () => {
  if (!currentShortUrl) {
    showToast("⚠ Shorten a URL first!");
    return;
  }
  try {
    await loadQrLib();
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
      text: currentShortUrl,
      width: 220,
      height: 220,
      colorDark: "#0a0a12",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
    modalUrl.textContent = currentShortUrl;
    qrModal.classList.add("show");
  } catch {
    showToast("✗ Could not load QR library");
  }
});

modalClose.addEventListener("click", () => qrModal.classList.remove("show"));
qrModal.addEventListener("click", (e) => { if (e.target === qrModal) qrModal.classList.remove("show"); });

downloadQr.addEventListener("click", () => {
  const canvas = qrContainer.querySelector("canvas");
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = "shrtnr-qr.png";
  link.href = canvas.toDataURL();
  link.click();
  showToast("✓ QR downloaded!");
});

// === KEYBOARD SHORTCUT: Enter to shorten ===
urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleShorten(e);
  }
});

// === FORM SUBMIT ===
// Using the shorten button directly (no form needed for event)
shortenBtn.addEventListener("click", handleShorten);

// === INIT ===
resultText.classList.add("placeholder");
renderHistory();
updateStats();