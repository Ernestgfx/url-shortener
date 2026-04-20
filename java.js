// === DOM REFS ===
// Collecting references to all HTML elements for manipulation
// This creates shortcuts to avoid repeatedly calling getElementById

const urlInput     = document.getElementById("get-url-input");        // Input field where user pastes long URL
const shortenBtn   = document.getElementById("shorten-btn");          // Button that triggers URL shortening
const clearBtn     = document.getElementById("clear-btn");            // Button to clear input and reset display
const resultText   = document.getElementById("result-text");          // Anchor element displaying shortened URL
const resultBox    = document.getElementById("result-box");           // Container box for results area
const copyBtn      = document.getElementById("copy-btn");             // Button to copy shortened URL to clipboard
const qrBtn        = document.getElementById("qr-btn");               // Button to generate QR code for shortened URL
const openBtn      = document.getElementById("open-btn");             // Button to open shortened URL in new tab
const historyList  = document.getElementById("history-list");         // Container for displaying history items
const historyEmpty = document.getElementById("history-empty");        // Message shown when no history exists
const clearHistBtn = document.getElementById("clear-history-btn");    // Button to delete all history
const modeToggle   = document.getElementById("mode");                 // Checkbox for dark/light theme switching
const toast        = document.getElementById("toast");                // Temporary notification popup element
const charCount    = document.getElementById("char-count");           // Displays character count of input URL
const qrModal      = document.getElementById("qr-modal");             // Modal overlay for QR code display
const modalClose   = document.getElementById("modal-close");          // Button to close QR modal
const qrContainer  = document.getElementById("qr-container");         // Container where QR code image is rendered
const modalUrl     = document.getElementById("modal-url");            // Shows URL text inside QR modal
const downloadQr   = document.getElementById("download-qr");          // Button to save QR code as PNG image
const statCount    = document.getElementById("stat-count");           // Shows total number of shortened links
const statSaved    = document.getElementById("stat-saved");           // Shows total characters saved across all links
const statSession  = document.getElementById("stat-session");         // Shows links shortened in current session


// === STATE ===
// Application state variables that track data across the session

const API_KEY = "uBgmdCNHmGnuK3gZabDrG02TXoCGGDlpWIfnsdL2jOB61sHGu6F2hTAkLunH";  // Authentication key for TinyURL API service

let history    = JSON.parse(localStorage.getItem("shrtnr_history") || "[]");  // Load saved history from browser storage, or empty array if none exists

let sessionCount = 0;        // Counter for links shortened in current session (not persisted)

let currentShortUrl = "";    // Stores the most recently shortened URL for quick access by copy/open/QR buttons

let qrScript = null;         // Placeholder for QR code library reference (currently unused, kept for potential future use)


// === UTILS ===
// Helper functions used throughout the application

// Displays temporary notification message to user
function showToast(msg, duration = 2200) {
  toast.textContent = msg;                      // Set message text
  toast.classList.add("show");                  // Make toast visible with animation
  clearTimeout(showToast._timer);               // Clear previous timer to prevent conflicts
  showToast._timer = setTimeout(() => toast.classList.remove("show"), duration);  // Auto-hide after duration ms
}

// Converts timestamp to human-readable relative time (e.g., "5m ago", "just now")
function formatTime(ts) {
  const now = Date.now();                       // Current time in milliseconds
  const diff = (now - ts) / 1000;               // Difference in seconds
  
  // Return appropriate format based on time difference
  if (diff < 60)   return "just now";           // Less than 1 minute
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;     // Less than 1 hour, show minutes
  if (diff < 86400)return `${Math.floor(diff/3600)}h ago`;   // Less than 1 day, show hours
  return new Date(ts).toLocaleDateString();     // Older than 1 day, show actual date
}

// Smoothly animates a number counter from current value to target value
function animateNum(el, target) {
  const start = parseInt(el.textContent) || 0;  // Get current displayed number
  const diff  = target - start;                 // Calculate how much to change
  const dur   = 500;                            // Animation duration in milliseconds
  const t0    = performance.now();              // Timestamp when animation starts
  
  // Recursive animation function using requestAnimationFrame for smooth 60fps
  function step(now) {
    const p = Math.min((now - t0) / dur, 1);    // Calculate progress (0 to 1)
    el.textContent = Math.round(start + diff * p);  // Update displayed number
    if (p < 1) requestAnimationFrame(step);     // Continue until complete
  }
  requestAnimationFrame(step);                  // Start the animation
}

// Updates all statistics displayed in the stats bar
function updateStats() {
  animateNum(statCount,   history.length);      // Total links = history array length
  
  animateNum(statSession, sessionCount);        // Session links = counter variable
  
  // Calculate total characters saved: sum of (original length - shortened length) for all links
  const saved = history.reduce((acc, item) => {
    return acc + Math.max(0, item.original.length - item.short.length);
  }, 0);
  animateNum(statSaved, saved);                 // Animate characters saved counter
}


// === CHAR COUNTER ===
// Updates character counter in real-time as user types
urlInput.addEventListener("input", () => {
  charCount.textContent = urlInput.value.length;  // Show current input length
});


// === THEME ===
// Dark/Light mode functionality with persistence

const savedTheme = localStorage.getItem("shrtnr_theme");  // Check for saved theme preference
if (savedTheme === "light") {                    // If user previously selected light theme
  document.body.classList.add("light");          // Apply light theme class
  modeToggle.checked = true;                     // Set toggle switch to checked position
}

// Listen for theme toggle changes
modeToggle.addEventListener("change", () => {
  document.body.classList.toggle("light", modeToggle.checked);  // Add/remove light theme class
  localStorage.setItem("shrtnr_theme", modeToggle.checked ? "light" : "dark");  // Save preference
});


// === FETCH URL ===
// API call to TinyURL service to create shortened link
async function fetchShortUrl(longUrl) {
  const response = await fetch("https://api.tinyurl.com/create", {
    method: "POST",                              // HTTP POST method to create resource
    headers: {
      "Authorization": `Bearer ${API_KEY}`,      // Authentication using API key
      "Content-Type": "application/json"         // Sending JSON data
    },
    body: JSON.stringify({ url: longUrl })       // Original URL wrapped in JSON
  });
  
  if (!response.ok) throw new Error(`API error: ${response.status}`);  // Handle HTTP errors
  
  const data = await response.json();            // Parse JSON response
  return data.data.tiny_url;                     // Extract and return shortened URL from response
}


// === SHORTEN ===
// Main function to handle URL shortening process
async function handleShorten(e) {
  e.preventDefault();                            // Prevent any default form submission behavior
  
  const rawUrl = urlInput.value.trim();          // Get input value and remove whitespace
  if (!rawUrl) return;                           // Exit if input is empty

  // Validate URL format by attempting to construct URL object
  try { new URL(rawUrl); } catch {
    showToast("⚠ Please enter a valid URL");     // Show error for invalid URL format
    urlInput.focus();                            // Return focus to input field
    return;
  }

  // Check if this exact URL has been shortened before (in history)
  const existing = history.find(h => h.original === rawUrl);
  if (existing) {
    setResult(existing.short);                   // Display existing shortened URL
    showToast("↩ Already shortened — showing cached result");
    return;                                      // Exit without making new API call
  }

  // Loading state: disable button and show spinner
  shortenBtn.classList.add("loading");
  shortenBtn.disabled = true;

  try {
    const shortUrl = await fetchShortUrl(rawUrl);  // Call API to shorten URL
    setResult(shortUrl);                           // Display result on page
    addToHistory(rawUrl, shortUrl);                // Save to history
    sessionCount++;                                // Increment session counter
    updateStats();                                 // Refresh statistics display
    showToast("✓ URL shortened!");                 // Success notification
  } catch (err) {
    showToast("✗ Failed — check your URL or try again");  // Error notification
    console.error(err);                            // Log error for debugging
  } finally {
    shortenBtn.classList.remove("loading");        // Remove loading state
    shortenBtn.disabled = false;                   // Re-enable button
  }
}

// Updates the UI with the shortened URL result
function setResult(shortUrl) {
  currentShortUrl = shortUrl;                      // Store for other functions
  resultText.textContent = shortUrl;               // Display URL in anchor tag
  resultText.href = shortUrl;                      // Make anchor clickable
  resultText.classList.remove("placeholder");      // Remove placeholder styling
  resultBox.classList.add("has-url");              // Add class to show result area
}


// === HISTORY ===
// Manages the list of previously shortened URLs

// Adds new shortened URL to history and saves to localStorage
function addToHistory(original, short) {
  const entry = { original, short, ts: Date.now() };  // Create entry with timestamp
  history.unshift(entry);                              // Add to beginning of array (newest first)
  
  if (history.length > 20) history.pop();              // Keep only latest 20 items (limit)
  
  localStorage.setItem("shrtnr_history", JSON.stringify(history));  // Persist to browser storage
  
  renderHistory();                                     // Refresh the displayed history list
}

// Renders all history items in the DOM
function renderHistory() {
  historyList.innerHTML = "";                          // Clear current list
  
  if (history.length === 0) {
    historyEmpty.style.display = "block";              // Show empty state message
    return;
  }
  historyEmpty.style.display = "none";                 // Hide empty state message

  // Loop through history array and create DOM elements
  history.forEach((item, i) => {
    const el = document.createElement("div");
    el.className = "history-item";
    el.style.animationDelay = `${i * 0.04}s`;          // Staggered animation for visual effect
    
    // Create HTML structure for each history item
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
    
    // Attach copy functionality to the copy button in each history item
    el.querySelector(".history-copy").addEventListener("click", function () {
      navigator.clipboard.writeText(this.dataset.url).then(() => showToast("✓ Copied!"));
    });
    
    historyList.appendChild(el);                       // Add item to DOM
  });
}

// Clear all history when button is clicked
clearHistBtn.addEventListener("click", () => {
  if (history.length === 0) return;                    // Do nothing if history already empty
  
  history = [];                                         // Empty the array
  localStorage.removeItem("shrtnr_history");           // Remove from storage
  renderHistory();                                      // Update display
  updateStats();                                        // Update statistics (counts will go to 0)
  showToast("History cleared");
});


// === COPY ===
// Copies the currently shortened URL to clipboard
copyBtn.addEventListener("click", () => {
  if (!currentShortUrl) {
    showToast("⚠ Shorten a URL first!");               // Error if no URL has been shortened
    return;
  }
  navigator.clipboard.writeText(currentShortUrl).then(() => {
    showToast("✓ Copied to clipboard!");               // Success notification
  });
});


// === OPEN ===
// Opens the shortened URL in a new browser tab
openBtn.addEventListener("click", () => {
  if (!currentShortUrl) {
    showToast("⚠ Nothing to open yet");                // Error if no URL available
    return;
  }
  window.open(currentShortUrl, "_blank");              // Open in new tab
});


// === CLEAR ===
// Resets input field and result display
clearBtn.addEventListener("click", () => {
  urlInput.value = "";                                 // Clear input text
  charCount.textContent = "0";                         // Reset character counter
  currentShortUrl = "";                                // Clear stored URL
  resultText.textContent = "—";                        // Reset to placeholder
  resultText.href = "#";                               // Remove clickable link
  resultText.classList.add("placeholder");             // Apply placeholder styling
  resultBox.classList.remove("has-url");               // Hide result area styling
  urlInput.focus();                                    // Focus cursor on input field
});


// === QR CODE ===
// Dynamically loads QR code library and generates QR code for shortened URL

// Loads QRCode.js library from CDN if not already loaded
function loadQrLib() {
  return new Promise((resolve, reject) => {
    if (window.QRCode) { resolve(); return; }          // Library already loaded
    
    const s = document.createElement("script");        // Create script element
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";  // CDN URL
    s.onload = resolve;                                 // Resolve promise when loaded
    s.onerror = reject;                                 // Reject if loading fails
    document.head.appendChild(s);                       // Add to document
  });
}

// Generate and display QR code modal
qrBtn.addEventListener("click", async () => {
  if (!currentShortUrl) {
    showToast("⚠ Shorten a URL first!");               // Error if no URL to encode
    return;
  }
  
  try {
    await loadQrLib();                                  // Ensure QR library is loaded
    qrContainer.innerHTML = "";                         // Clear previous QR code
    
    // Generate new QR code with custom settings
    new QRCode(qrContainer, {
      text: currentShortUrl,                            // URL to encode
      width: 220,                                       // Width in pixels
      height: 220,                                      // Height in pixels
      colorDark: "#0a0a12",                             // Dark color (matches dark theme)
      colorLight: "#ffffff",                            // Light background
      correctLevel: QRCode.CorrectLevel.H               // High error correction (more durable)
    });
    
    modalUrl.textContent = currentShortUrl;             // Display URL in modal
    qrModal.classList.add("show");                      // Show modal with animation
  } catch {
    showToast("✗ Could not load QR library");           // Error if library fails to load
  }
});

// Close modal when close button is clicked
modalClose.addEventListener("click", () => qrModal.classList.remove("show"));

// Close modal when clicking outside the modal content (on overlay)
qrModal.addEventListener("click", (e) => { 
  if (e.target === qrModal) qrModal.classList.remove("show"); 
});

// Download QR code as PNG image
downloadQr.addEventListener("click", () => {
  const canvas = qrContainer.querySelector("canvas");  // Find canvas element containing QR code
  if (!canvas) return;                                  // Exit if no QR code exists
  
  const link = document.createElement("a");             // Create temporary link
  link.download = "shrtnr-qr.png";                      // Set filename for download
  link.href = canvas.toDataURL();                       // Convert canvas to image data URL
  link.click();                                         // Trigger download
  showToast("✓ QR downloaded!");                        // Success notification
});


// === KEYBOARD SHORTCUT: Enter to shorten ===
// Allows users to press Enter key instead of clicking button
urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();                                 // Prevent any default Enter behavior
    handleShorten(e);                                   // Trigger shortening function
  }
});


// === FORM SUBMIT ===
// Connect shorten button click to handler function
// Using the shorten button directly (no form needed for event)
shortenBtn.addEventListener("click", handleShorten);


// === INIT ===
// Initialize the application on page load
resultText.classList.add("placeholder");   // Apply placeholder styling to empty result
renderHistory();                           // Display any existing history from localStorage
updateStats();                             // Calculate and display initial statistics