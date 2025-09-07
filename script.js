const backendURL = "https://speech-project-backend.onrender.com";
let espURL = localStorage.getItem("espURL") || "";
const backendStatus = document.getElementById("status");
const espStatus = document.getElementById("espStatus");
const espInput = document.getElementById("espInput");
const saveEspBtn = document.getElementById("saveEsp");
const triggerBtn = document.getElementById("triggerRecord");
const langInput = document.getElementById("lang");
const saveLangBtn = document.getElementById("saveLang");
const messagesDiv = document.getElementById("messages");

// Check if frontend is local
const isLocalFrontend =
  location.hostname === "localhost" ||
  location.hostname.startsWith("192.168.") ||
  location.protocol === "file:";

// -------------------- Helpers --------------------
function updateEspStatus(msg, ok = false) {
  espStatus.textContent = `ESP: ${ok ? "✅" : "❌"} ${msg}`;
  espStatus.className = ok ? "ok" : "error";
}

// Initialize SSE stream from backend
function initStream() {
  const evtSource = new EventSource(`${backendURL}/api/stream`);
  evtSource.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    const el = document.createElement("div");
    el.textContent = `Original: ${msg.original} | Translated (${msg.targetLanguage}): ${msg.translated}`;
    messagesDiv.appendChild(el);
  };
}

// -------------------- ESP Handling --------------------
async function testESP(url) {
  try {
    const res = await fetch(`${url}/record`, { method: "POST" });
    if (res.ok) updateEspStatus("reachable and ready", true);
    else updateEspStatus("reachable but trigger failed");
  } catch (err) {
    updateEspStatus("not reachable");
  }
}

saveEspBtn.addEventListener("click", async () => {
  espURL = espInput.value.trim();
  if (!espURL) return;

  localStorage.setItem("espURL", espURL);
  updateEspStatus("saved, testing...", false);

  const isPublicESP = espURL.startsWith("http://") || espURL.startsWith("https://");
  if (!isLocalFrontend && !isPublicESP) {
    updateEspStatus("unreachable from GitHub Pages. Use public URL.", false);
    return;
  }

  await testESP(espURL);
});

// -------------------- Trigger Recording --------------------
triggerBtn.addEventListener("click", async () => {
  if (!espURL) {
    updateEspStatus("no ESP IP set");
    return;
  }

  try {
    // Trigger ESP to start recording
    const res = await fetch(`${espURL}/record`, { method: "POST" });
    if (res.ok) {
      updateEspStatus("ESP triggered", true);

      // -------------------- Upload audio to backend --------------------
      // Here we simulate real audio capture from ESP.
      // Ideally, the ESP should POST actual recorded audio to backend
      const formData = new FormData();
      const blob = new Blob(["dummy audio content"], { type: "audio/wav" });
      formData.append("file", blob, "audio.wav");
      formData.append("lang", langInput.value || "en");

      try {
        const r = await fetch(`${backendURL}/api/transcribe`, {
          method: "POST",
          body: formData,
        });
        const data = await r.json();
        console.log("Backend response:", data);
      } catch (err) {
        console.error("Backend transcription error:", err);
      }

    } else {
      updateEspStatus("ESP trigger failed");
    }
  } catch (err) {
    updateEspStatus("ESP not reachable");
  }
});

// -------------------- Language Handling --------------------
saveLangBtn.addEventListener("click", async () => {
  const lang = langInput.value.trim();
  if (!lang) return;

  try {
    const res = await fetch(`${backendURL}/api/set-language`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang }),
    });
    if (res.ok) {
      const data = await res.json();
      backendStatus.textContent = `Saved! Target language is now: ${data.targetLanguage}`;
      backendStatus.className = "ok";
    } else {
      backendStatus.textContent = `Failed to save language: ${res.status}`;
      backendStatus.className = "error";
    }
  } catch (err) {
    backendStatus.textContent = `Failed to save language: ${err.message}`;
    backendStatus.className = "error";
  }
});

// -------------------- Initialize --------------------
if (espURL) espInput.value = espURL;
initStream();
