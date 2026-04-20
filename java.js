// ================================================
//  ERNEST — URL Shortener
//  Full JS: particles, cursor, typewriter, reveals,
//  API, QR, history, stats, theme, toast
// ================================================

// === DOM ===
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
const historyCount = document.getElementById("history-count");
const clearHistBtn = document.getElementById("clear-history-btn");
const modeToggle   = document.getElementById("mode");
const toast        = document.getElementById("toast");
const charCount    = document.getElementById("char-count");
const qrModal      = document.getElementById("qr-modal");
const modalClose   = document.getElementById("modal-close");
const qrContainer  = document.getElementById("qr-container");
const modalUrl     = document.getElementById("modal-url");
const downloadQr   = document.getElementById("download-qr");
const modalCopyBtn = document.getElementById("modal-copy-btn");
const statCount    = document.getElementById("stat-count");
const statSaved    = document.getElementById("stat-saved");
const statSession  = document.getElementById("stat-session");
const cursorGlow   = document.getElementById("cursor-glow");

// === STATE ===
const API_KEY = "uBgmdCNHmGnuK3gZabDrG02TXoCGGDlpWIfnsdL2jOB61sHGu6F2hTAkLunH";
let history      = JSON.parse(localStorage.getItem("ernest_history") || "[]");
let sessionCount = 0;
let currentShortUrl = "";

// ================================================
// PARTICLE CANVAS
// ================================================
(function initParticles() {
  const canvas = document.getElementById("particle-canvas");
  const ctx    = canvas.getContext("2d");
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : H + 10;
      this.r  = Math.random() * 1.4 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = -(Math.random() * 0.4 + 0.1);
      this.alpha = 0;
      this.maxAlpha = Math.random() * 0.5 + 0.15;
      this.life = 0;
      this.maxLife = Math.random() * 300 + 150;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      const p = this.life / this.maxLife;
      this.alpha = p < 0.2
        ? (p / 0.2) * this.maxAlpha
        : p > 0.8
          ? ((1 - p) / 0.2) * this.maxAlpha
          : this.maxAlpha;
      if (this.life >= this.maxLife) this.reset(false);
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(100,210,190,${this.alpha})`;
      ctx.fill();
    }
  }

  // Add connecting lines between nearby particles
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 90) {
          const a = (1 - dist/90) * 0.08;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(100,210,190,${a})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener("resize", resize);
  for (let i = 0; i < 70; i++) particles.push(new Particle());
  loop();
})();

// ================================================
// CURSOR GLOW FOLLOWER
// ================================================
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let glowX  = mouseX;
let glowY  = mouseY;

document.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

(function animateCursor() {
  glowX += (mouseX - glowX) * 0.06;
  glowY += (mouseY - glowY) * 0.06;
  cursorGlow.style.left = glowX + "px";
  cursorGlow.style.top  = glowY + "px";
  requestAnimationFrame(animateCursor);
})();

// ================================================
// SCROLL REVEAL
// ================================================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

// ================================================
// TYPEWRITER HERO
// ================================================
const phrases = ["Shorten.", "Share.", "Track.", "Ernest."];
let phraseIdx = 0, charIdx = 0, deleting = false;
const typeEl = document.getElementById("typewriter");

function typewrite() {
  const phrase = phrases[phraseIdx];
  if (!deleting) {
    typeEl.textContent = phrase.slice(0, ++charIdx);
    if (charIdx === phrase.length) {
      deleting = true;
      setTimeout(typewrite, phraseIdx === phrases.length - 1 ? 3000 : 1800);
      return;
    }
    setTimeout(typewrite, 90);
  } else {
    typeEl.textContent = phrase.slice(0, --charIdx);
    if (charIdx === 0) {
      deleting = false;
      phraseIdx = (phraseIdx + 1) % phrases.length;
      setTimeout(typewrite, 320);
      return;
    }
    setTimeout(typewrite, 45);
  }
}
setTimeout(typewrite, 800);

// ================================================
// BUTTON RIPPLE
// ================================================
document.querySelectorAll(".btn-primary").forEach(btn => {
  btn.addEventListener("click", function(e) {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ripple = document.createElement("span");
    ripple.style.cssText = `
      position:absolute; border-radius:50%; pointer-events:none;
      background:rgba(255,255,255,0.25);
      width:4px; height:4px;
      left:${x}px; top:${y}px;
      transform:translate(-50%,-50%) scale(0);
      animation: ripple-out 0.6s ease-out forwards;
    `;
    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});

// Inject ripple keyframe
const style = document.createElement("style");
style.textContent = `@keyframes ripple-out { to { transform:translate(-50%,-50%) scale(60); opacity:0; } }`;
document.head.appendChild(style);

// ================================================
// THEME
// ================================================
const savedTheme = localStorage.getItem("ernest_theme");
if (savedTheme === "light") {
  document.body.classList.add("light");
  modeToggle.checked = true;
}

modeToggle.addEventListener("change", () => {
  document.body.classList.toggle("light", modeToggle.checked);
  localStorage.setItem("ernest_theme", modeToggle.checked ? "light" : "dark");
});

// ================================================
// TOAST
// ================================================
let toastTimer;
function showToast(msg, duration = 2400) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), duration);
}

// ================================================
// CHAR COUNTER
// ================================================
urlInput.addEventListener("input", () => {
  const n = urlInput.value.length;
  charCount.textContent = n;
  charCount.style.color = n > 200 ? "var(--accent3)" : n > 80 ? "var(--gold)" : "";
});

// ================================================
// STATS
// ================================================
function animateNum(el, target) {
  const start = parseInt(el.textContent) || 0;
  if (start === target) return;
  const diff = target - start;
  const dur = 550, t0 = performance.now();
  (function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(start + diff * ease);
    if (p < 1) requestAnimationFrame(step);
  })(t0);
}

function updateStats() {
  animateNum(statCount,   history.length);
  animateNum(statSession, sessionCount);
  const saved = history.reduce((acc, item) => acc + Math.max(0, item.original.length - item.short.length), 0);
  animateNum(statSaved, saved);
}

// ================================================
// FETCH URL
// ================================================
async function fetchShortUrl(longUrl) {
  const res = await fetch("https://api.tinyurl.com/create", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url: longUrl })
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return data.data.tiny_url;
}

// ================================================
// SHORTEN
// ================================================
async function handleShorten(e) {
  if (e) e.preventDefault();
  const rawUrl = urlInput.value.trim();
  if (!rawUrl) { urlInput.focus(); return; }

  try { new URL(rawUrl); } catch {
    showToast("⚠ Please enter a valid URL");
    urlInput.focus(); return;
  }

  const existing = history.find(h => h.original === rawUrl);
  if (existing) {
    setResult(existing.short);
    showToast("↩ Cached — already shortened before");
    return;
  }

  shortenBtn.classList.add("loading");
  shortenBtn.disabled = true;

  try {
    const shortUrl = await fetchShortUrl(rawUrl);
    setResult(shortUrl);
    addToHistory(rawUrl, shortUrl);
    sessionCount++;
    updateStats();
    showToast("✓ Shortened successfully!");
  } catch (err) {
    showToast("✗ API error — check the URL and try again");
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

shortenBtn.addEventListener("click", handleShorten);
urlInput.addEventListener("keydown", e => { if (e.key === "Enter") handleShorten(e); });

// ================================================
// CLEAR
// ================================================
clearBtn.addEventListener("click", () => {
  urlInput.value = "";
  charCount.textContent = "0";
  charCount.style.color = "";
  currentShortUrl = "";
  resultText.textContent = "Waiting for input...";
  resultText.href = "#";
  resultText.classList.add("placeholder");
  resultBox.classList.remove("has-url");
  urlInput.focus();
});

// ================================================
// COPY / OPEN
// ================================================
copyBtn.addEventListener("click", () => {
  if (!currentShortUrl) { showToast("⚠ Shorten a URL first"); return; }
  navigator.clipboard.writeText(currentShortUrl).then(() => showToast("✓ Copied to clipboard!"));
});

openBtn.addEventListener("click", () => {
  if (!currentShortUrl) { showToast("⚠ Nothing to open yet"); return; }
  window.open(currentShortUrl, "_blank");
});

// ================================================
// HISTORY
// ================================================
function timeAgo(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function addToHistory(original, short) {
  history.unshift({ original, short, ts: Date.now() });
  if (history.length > 20) history.pop();
  localStorage.setItem("ernest_history", JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  historyCount.textContent = history.length;

  if (history.length === 0) {
    historyEmpty.style.display = "flex";
    return;
  }
  historyEmpty.style.display = "none";

  history.forEach((item, i) => {
    const el = document.createElement("div");
    el.className = "history-item";
    el.style.animationDelay = `${i * 0.035}s`;
    el.innerHTML = `
      <span class="history-num">${String(i + 1).padStart(2, "0")}</span>
      <div class="history-item-content">
        <a class="history-short" href="${item.short}" target="_blank">${item.short}</a>
        <span class="history-original">${item.original}</span>
      </div>
      <span class="history-time">${timeAgo(item.ts)}</span>
      <button class="history-copy" title="Copy" data-url="${item.short}">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
    `;
    el.querySelector(".history-copy").addEventListener("click", function() {
      navigator.clipboard.writeText(this.dataset.url).then(() => showToast("✓ Copied!"));
    });
    historyList.appendChild(el);
  });
}

clearHistBtn.addEventListener("click", () => {
  if (!history.length) return;
  history = [];
  localStorage.removeItem("ernest_history");
  renderHistory();
  updateStats();
  showToast("History cleared");
});

// ================================================
// QR CODE
// ================================================
function loadQrLib() {
  return new Promise((resolve, reject) => {
    if (window.QRCode) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

qrBtn.addEventListener("click", async () => {
  if (!currentShortUrl) { showToast("⚠ Shorten a URL first"); return; }
  try {
    await loadQrLib();
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
      text: currentShortUrl,
      width: 200, height: 200,
      colorDark: "#0e0e1c",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
    modalUrl.textContent = currentShortUrl;
    qrModal.classList.add("show");
  } catch { showToast("✗ Could not generate QR code"); }
});

modalClose.addEventListener("click", () => qrModal.classList.remove("show"));
qrModal.addEventListener("click", e => { if (e.target === qrModal) qrModal.classList.remove("show"); });
document.addEventListener("keydown", e => { if (e.key === "Escape") qrModal.classList.remove("show"); });

downloadQr.addEventListener("click", () => {
  const canvas = qrContainer.querySelector("canvas");
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = "ernest-qr.png";
  link.href = canvas.toDataURL();
  link.click();
  showToast("✓ QR downloaded!");
});

if (modalCopyBtn) {
  modalCopyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(currentShortUrl).then(() => showToast("✓ Copied!"));
  });
}

// ================================================
// INIT
// ================================================
renderHistory();
updateStats();

// Stagger reveal on load
document.querySelectorAll(".reveal").forEach((el, i) => {
  setTimeout(() => el.classList.add("visible"), 100 + i * 100);
});