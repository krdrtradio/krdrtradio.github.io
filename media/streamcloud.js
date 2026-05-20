const API_URL = 'https://streamcloud.krdrtradio.workers.dev';

function forceDownload(url) {
   window.open(url, "_blank");
}

async function init() {

   const titleEl = document.getElementById('song-title');
   const audioEl = document.getElementById('audio-ctrl');
   const dlEl = document.getElementById('dl-link');
   const statusEl = document.getElementById('status');
   const loaderEl = document.getElementById('loader');

   const videoUrl =
      new URLSearchParams(window.location.search).get('url');

   try {

      statusEl.textContent = 'Łączenie z API...';

      const response = await fetch(
         `${API_URL}/?url=${encodeURIComponent(videoUrl)}`
      );

      if (!response.ok) {
         throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      console.log("FULL API RESPONSE:", data);

titleEl.textContent = data?.results?.[0]?.result?.title || "Brak tytułu";

const item = data?.results?.[0];

const media = item?.result?.medias?.[0];

const audioUrl = media?.url;
const title = item?.result?.title || "audio.mp3";
const ext = media?.extension || "mp3";

if (!audioUrl) {
   console.log(data);
   throw new Error("Brak URL audio");
}

audioEl.src = audioUrl;

dlEl.onclick = (e) => {
   e.preventDefault();

   if (!audioUrl) {
      console.error("Brak audioUrl");
      return;
   }

   const a = document.createElement("a");
   a.href = 'https://download.krdrtradio.workers.dev/download?url=' + encodeURIComponent(audioUrl);
   a.target = "_blank";   // ważne
   a.rel = "noopener";

   // nie zawsze działa, ale zostawiamy
   a.download = title || "audio.mp3";

   document.body.appendChild(a);
   a.click();
   a.remove();
};

      audioEl.addEventListener('canplay', () => {
         statusEl.textContent = 'Gotowe';
         loaderEl.style.display = 'none';
      });

      audioEl.addEventListener('error', () => {
         statusEl.textContent = 'Błąd audio';
      });

      try {
         await audioEl.play();
      } catch {
         console.warn('Autoplay blocked');
      }

   } catch (e) {
      console.error(e);
      loaderEl.style.display = 'none';
      titleEl.textContent = 'Błąd';
      statusEl.textContent = e.message;
   }
}

init();
