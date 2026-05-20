// 1. Pobieranie ID artysty z adresu URL (np. ?id=123)
const params = new URLSearchParams(window.location.search);
const ArtistID = params.get('id');

// 2. Funkcja tworząca "slug" do linku Shazam (obsługa cyrylicy i znaków specjalnych)
function customSlug(title) {
   return title
      .toLowerCase()
      .replace(/[()?,!.]/g, "") // Usuwamy interpunkcję
      .trim()
      .split(/\s+/) // Dzielimy na słowa
      .map(word => {
         // Jeśli słowo zawiera cyrylicę, zamieniamy na kod HEX (bez %)
         if (/[\u0400-\u04FF]/.test(word)) {
            return encodeURIComponent(word)
               .replace(/%/g, "")
               .toLowerCase();
         }
         return word; // Polskie i łacińskie znaki zostają
      })
      .join("-"); // Łączymy myślnikiem
}

// 3. Główna funkcja pobierająca dane z RapidAPI
const getArtistDetails = async () => {
   const url = `https://shazam.p.rapidapi.com/artists/get-details?id=${ArtistID}&l=pl-PL`;
   const options = {
      method: 'GET',
      headers: {
         'X-RapidAPI-Key': 'ea4a4a09c7msh91f54f4cc2e9531p160042jsn3a91d4fdbb5e',
         'X-RapidAPI-Host': 'shazam.p.rapidapi.com'
      }
   };

   const container = document.getElementById('song-id');

   try {
      const response = await fetch(url, options);

      if (!response.ok) throw new Error(`Błąd HTTP: ${response.status}`);

      const result = await response.json();
      const track = result.data?.[0];

      // Obsługa przypadku, gdy API nie zwróci artysty
      if (!track) {
         container.innerHTML = "Nie znaleziono artystów.";
         document.title = 'Nie znaleziono artystów. | krdrt537000ym.github.io';
         return;
      }

      const attr = track.attributes;
      const ImageDisplay = attr.artwork?.url?.replace('{w}', '400').replace('{h}', '400') || 'https://i.ibb.co/NBz6BLZ/hit_default_plug.png';

      // Aktualizacja tytułu strony
      document.title = `${attr.name} | krdrt537000ym.github.io`;

      // Funkcja zabezpieczająca przed atakami XSS
      const escapeHTML = (str) =>
         str ? String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
         } [m])) : "";

      // 4. Renderowanie HTML z danymi artysty
      container.innerHTML = `
    <div class="getSongs_content">
        <p class="getSongs_info_title">
            <a href="https://www.shazam.com/pl-pl/artist/${customSlug(attr.name)}/${ArtistID}" target="_blank">
                ${escapeHTML(attr.name) || 'Nieznany wykonawca'}
            </a>
        </p>
        
        <div class="getSongs_box">
            <div class="getSongs_cover">
                <img src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent(ImageDisplay)}&w=250&h=250&q=75&d=1" 
                     alt="${escapeHTML(attr.name)}">
            </div>
            
            <div class="getSongs_data">
                <div class="getSongs_genare">
                    ${attr.genreNames ? attr.genreNames.map(gen => escapeHTML(gen)).join(', ') : 'Muzyka'}
                </div>
            </div>
        </div>
    </div>`;

   } catch (error) {
      console.error('Wystąpił błąd:', error.message);
      container.innerHTML = "Błąd podczas ładowania danych.";
      document.title = 'Błąd podczas ładowania danych. | krdrt537000ym.github.io';
   }
};

// Uruchomienie funkcji
getArtistDetails();
