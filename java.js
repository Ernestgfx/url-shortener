// ============================================================
// FILE: java.js
// PURPOSE: All interactivity and logic for the ERNEST URL Shortener app.
//
// DATA FLOW (step-by-step — how the app works from input to output):
//
//  1. USER types a long URL into the input field
//  2. USER submits the form (presses Enter or clicks "Shorten")
//  3. JS reads the typed value from the input element
//  4. JS sends that URL to the TinyURL API using fetch() (HTTP POST)
//  5. TinyURL processes the URL on their server and returns JSON
//  6. JS extracts the short URL from inside that JSON response
//  7. JS displays the short URL in the result box on the page
//  8. JS also adds the short URL to the history list section
//
// KEY CONCEPTS USED IN THIS FILE:
//  - DOM selection    → finding HTML elements by their id
//  - DOM manipulation → changing text, links, and styles on the page
//  - Event listeners  → detecting user actions (click, submit, change)
//  - fetch() API      → making HTTP network requests to external services
//  - Promises         → handling responses that arrive asynchronously (later)
//  - Arrays           → tracking URLs to detect duplicates
//  - Clipboard API    → copying text to the user's clipboard
// ============================================================


// ============================================================
// SECTION 1: DOM ELEMENT REFERENCES
//
// We use document.getElementById("id") to "grab" HTML elements
// from the page. Once grabbed, we store them in variables so we
// can read their values or update them throughout the code.
// ============================================================

// The <form> element — we listen for its "submit" event so the
// shortening process starts when the user presses Enter
let form = document.getElementById("form")

// The URL text input field — we read .value from this to get
// whatever long URL the user has typed
let getUrl = document.getElementById("get-url-input")

// The "Shorten →" button — used as a click target reference
let getUrlBtn = document.getElementById("shorten-btn")

// The "Clear" button — clicking this resets the input and result
let clearBtn = document.getElementById("clear-btn")

// The <a> tag inside the result box — we update its .textContent
// to display the shortened URL returned by the API
let showsUrl = document.getElementById("result-text")

// The "Copy" button in the result box — we attach a click listener to it
let copyUrlBtn = document.getElementById("copy-btn")

// The <div> container that holds all history entries — new entries
// are inserted inside this element by showHistory()
let showUrlHistory = document.getElementById("history-list")

// The dark/light mode toggle checkbox — we listen for its "change"
// event to detect when the user switches themes
let toggleMode = document.getElementById("mode")

// The main section element — its background, text color, and border
// are updated directly via JavaScript when the theme changes
let section = document.getElementById("section")

// The <body> element — CSS class names ("dark-mode" / "light-mode")
// are added and removed from this to trigger theme styles in CSS
let body = document.getElementById("body")

// A new <div> element created in memory (not yet added to the page).
// Acts as the reusable wrapper that contains each history entry link.
let createHistoryList = document.createElement("div")


// ============================================================
// SECTION 2: APPLICATION STATE
//
// These variables live outside all functions (global scope),
// so every function in this file can read and update them.
// ============================================================

// Tracks every short URL generated this session.
// Used by showHistory() to detect and handle duplicate entries.
let url_array = []

// The TinyURL API Bearer token — our authentication key.
// Every fetch() request to TinyURL must include this in the
// Authorization header so their server accepts our requests.
let api = "uBgmdCNHmGnuK3gZabDrG02TXoCGGDlpWIfnsdL2jOB61sHGu6F2hTAkLunH"


// ============================================================
// SECTION 3: FUNCTIONS
// ============================================================

// ------------------------------------------------------------
// FUNCTION: showHistory(url)
//
// PURPOSE: Creates a clickable link for the shortened URL and
//          appends it to the history list section on the page.
//
// STEPS:
//  1. A new <a> element is created in memory
//  2. url_array.includes() checks if this URL was already added
//  3. Duplicate → shows "Url already exist" text, no link href
//     New URL   → sets the text and href to the short URL
//  4. target="_blank" makes the link open in a new tab
//  5. The <a> is nested inside the createHistoryList <div>
//  6. The <div> is inserted at the end of the history container
//
// PARAMETER: url — the shortened URL string to display
// ------------------------------------------------------------
let showHistory = (url) => {

    // Create a new anchor element — this will be the clickable history entry
    let createElementA = document.createElement("a")
    
    // Check if this URL is already in our tracking array (a duplicate)
    // .includes() scans the array and returns true if the value is found
    if(url_array.includes(url)) {
        // Duplicate: show a plain-text warning instead of a working link
        createElementA.textContent = `Url already exist`
        // href is set to null so it's not a navigable link
        createElementA.href = null
    } else {
        // New URL: display the full short URL as the visible link text
        createElementA.textContent = `${url}`
        // href makes the link navigate to the short URL when clicked
        createElementA.href = url
    }
    // Open the link in a new browser tab so the app stays open
    createElementA.target = "_blank"

    // Apply the "history-list" CSS class to the wrapper <div>
    // so it gets the correct visual styling from style.css
    createHistoryList.classList.add("history-list")

    // Place the newly created link inside the wrapper div
    createHistoryList.appendChild(createElementA)

    // Insert the wrapper (containing the link) at the END of the
    // history container div. "beforeend" = last child position.
    showUrlHistory.insertAdjacentElement("beforeend", createHistoryList)

}

// ------------------------------------------------------------
// FUNCTION: showUrl(shortUrl)
//
// PURPOSE: After the API returns a short URL, this function
//          updates the page to show it to the user.
//
// It handles two tasks:
//  1. Calls showHistory() to add the URL to the history list
//  2. Updates the result box text so the user can see the short URL
//
// PARAMETER: shortUrl — the shortened URL string from the API
// ------------------------------------------------------------
let showUrl = (shortUrl) => {

    // Add this short URL to the visible history section
    showHistory(shortUrl)

    // Store it in url_array so future duplicate checks work correctly
    url_array.push(shortUrl)

    // Update the result box: set the text of the <a id="result-text"> element
    // .textContent changes the visible text inside the element
    showsUrl.textContent = `${shortUrl}`
}

// ------------------------------------------------------------
// FUNCTION: fetchUrl(userUrl)
//
// PURPOSE: Contacts the TinyURL API with the user's long URL
//          and retrieves a shortened URL back.
//
// HOW fetch() WORKS:
//  - fetch() sends an HTTP request to the TinyURL server
//  - method: "POST" — we are SENDING data (the long URL) to the server
//  - headers — tell the server: our API key, and that our data is JSON
//  - body — the actual data we send: the long URL as a JSON string
//
// ASYNCHRONOUS BEHAVIOUR (why we use .then()):
//  - fetch() doesn't pause to wait for the response
//  - Instead it returns a Promise (a "will be resolved later" object)
//  - .then(fn) runs fn only AFTER the server responds successfully
//  - .catch(fn) runs fn if anything goes wrong at any point
//
// PARAMETER: userUrl — the original long URL string from the input
// ------------------------------------------------------------
let fetchUrl = (userUrl) => {

    // Send an HTTP POST request to the TinyURL API
    fetch(`https://api.tinyurl.com/create`, {
        method: "POST",   // POST means we are sending data to the server

        headers: {
            // Proves our identity to TinyURL's server using our API key.
            // "Bearer" is the token authentication scheme.
            // Without this header the server returns a 401 Unauthorized error.
            "Authorization": `Bearer ${api}`,

            // Tells the server the request body is formatted as JSON
            "Content-Type": "application/json"
        },

        // The request body: the long URL we want shortened.
        // JSON.stringify() converts the JS object { url: "..." }
        // into the string '{"url":"https://..."}' — required because
        // HTTP bodies must be plain strings, not JavaScript objects.
        body: JSON.stringify({
            url: `${userUrl}`
        })
    })

    // First .then() — fires when the server sends back a raw HTTP response.
    // We have the status code but the body data isn't parsed yet.
    .then((response) => {
        // response.ok is true for HTTP status codes 200–299 (success).
        // If the API key is invalid, rate-limited, or the URL is bad,
        // response.ok will be false — we throw to jump straight to .catch()
        if(!response.ok) {
            throw new Error("api limit is full")
        }
        // response.json() reads and parses the response body from a raw JSON
        // string into a usable JavaScript object.
        // It's also async, so we return it — the next .then() gets the result.
        return response.json()
    })

    // Second .then() — fires after JSON parsing completes.
    // "data" is a full JS object containing TinyURL's response fields.
    .then((data) => {
        // Print the short URL to the browser console (useful for debugging)
        console.log(data.data.tiny_url);

        // TinyURL's API returns JSON shaped like:
        // { "data": { "tiny_url": "https://tinyurl.com/xxxxx" } }
        // So we dig into data.data.tiny_url to get the short URL string.
        // We pass it to showUrl() which updates the result box and history.
        showUrl(data.data.tiny_url)
    })

    // .catch() — runs if any error is thrown anywhere in the chain above.
    // Covers: no internet, invalid API key, quota exceeded, bad URL, etc.
    .catch((error) => {
        // Display a user-facing error message in the result box
        showsUrl.textContent = "Please enter a valid url"

        // Re-throw the error so it also appears in the browser console
        // with a descriptive message — useful for developers debugging
        throw new Error("Failed to fetch data", error)
    })
}


// ============================================================
// SECTION 4: EVENT LISTENERS
//
// Event listeners wait for a specific user action on an element.
// When the action happens, the callback function inside runs.
//
// Format: element.addEventListener("eventType", (e) => { ... })
//
// "e" is the Event object — it contains details about what happened
// (which element, what value, whether a key was pressed, etc.)
// e.preventDefault() stops the browser's default action for that event.
// ============================================================


// ------------------------------------------------------------
// FORM SUBMIT — listens for the "submit" event on the form.
// Fires when the user presses Enter in the input field,
// or clicks a submit-type button inside the form.
// ------------------------------------------------------------
form.addEventListener("submit", (e) => {
    // Stop the browser from reloading the page (default form behaviour)
    e.preventDefault()

    // Read the current text value from the URL input field
    let convertUrl = getUrl.value

    // Send the URL to the TinyURL API.
    // This starts the full data flow:
    // fetchUrl() → fetch() → API response → .then() → showUrl() → page update
    fetchUrl(convertUrl)
})


// ------------------------------------------------------------
// COPY BUTTON CLICK — listens for a "click" on the Copy button.
// Copies the current shortened URL to the user's clipboard.
// ------------------------------------------------------------
copyUrlBtn.addEventListener("click", (e) => {
    e.preventDefault()

    // Check whether a real short URL has been generated yet.
    // If the result box still shows the default placeholder text,
    // there is nothing meaningful to copy.
    if(showsUrl.textContent === "Your shortened URL will appear here") {
        // No URL yet — update the button text to warn the user
        copyUrlBtn.textContent = "Generate url first"
        // Expand the button width so the longer warning message fits inside
        copyUrlBtn.style.width = "100%"
    } else {
        // A valid short URL exists — confirm the copy was successful
        copyUrlBtn.textContent = "Copied"
    }
    
    // setTimeout(callback, delay) runs the callback ONCE after the delay.
    // 2000 milliseconds = 2 seconds.
    // After 2 seconds, the button resets back to its original "Copy" state.
    // This gives the user brief visual confirmation before it reverts.
    setTimeout(() => {
        copyUrlBtn.textContent = "Copy"
        // Reset the button width back to its original size
        copyUrlBtn.style.width = "65%"
    }, 2000)

    // navigator.clipboard.writeText() is the browser's built-in Clipboard API.
    // It programmatically copies the given text — the same as pressing Ctrl+C.
    // The user can then paste it anywhere (address bar, email, chat, etc.)
    navigator.clipboard.writeText(showsUrl.textContent)
})


// ------------------------------------------------------------
// CLEAR BUTTON CLICK — listens for a "click" on the Clear button.
// Resets the input field and the result display to their defaults.
// ------------------------------------------------------------
clearBtn.addEventListener("click", (e) => {
    e.preventDefault()

    // Wipe the text inside the input field (empty string = blank)
    getUrl.value = ""

    // Reset the result box back to its original placeholder text
    showsUrl.textContent = "Your shortened URL will appear here"

})


// ------------------------------------------------------------
// THEME TOGGLE CHANGE — listens for a "change" on the checkbox.
// Fires whenever the dark/light mode switch is flipped.
//
// e.target is the checkbox element that changed.
// e.target.checked is true when the checkbox is ON (ticked),
// and false when it is OFF (unticked).
//
// The theme is applied two ways:
//  1. CSS classes on <body> ("dark-mode" / "light-mode")
//  2. Inline style overrides directly on the <section> element
// ------------------------------------------------------------
toggleMode.addEventListener("change", (e) => {
    e.preventDefault()

    if(e.target.checked) {
        // Toggle switched ON → apply DARK MODE
        // Add "dark-mode" to body so dark-mode CSS rules take effect
        body.classList.add("dark-mode")
        // Remove "light-mode" so its CSS rules no longer apply
        body.classList.remove("light-mode")
        // Set section background to black directly via inline style
        section.style.backgroundColor = "black"
        // White text is readable on a black background
        section.style.color = "white"
        // White border to suit the dark theme
        section.style.border = "3px solid white"
    } else {
        // Toggle switched OFF → apply LIGHT MODE
        // Add "light-mode" to body so light-mode CSS rules take effect
        body.classList.add("light-mode")
        // Remove "dark-mode" so its CSS rules no longer apply
        body.classList.remove("dark-mode")
        // Set section background to white directly via inline style
        section.style.backgroundColor = "white"
        // Black text is readable on a white background
        section.style.color = "black"
        // Black border to suit the light theme
        section.style.border = "3px solid black"
    }

})


// ============================================================
// COMMENTED-OUT DUPLICATE LISTENER
//
// The block below is an identical copy of the toggleMode listener
// above. It was commented out in the original code — likely left
// over from an earlier development stage.
// Because it is commented out, it does NOT run and has no effect.
// If it were uncommented, having two identical listeners on the same
// element would cause the toggle function to execute twice per flip.
// ============================================================

// toggleMode.addEventListener("change", (e) => {
//     e.preventDefault()

//     if(e.target.checked) {
//         body.classList.add("dark-mode")
//         body.classList.remove("light-mode")
//         section.style.backgroundColor = "black"
//         section.style.color = "white"
//         section.style.border = "3px solid white"
//     } else {
//         body.classList.add("light-mode")
//         body.classList.remove("dark-mode")
//         section.style.backgroundColor = "white"
//         section.style.color = "black"
//         section.style.border = "3px solid black"
//     }

// })