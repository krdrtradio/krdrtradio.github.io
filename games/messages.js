/* =========================================================
   GLOBALS
========================================================= */

const queue = [];
let running = false;
let paused = false;
let history = [];

/* =========================================================
   HELPERS
========================================================= */

const sleep = ms =>
   new Promise(res => setTimeout(res, ms));

/* =========================================================
   LANGUAGE SYSTEM
========================================================= */

const translations = {
   en: {
      title: "Notification System",
      send: "Send",
      pause: "Pause",
      resume: "Resume",
      toggle: "Show / Hide History",
      clear: "Clear History",
      immediate: "Immediate",
      urgent: "Urgent",
      placeholder: "Write messages here..."
   },
   pl: {
      title: "System Powiadomień",
      send: "Wyślij",
      pause: "Pauza",
      resume: "Wznów",
      toggle: "Pokaż / Ukryj Historię",
      clear: "Wyczyść Historię",
      immediate: "Natychmiast",
      urgent: "Pilne",
      placeholder: "Wpisz wiadomości tutaj..."
   }
};

/* =========================================================
   SET LANGUAGE
========================================================= */

function setLanguage() {
   const lang = document.getElementById("languageSelect").value;
   const t = translations[lang];
   document.getElementById("title").innerText = t.title;
   document.getElementById("sendBtn").innerText = t.send;
   document.getElementById("pauseBtn").innerText = t.pause;
   document.getElementById("resumeBtn").innerText = t.resume;
   document.getElementById("toggleBtn").innerText = t.toggle;
   document.getElementById("clearBtn").innerText = t.clear;
   document.getElementById("immediateLabel").innerText = t.immediate;
   document.getElementById("urgentLabel").innerText = t.urgent;
   document.getElementById("messageText").placeholder = t.placeholder;
}

/* =========================================================
   THEME
========================================================= */

function toggleTheme() {
   document.body.classList.toggle("dark");
}

/* =========================================================
   HISTORY
========================================================= */

function addHistory(msg) {
   history.push(msg);
   document.getElementById("history").innerHTML = history.map(m => "🧾 " + m).join("<br>");
}

function clearHistory() {
   history = [];
   document.getElementById("history").innerHTML = "";
}

function toggleHistory() {
   document.getElementById("history").classList.toggle("hidden");
}

/* =========================================================
   SHOW MESSAGE
========================================================= */

function showMessage(msg) {
   const wrapper = document.getElementById("notify-wrapper");
   const box = document.createElement("div");
   box.className = "message-box animate__animated animate__bounceInDown";
   box.innerText = msg;
   wrapper.appendChild(box);
   // OUT ANIMATION
   setTimeout(() => {
      box.classList.remove("animate__bounceInDown");
      box.classList.add("animate__bounceOutUp");
      box.addEventListener("animationend", () => {
         box.remove();
      }, {
         once: true
      });
   }, 2000);
   addHistory(msg);
}

/* =========================================================
   PROCESS QUEUE
========================================================= */

async function processQueue() {
   if (running) return;
   running = true;
   try {
      while (queue.length > 0) {
         // PAUSE
         if (paused) {
            await sleep(300);
            continue;
         }
         const msg =
            queue.shift();
         showMessage(msg);
         await sleep(2500);
      }
   } finally {
      running = false;
   }
}

/* =========================================================
   SEND MESSAGE
========================================================= */

function SendMessage() {
   const text = document.getElementById("messageText").value;
   if (!text.trim()) return;
   const immediate = document.getElementById("SendMessageImmediate").checked;
   const urgent = document.getElementById("urgentMode").checked;
   const lines = text.split("\n").filter(l => l.trim() !== "");

   /* =====================================================
      IMMEDIATE MODE
   ===================================================== */

   if (immediate) {
      document.getElementById("notify-wrapper").innerHTML = "";
      queue.length = 0;
      lines.forEach(line => {
         showMessage(urgent ? "🔴 " + line : line);
      });
      return;
   }

   /* =====================================================
      URGENT
   ===================================================== */

   if (urgent) {
      [...lines]
      .reverse()
         .forEach(line => {
            queue.unshift("🔴 " + line);
         });
   }

   /* =====================================================
      NORMAL
   ===================================================== */
   else {
      lines.forEach(line => {
         queue.push(line);
      });
   }
   processQueue();
}

/* =========================================================
   PAUSE / RESUME
========================================================= */

function pauseQueue() {
   paused = true;
}

function resumeQueue() {
   paused = false;
}

/* =========================================================
   DEFAULT LANGUAGE
========================================================= */
setLanguage();
