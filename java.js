// ── Element references ──────────────────────────────────────
let form = document.getElementById("form")
let getUrl = document.getElementById("get-url-input")
let getUrlBtn = document.getElementById("shorten-btn")
let clearBtn = document.getElementById("clear-btn")
let showsUrl = document.getElementById("result-text")
let copyUrlBtn = document.getElementById("copy-btn")
let showUrlHistory = document.getElementById("history-list")
let toggleMode = document.getElementById("mode")
let section = document.getElementById("section")
let body = document.getElementById("body")
let createHistoryList = document.createElement("div")

// FIX 6: grab char counter + stats elements that were never connected to JS
let charCount = document.getElementById("char-count")
let statCount = document.getElementById("stat-count")
let statSaved = document.getElementById("stat-saved")
let statSession = document.getElementById("stat-session")

// FIX 1/3/4: grab QR modal elements that had no listeners
let qrBtn = document.getElementById("qr-btn")
let qrModal = document.getElementById("qr-modal")
let modalClose = document.getElementById("modal-close")
let modalUrl = document.getElementById("modal-url")
let qrContainer = document.getElementById("qr-container")
let downloadQrBtn = document.getElementById("download-qr")

// FIX 2: grab the Open button that had no listener
let openBtn = document.getElementById("open-btn")

// FIX 5: grab Clear History button that had no listener
let clearHistoryBtn = document.getElementById("clear-history-btn")

// FIX 7: grab the history empty message so we can show/hide it
let historyEmpty = document.getElementById("history-empty")

let url_array = []
let api = "uBgmdCNHmGnuK3gZabDrG02TXoCGGDlpWIfnsdL2jOB61sHGu6F2hTAkLunH"

// FIX 7: counters for the stats bar
let sessionCount = 0
let totalCount = 0
let totalSaved = 0

let showHistory = (url) => {

    let createElementA = document.createElement("a")
    
    if(url_array.includes(url)) {
        createElementA.textContent = `Url already exist`
        createElementA.href = null
    } else {
        createElementA.textContent = `${url}`
        createElementA.href = url
    }
    createElementA.target = "_blank"

    createHistoryList.classList.add("history-list")
    createHistoryList.appendChild(createElementA)
    showUrlHistory.insertAdjacentElement("beforeend", createHistoryList)

    // FIX 7: hide the "no links yet" empty state message
    historyEmpty.style.display = "none"
}

let showUrl = (shortUrl, originalUrl) => {

    showHistory(shortUrl)
    url_array.push(shortUrl)
    showsUrl.textContent = `${shortUrl}`

    // FIX 8: set href so the result link actually navigates when clicked
    showsUrl.href = shortUrl

    // FIX 7: update all three stats counters
    sessionCount++
    totalCount++
    totalSaved += (originalUrl.length - shortUrl.length)
    statSession.textContent = sessionCount
    statCount.textContent = totalCount
    statSaved.textContent = totalSaved > 0 ? totalSaved : 0
}

let fetchUrl = (userUrl) => {

    fetch(`https://api.tinyurl.com/create`, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${api}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            url: `${userUrl}`
        })
    })
    .then((response) => {
        if(!response.ok) {
            throw new Error("api limit is full")
        }
        return response.json()
    })
    .then((data) => {
        console.log(data.data.tiny_url);
        // FIX 7: pass userUrl so chars-saved can be calculated
        showUrl(data.data.tiny_url, userUrl)
    })
    .catch((error) => {
        showsUrl.textContent = "Please enter a valid url"
        throw new Error("Failed to fetch data", error)
    })
}

getUrlBtn.addEventListener("click", (e) => {
    e.preventDefault()

    let convertUrl = getUrl.value

    fetchUrl(convertUrl)
})

copyUrlBtn.addEventListener("click", (e) => {
    e.preventDefault()

    // FIX 9: the real HTML default is "—", not "Your shortened URL will appear here"
    if(showsUrl.textContent === "—" || showsUrl.textContent === "Please enter a valid url") {
        copyUrlBtn.textContent = "Generate url first"
        copyUrlBtn.style.width = "100%"
    } else {
        copyUrlBtn.textContent = "Copied"
    }
    
    
    setTimeout(() => {
        copyUrlBtn.textContent = "Copy"
        copyUrlBtn.style.width = "65%"
    }, 2000)

    navigator.clipboard.writeText(showsUrl.textContent)
})

clearBtn.addEventListener("click", (e) => {
    e.preventDefault()

    getUrl.value = ""
    // FIX 9: reset to "—" to match the actual HTML default, and clear the href
    showsUrl.textContent = "—"
    showsUrl.href = "#"

})

// FIX 10: body/section had no IDs in the HTML so getElementById returned null
// Use document.body directly instead
toggleMode.addEventListener("change", (e) => {
    e.preventDefault()

    if(e.target.checked) {
        document.body.classList.add("dark-mode")
        document.body.classList.remove("light-mode")
    } else {
        document.body.classList.add("light-mode")
        document.body.classList.remove("dark-mode")
    }

})

// FIX 6: live character counter — updates the char count on every keystroke
getUrl.addEventListener("input", () => {
    charCount.textContent = getUrl.value.length
})

// FIX 1: QR button — generate and show the QR code modal
qrBtn.addEventListener("click", (e) => {
    e.preventDefault()

    const url = showsUrl.textContent

    if(url === "—" || url === "Please enter a valid url") return

    // Clear any previous QR code before generating a new one
    qrContainer.innerHTML = ""

    // Generate QR code using the qrcode.js library (added to index.html)
    new QRCode(qrContainer, {
        text: url,
        width: 200,
        height: 200
    })

    modalUrl.textContent = url
    qrModal.classList.add("show")
})

// FIX 4: close button hides the modal
modalClose.addEventListener("click", () => {
    qrModal.classList.remove("show")
})

// Also close when clicking the dark backdrop outside the modal box
qrModal.addEventListener("click", (e) => {
    if(e.target === qrModal) {
        qrModal.classList.remove("show")
    }
})

// FIX 3: download button — saves the QR canvas as a PNG file
downloadQrBtn.addEventListener("click", () => {
    const canvas = qrContainer.querySelector("canvas")
    if(!canvas) return

    const link = document.createElement("a")
    link.download = "qrcode.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
})

// FIX 2: open button — opens the shortened URL in a new tab
openBtn.addEventListener("click", (e) => {
    e.preventDefault()

    const url = showsUrl.textContent

    if(url === "—" || url === "Please enter a valid url") return

    window.open(url, "_blank")
})

// FIX 5: clear history — wipes list, resets duplicate tracker and all stats
clearHistoryBtn.addEventListener("click", (e) => {
    e.preventDefault()

    showUrlHistory.innerHTML = ""
    url_array = []
    createHistoryList = document.createElement("div")
    historyEmpty.style.display = ""
    sessionCount = 0
    totalCount = 0
    totalSaved = 0
    statCount.textContent = 0
    statSaved.textContent = 0
    statSession.textContent = 0
})


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