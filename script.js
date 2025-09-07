const backendURL = "https://speech-project-backend.onrender.com"; // your Render backend

const langInput = document.getElementById("lang");
const saveBtn = document.getElementById("saveLang");
const statusEl = document.getElementById("status");
const messagesEl = document.getElementById("messages");

// Load current language from backend
async function loadLanguage() {
  try {
    const res = await fetch(`${backendURL}/api/get-language`);
    const data = await res.json();
    langInput.value = data.targetLanguage || "";
    statusEl.textContent = `Current target language: ${data.targetLanguage}`;
    statusEl.style.color = "green";
  } catch (err) {
    statusEl.textContent = "Error loading current language";
    statusEl.style.color = "red";
  }
}

// Save new language
saveBtn.addEventListener("click", async () => {
  const lang = langInput.value.trim();
  if (!lang) {
    statusEl.textContent = "Please enter a language code (e.g., de, fr, es)";
    statusEl.style.color = "red";
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
    statusEl.style.color = "green";
  } catch (err) {
    statusEl.textContent = `Failed to save language: ${err.message}`;
    statusEl.style.color = "red";
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
  messagesEl.prepend(div); // newest on top
}

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
    setTimeout(startStream, 3000); // reconnect
  };
}

// Initialize
loadLanguage();
startStream();
