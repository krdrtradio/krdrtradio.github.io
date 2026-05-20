const params = new URLSearchParams(window.location.search);
const SongID = params.get('id');

function customSlug(title) {
   return title
      .toLowerCase()
      .replace(/[()?,!.]/g, "") // Usuwamy interpunkcję i nawiasy
      .trim()
      .split(/\s+/) // Dzielimy na słowa
      .map(word => {
         // Jeśli słowo zawiera cyrylicę (zakres \u0400-\u04FF)
         if (/[\u0400-\u04FF]/.test(word)) {
            return encodeURIComponent(word)
               .replace(/%/g, "") // Usuwamy % (zostaje czysty hex)
               .toLowerCase();
         }
         return word; // Polskie znaki i łacińskie zostają
      })
      .join("-"); // Łączymy myślnikiem
}

const getTrackDetails = async () => {
   const url = `https://shazam.p.rapidapi.com/songs/v2/get-details?id=${SongID}&l=pl-PL`;
   const options = {
      method: 'GET',
      headers: {
         'X-RapidAPI-Key': 'ea4a4a09c7msh91f54f4cc2e9531p160042jsn3a91d4fdbb5e',
         'X-RapidAPI-Host': 'shazam.p.rapidapi.com'
      }
   };

   try {
      const container = document.getElementById('song-id');
      const response = await fetch(url, options);

      if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);

      const result = await response.json();
      const track = result.data?.[0];

      if (!track) {
         container.innerHTML = "Nie znaleziono utworu.";
         document.title = 'Nie znaleziono utworu. | KrdrtRadio';
         return;
      }

      const attr = track.attributes;
      const fullName = `${attr.artistName} - ${attr.name}`;
      const releaseYear = attr.releaseDate ? attr.releaseDate.split('-')[0] : 'Brak roku';
      document.title = `${attr.name} - ${attr.artistName} | KrdrtRadio`;
      const ImageDisplay = attr.artwork?.url?.replace('{w}', '400').replace('{h}', '400') || 'https://i.ibb.co/NBz6BLZ/hit_default_plug.png';

      // Funkcja zabezpieczająca przed XSS
      const escapeHTML = (str) =>
         str ? String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
         } [m])) : "";

      const artistsUrl = `https://shazam.p.rapidapi.com/songs/get-related-artist?id=${SongID}&l=pl-PL`;
      const artistsRes = await fetch(artistsUrl, options);
      const artistsResult = await artistsRes.json();
      const artistsList = artistsResult.data || [];

      // Tworzymy listę linków oddzielonych przecinkami
      let artistsLinks = "";
      if (artistsList.length > 0) {
         artistsLinks = artistsList.map(art => {
            // Czyścimy ID z prefiksu "artist?id=", jeśli API go zwraca, 
            // lub zostawiamy, jeśli tak ma wyglądać Twój link
            const cleanId = art.id.replace('artist?id=', '');
            return `<a href="artist?id=${cleanId}">${escapeHTML(art.attributes.name)}</a>`;
         }).join(", ");
      } else {
         // Fallback do nazwy głównej, jeśli brak powiązań
         artistsLinks = escapeHTML(attr.artistName);
      }

      // Poprawiona struktura HTML (usunięte błędne nawiasy i poprawione ścieżki)
      container.innerHTML = `
    <div class="getSongs_content">
        <p class="getSongs_info_title"><a href="https://www.shazam.com/pl-pl/song/${SongID}/${customSlug(attr.name)}" target="_blank">${escapeHTML(attr.name) || 'Brak tytułu'}</a></p>
        <p class="getSongs_info_artist">${artistsLinks}</p>
        
        <div class="getSongs_box">
            <div class="getSongs_cover">
                <img src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent(ImageDisplay)}&w=250&h=250&q=75&d=1" 
                     alt="${escapeHTML(attr.artistName)}">
            </div>
            
            <div class="getSongs_data">
                <div class="getSongs_year">Premiera: ${escapeHTML(releaseYear) || 'Brak daty'}</div>
                <div class="getSongs_genare">${attr.genreNames ? attr.genreNames.map(gen => escapeHTML(gen)).join(', ') : 'Muzyka'}</div>
                
                <div class="getSongs_teaser">
                    ${attr.previews?.[0]?.url ? `<a class="fa-play-a" data-audio="${attr.previews[0].url}" title="Słuchaj próbki"></a>` : ''}
                    
                    <div class="social_links">
                        <a target="_blank" href="https://www.youtube.com/results?search_query=${encodeURIComponent(fullName)}"><i class="fa-brands fa-youtube"></i> YT</a>
                        <a target="_blank" href="https://music.youtube.com/search?q=${encodeURIComponent(fullName)}"><i class="fa-solid fa-music"></i> YT Music</a>
                        <a target="_blank" href="https://open.spotify.com/search/${encodeURIComponent(fullName)}"><i class="fa-brands fa-spotify"></i> Spotify</a>
                        <a target="_blank" href="https://music.apple.com/pl/search?l=pl&term=${encodeURIComponent(fullName)}"><i class="fa-brands fa-apple"></i> Apple</a>
                        <a target="_blank" href="https://www.deezer.com/search/${encodeURIComponent(fullName)}/track"><i class="fa-brands fa-deezer"></i> Deezer</a>
                        <a target="_blank" href="https://tidal.com/search/tracks?q=${encodeURIComponent(fullName)}"><i class="fa-brands fa-tidal"></i> Tidal</a></div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

      if (!window.audioPlayer) {
         window.audioPlayer = new Audio();
      }

      // 2. Znajdujemy nowo dodany przycisk w kontenerze
      const playBtn = container.querySelector(".fa-play-a");
      if (playBtn) {
         playBtn.onclick = function () {
            if (!window.AUD) window.AUD = new Audio();

            const src = this.dataset.audio;
            if (window.AUD.src !== src) window.AUD.src = src;

            if (window.AUD.paused) {
               window.AUD.play();
               this.classList.add("pause");
            } else {
               window.AUD.pause();
               this.classList.remove("pause");
            }

            window.AUD.onended = () => this.classList.remove("pause");
         };
      }

   } catch (error) {
      console.error('Wystąpił błąd:', error.message);
      document.getElementById('song-id').innerHTML = "Błąd podczas ładowania danych.";
      document.title = 'Błąd podczas ładowania danych. | KrdrtRadio';
   }
};
getTrackDetails();
