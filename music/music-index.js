// --- KONFIGURACJA I ZMIENNE ---
// --- KONFIGURACJA I ZMIENNE ---
let currentOffset = 0;
let currentTerm = "";
const limit = 5;
const AUD = new Audio();

const params = new URLSearchParams(window.location.search);
const searchURL = params.get('s');

const inputKeywords = document.getElementById("input-keywords");
const submitButton = document.getElementById("submit");
const musicContainer = document.querySelector(".hits_list");

// Tworzymy przycisk "Pokaż więcej"
const loadMoreBtn = document.createElement("button");
loadMoreBtn.innerText = "Pokaż więcej wyników";
loadMoreBtn.id = "load-more";
loadMoreBtn.style.display = "none";
loadMoreBtn.style.margin = "20px auto";
musicContainer.after(loadMoreBtn);

// --- 1. OBSŁUGA WYSZUKIWANIA ---

function startSearch() {
   const query = inputKeywords.value.trim();
   const termToSearch = query || searchURL;

   if (termToSearch) {
      currentTerm = termToSearch;
      currentOffset = 0;
      musicContainer.innerHTML = "";
      getSongData(currentTerm, currentOffset);
   } else {
      alert("Wpisz coś w pole wyszukiwania!");
   }
}

submitButton.addEventListener("click", startSearch);

inputKeywords.addEventListener("keydown", (event) => {
   if (event.key === "Enter") {
      event.preventDefault();
      startSearch();
   }
});

// Autostart jeśli URL zawiera parametr ?s=...
if (searchURL) {
   inputKeywords.value = searchURL;
   startSearch();
}

// --- 2. OBSŁUGA "POKAŻ WIĘCEJ" ---
loadMoreBtn.addEventListener("click", () => {
   currentOffset += limit;
   getSongData(currentTerm, currentOffset);
});

async function getSongData(searchTerm, offset) {
   loadMoreBtn.disabled = true;
   loadMoreBtn.style.display = "block";
   loadMoreBtn.innerText = "Ładowanie...";

   const url = `https://shazam.p.rapidapi.com/v2/search?term=${encodeURIComponent(searchTerm)}&locale=pl-PL&offset=${offset}&limit=${limit}`;

   const options = {
      method: "GET",
      headers: {
         "X-RapidAPI-Key": "ea4a4a09c7msh91f54f4cc2e9531p160042jsn3a91d4fdbb5e",
         "X-RapidAPI-Host": "shazam.p.rapidapi.com"
      }
   };

   try {
      const response = await fetch(url, options);
      const data = await response.json();
      const songs = data.results?.songs?.data || [];

      if (songs.length > 0) {
         appendSongsToDisplay(songs);
         loadMoreBtn.style.display = "block";
         loadMoreBtn.disabled = false;
         loadMoreBtn.innerText = "Pokaż więcej wyników";
      } else {
         if (offset === 0) {
            musicContainer.innerHTML = `<p>Brak wyników dla: <b>${searchTerm}</b></p>`;
         }
         loadMoreBtn.style.display = "none";
      }
   } catch (error) {
      console.error("Błąd API:", error);
      loadMoreBtn.innerText = "Błąd pobierania danych";
      loadMoreBtn.disabled = false;
   }
}

// --- 3. RENDEROWANIE WYNIKÓW ---
function appendSongsToDisplay(songs) {
   songs.forEach(song => {
      const attr = song.attributes;
      const artworkUrl = attr.artwork?.url?.replace('{w}', '500').replace('{h}', '500') || 'https://placeholder.com';
      const audioUrl = attr.previews?.[0]?.url || "";
      const fullName = `${attr.artistName} - ${attr.name}`;
      const shazamId = song.id || "";
      const escapeHTML = (str) =>
         str ? String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
         } [m])) : "";

      const songElement = document.createElement("div");
      songElement.className = "song-item";
      songElement.innerHTML = `
            <li class="hits_list_songs">
                <div class="song_cover"><img src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent(artworkUrl)}&w=250&h=250&q=75&d=1" alt="${escapeHTML(attr.artistName)}"></div>
                <div class="song_content">
                    <div class="song_data">
                        <div class="song_track">
                            <a target="_blank" href="song?id=${attr.playParams.id}">${attr.name}</a>
                        </div>
                        <div class="song_artist">${attr.artistName}</div>
                        <div class="song_teaser">
                            <a class="fa" data-audio="${audioUrl}"></a>
                            <a target="_blank" href="https://www.youtube.com/results?search_query=${encodeURIComponent(fullName)}"><i class="fa-brands fa-youtube"></i></a>
                            <a target="_blank" href="https://music.youtube.com/search?q=${encodeURIComponent(fullName)}"><i class="fa-solid fa-music"></i></a>
                            <a target="_blank" href="https://open.spotify.com/search/${encodeURIComponent(fullName)}"><i class="fa-brands fa-spotify"></i></a>
                            <a target="_blank" href="https://music.apple.com/pl/search?l=pl&term=${encodeURIComponent(fullName)}"><i class="fa-brands fa-apple"></i></a>
                            <a target="_blank" href="https://www.deezer.com/search/${encodeURIComponent(fullName)}/track"><i class="fa-brands fa-deezer"></i></a>
                            <a target="_blank" href="https://tidal.com/search/tracks?q=${encodeURIComponent(fullName)}"><i class="fa-brands fa-tidal"></i></a></div>
                     </div>
                  </div>
               </li>`;
      musicContainer.appendChild(songElement);
   });
}

// --- 4. LOGIKA ODTWARZACZA ---
musicContainer.addEventListener("click", (e) => {
   const btn = e.target.closest("[data-audio]");
   if (!btn) return;

   const src = btn.dataset.audio;
   if (!src) {
      alert("Podgląd niedostępny dla tego utworu.");
      return;
   }

   if (AUD.src !== src) {
      AUD.src = src;
      // Resetujemy ikony przy zmianie utworu
      document.querySelectorAll("[data-audio]").forEach(el => el.classList.remove("pause"));
   }

   if (AUD.paused) {
      AUD.play();
      btn.classList.add("pause");
   } else {
      AUD.pause();
      btn.classList.remove("pause");
   }
});

AUD.addEventListener("ended", () => {
   document.querySelectorAll("[data-audio]").forEach(el => el.classList.remove("pause"));
});
