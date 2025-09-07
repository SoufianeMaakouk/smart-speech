const backendURL = "https://speech-project-backend.onrender.com"; // your backend
let espURL = localStorage.getItem("espURL") || "";
const backendStatus = document.getElementById("status");
const espStatus = document.getElementById("espStatus");
const espInput = document.getElementById("espInput");
const saveEspBtn = document.getElementById("saveEsp");
const triggerBtn = document.getElementById("triggerRecord");

// Detect if frontend is running locally or on GitHub Pages
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

  // Allow ngrok/public URLs even if not local
const isPublicESP = espURL.startsWith("http://") || espURL.startsWith("https://");

if (!isLocalFrontend && !isPublicESP) {
  updateEspStatus("ESP unreachable from GitHub Pages. Please run locally or use a public URL.");
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

// ========== Init ==========
checkBackend();
if (espURL) espInput.value = espURL;
if (!isLocalFrontend) {
  updateEspStatus("⚠️ Only works from local network", false);
}
