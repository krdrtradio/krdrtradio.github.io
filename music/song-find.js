// Pobieranie parametru "s" z adresu URL
const params = new URLSearchParams(window.location.search);
const search = params.get("s");

// Element, w którym zostanie wyświetlona zawartość
const container = document.getElementById("song-search");

// Sprawdzenie, czy podano parametr
if (!search) {
    container.innerHTML = `
        <h4>Brak wyszukiwanej frazy</h4>
        <p>Dodaj parametr <code>?s=Artysta - Utwór</code> do adresu URL.</p>
    `;
} else {
    const query = encodeURIComponent(search);
    document.title = search + ' | KrdrtRadio';

    container.innerHTML = `
        <h2>${search}</h2>

        <div class="music-links">
            <a target="_blank" rel="noopener noreferrer"
               href="https://www.youtube.com/results?search_query=${query}"
               title="YouTube">
                <i class="fa-brands fa-youtube fa-2xl"></i>
            </a>

            <a target="_blank" rel="noopener noreferrer"
               href="https://music.youtube.com/search?q=${query}"
               title="YouTube Music">
                <i class="fa-solid fa-music fa-2xl"></i>
            </a>

            <a target="_blank" rel="noopener noreferrer"
               href="https://open.spotify.com/search/${query}"
               title="Spotify">
                <i class="fa-brands fa-spotify fa-2xl"></i>
            </a>

            <a target="_blank" rel="noopener noreferrer"
               href="https://music.apple.com/pl/search?l=pl&term=${query}"
               title="Apple Music">
                <i class="fa-brands fa-apple fa-2xl"></i>
            </a>

            <a target="_blank" rel="noopener noreferrer"
               href="https://www.deezer.com/search/${query}/track"
               title="Deezer">
                <i class="fa-brands fa-deezer fa-2xl"></i>
            </a>

            <a target="_blank" rel="noopener noreferrer"
               href="https://tidal.com/search/tracks?q=${query}"
               title="TIDAL">
                <i class="fa-brands fa-tidal fa-2xl"></i>
            </a>
        </div>
    `;
}
