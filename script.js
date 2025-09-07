const backendURL = "https://speech-project-backend.onrender.com"; // Render backend

const langInput = document.getElementById("lang");
const saveBtn = document.getElementById("saveLang");
const statusEl = document.getElementById("status");
const messagesEl = document.getElementById("messages");

const backendStatus = document.getElementById("backendStatus");
const espStatus = document.getElementById("espStatus");
const espIPInput = document.getElementById("espIP");
const saveESPBtn = document.getElementById("saveESP");
const triggerBtn = document.getElementById("triggerRecord");

let espURL = null;

// Check backend connectivity
async function checkBackend() {
  try {
    const res = await fetch(`${backendURL}/`);
    if (res.ok) {
      backendStatus.textContent = "Backend: ✅ connected";
      backendStatus.className = "ok";
    } else {
      backendStatus.textContent = "Backend: ❌ error";
      backendStatus.className = "error";
    }
  } catch (err) {
    backendStatus.textContent = "Backend: ❌ not reachable";
    backendStatus.className = "error";
  }
}

// Load current target language
async function loadLanguage() {
  try {
    const res = await fetch(`${backendURL}/api/get-language`);
    const data = await res.json();
    langInput.value = data.targetLanguage || "";
    statusEl.textContent = `Current target language: ${data.targetLanguage}`;
    statusEl.className = "ok";
  } catch (err) {
    statusEl.textContent = "Error loading current language";
    statusEl.className = "error";
  }
}

// Save target language
saveBtn.addEventListener("click", async () => {
  const lang = langInput.value.trim();
  if (!lang) {
    statusEl.textContent = "Please enter a language code (e.g., de, fr, es)";
    statusEl.className = "error";
    return;
  }

  try {
    const res = await fetch(`${backendURL}/api/set-language`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    statusEl.textContent = `Saved! Target language is now: ${data.targetLanguage}`;
    statusEl.className = "ok";
  } catch (err) {
    statusEl.textContent = `Failed to save language: ${err.message}`;
    statusEl.className = "error";
  }
});

// ESP IP saving
saveESPBtn.addEventListener("click", () => {
  const ip = espIPInput.value.trim();
  if (!ip.startsWith("http")) {
    espStatus.textContent = "ESP: ❌ invalid IP";
    espStatus.className = "error";
    return;
  }
  espURL = ip;
  espStatus.textContent = `ESP: set to ${espURL}`;
  espStatus.className = "ok";
});

// Trigger ESP recording
triggerBtn.addEventListener("click", async () => {
  if (!espURL) {
    espStatus.textContent = "ESP: ❌ no IP set";
    espStatus.className = "error";
    return;
  }
  try {
    const res = await fetch(`${espURL}/record`, { method: "POST" });
    if (res.ok) {
      espStatus.textContent = "ESP: ✅ recording triggered";
      espStatus.className = "ok";
    } else {
      espStatus.textContent = "ESP: ❌ trigger failed";
      espStatus.className = "error";
    }
  } catch (err) {
    espStatus.textContent = "ESP: ❌ not reachable";
    espStatus.className = "error";
  }
});

// Show translated messages from backend
function addMessage(msg) {
  const div = document.createElement("div");
  div.className = "message";
  div.innerHTML = `
    <p><strong>Original:</strong> ${msg.original || "(empty)"}</p>
    <p><strong>Translated (${msg.targetLanguage}):</strong> ${msg.translated || "(empty)"}</p>
    <hr/>
  `;
  messagesEl.prepend(div);
}

// Stream updates from backend
function startStream() {
  const evtSource = new EventSource(`${backendURL}/api/stream`);
  evtSource.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      addMessage(msg);
    } catch (e) {
      console.error("Bad SSE message", e);
    }
  };
  evtSource.onerror = () => {
    console.error("SSE connection lost, retrying...");
    setTimeout(startStream, 3000);
  };
}

// Init
checkBackend();
loadLanguage();
startStream();
