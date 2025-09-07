const backendURL = "https://speech-project-backend.onrender.com";
let espURL = localStorage.getItem("espURL") || "";
const backendStatus = document.getElementById("status");
const espStatus = document.getElementById("espStatus");
const espInput = document.getElementById("espInput");
const saveEspBtn = document.getElementById("saveEsp");
const triggerBtn = document.getElementById("triggerRecord");
const langInput = document.getElementById("lang");
const saveLangBtn = document.getElementById("saveLang");

// Detect if frontend is local
const isLocalFrontend =
  location.hostname === "localhost" ||
  location.hostname.startsWith("192.168.") ||
  location.protocol === "file:";

// ========== Backend check ==========
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
  } catch (_) {
    backendStatus.textContent = "Backend: ❌ not reachable";
    backendStatus.className = "error";
  }
}

// ========== ESP Handling ==========
function updateEspStatus(msg, ok = false) {
  espStatus.textContent = `ESP: ${ok ? "✅" : "❌"} ${msg}`;
  espStatus.className = ok ? "ok" : "error";
}

saveEspBtn.addEventListener("click", () => {
  espURL = espInput.value.trim();
  if (espURL) {
    localStorage.setItem("espURL", espURL);
    updateEspStatus("saved at " + espURL, true);
  }
});

triggerBtn.addEventListener("click", async () => {
  if (!espURL) {
    updateEspStatus("no IP set");
    return;
  }

  // Allow public URLs (ngrok) even if frontend is not local
  const isPublicESP = espURL.startsWith("http://") || espURL.startsWith("https://");

  if (!isLocalFrontend && !isPublicESP) {
    updateEspStatus(
      "unreachable from GitHub Pages. Please run locally or use a public URL."
    );
    return;
  }

  try {
    const res = await fetch(`${espURL}/record`, { method: "POST" });
    if (res.ok) {
      updateEspStatus("recording triggered", true);
    } else {
      updateEspStatus("trigger failed");
    }
  } catch (err) {
    updateEspStatus("not reachable");
  }
});

// ========== Language Handling ==========
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

// ========== Init ==========
checkBackend();
if (espURL) espInput.value = espURL;
if (!isLocalFrontend && !espURL.startsWith("http")) {
  updateEspStatus("⚠️ Only works from local network", false);
}
