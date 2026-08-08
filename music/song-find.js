/*
 * ============================================================
 * POMOCNICZE FUNKCJE
 * ============================================================
 */

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


/*
 * ============================================================
 * POBRANIE PARAMETRU ?s=
 * ============================================================
 */

const params = new URLSearchParams(window.location.search);

const search = params.get('s') || 'Crazy Frog - Popcorn';


/*
 * ============================================================
 * GŁÓWNY KONTENER
 * ============================================================
 */

const container = document.getElementById('song-search');


/*
 * ============================================================
 * SPRAWDZENIE KONTENERA
 * ============================================================
 */

if (!container) {
    console.error('Nie znaleziono elementu #song-search');
}


/*
 * ============================================================
 * BRAK PARAMETRU
 * ============================================================
 */

else if (!search || !search.trim()) {
    container.innerHTML = `
        <h4>Brak wyszukiwanej frazy</h4>
        <p>Dodaj parametr <code>?s=Artysta - Utwór</code> do adresu URL.</p>`;
}


/*
 * ============================================================
 * JEST PARAMETR
 * ============================================================
 */

else {
    /*
     * --------------------------------------------------------
     * OCZYSZCZENIE WYSZUKIWANIA
     * --------------------------------------------------------
     */

    const cleanSearch = search.trim();


    /*
     * --------------------------------------------------------
     * ENCODE DO LINKÓW
     * --------------------------------------------------------
     */

    const query = encodeURIComponent(cleanSearch);


    /*
     * --------------------------------------------------------
     * TYTUŁ STRONY
     * --------------------------------------------------------
     */

    document.title = `${cleanSearch} | KrdrtRadio`;


    /*
     * ========================================================
     * PODSTAWOWY HTML
     * ========================================================
     */

    container.innerHTML = `
        <h2>
            ${escapeHTML(cleanSearch)}
        </h2>
		
        <div class="music-links">
		
            <!-- YouTube -->
            <a target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/results?search_query=${query}" title="YouTube" aria-label="YouTube"><i class="fa-brands fa-youtube fa-2xl"></i></a>

            <!-- YouTube Music -->
            <a target="_blank" rel="noopener noreferrer" href="https://music.youtube.com/search?q=${query}" title="YouTube Music" aria-label="YouTube Music"><i class="fa-solid fa-music fa-2xl"></i></a>

            <!-- Spotify -->
            <a target="_blank" rel="noopener noreferrer" href="https://open.spotify.com/search/${query}" title="Spotify" aria-label="Spotify"><i class="fa-brands fa-spotify fa-2xl"></i></a>

            <!-- Apple Music -->
            <a target="_blank" rel="noopener noreferrer" href="https://music.apple.com/pl/search?l=pl&term=${query}" title="Apple Music" aria-label="Apple Music"><i class="fa-brands fa-apple fa-2xl"></i></a>

            <!-- Deezer -->
            <a target="_blank" rel="noopener noreferrer" href="https://www.deezer.com/search/${query}/track" title="Deezer" aria-label="Deezer"><i class="fa-brands fa-deezer fa-2xl"></i></a>

            <!-- TIDAL -->
            <a target="_blank" rel="noopener noreferrer" href="https://tidal.com/search/tracks?q=${query}" title="TIDAL" aria-label="TIDAL"><i class="fa-brands fa-tidal fa-2xl"></i></a>
        </div>


        <!--
         * ====================================================
         * MIEJSCE NA DANE Z WORKERA
         * ====================================================
         -->

        <div id="songs">
            <p class="loading">Pobieranie informacji o utworze...</p>
		</div>`;


    /*
     * ========================================================
     * PODZIAŁ ARTYSTA / TYTUŁ
     * ========================================================
     *
     * Obsługujemy:
     *
     * Artysta - Tytuł
     *
     * oraz sytuację, kiedy tytuł zawiera kolejny " - ".
     */

    const partsSplit = cleanSearch.split(/\s+-\s+/);


    /*
     * --------------------------------------------------------
     * ARTYSTA
     * --------------------------------------------------------
     */

    const artistSplit = (partsSplit.shift() || '').trim();


    /*
     * --------------------------------------------------------
     * TYTUŁ
     * --------------------------------------------------------
     */

    const songsSplit = partsSplit.join(' - ').trim();


    /*
     * ========================================================
     * SPRAWDZENIE DANYCH
     * ========================================================
     */

    if (!artistSplit || !songsSplit) {
        const songs = document.getElementById('songs');

        if (songs) {
            songs.innerHTML = `<p class="error">Nieprawidłowy format wyszukiwania. Użyj: <strong>Artysta - Utwór</strong></p>`;
        }

        console.error('Nieprawidłowy format:', cleanSearch);
    }


    /*
     * ========================================================
     * FETCH JSON
     * ========================================================
     */

    else {
        /*
         * ----------------------------------------------------
         * URL WORKERA
         * ----------------------------------------------------
         */

        const workerUrl =
            'https://track-details.krdrtradio.workers.dev/' +
            `?title=${encodeURIComponent(songsSplit)}` +
            `&artist=${encodeURIComponent(artistSplit)}`;


        /*
         * ----------------------------------------------------
         * DEBUG
         * ----------------------------------------------------
         */

        console.log('========================================');

        console.log('Worker URL:', workerUrl);

        console.log('Artist:', artistSplit);

        console.log('Title:', songsSplit);


        /*
         * ====================================================
         * FETCH
         * ====================================================
         */

        fetch(workerUrl)

            /*
             * =================================================
             * ODPOWIEDŹ HTTP
             * =================================================
             */

            .then(async response => {
                /*
                 * Pobieramy najpierw tekst.
                 *
                 * Dzięki temu przy błędzie 400/404/500
                 * zobaczymy dokładną odpowiedź Workera.
                 */

                const text = await response.text();


                console.log('Worker HTTP:',response.status);

                console.log('Worker response:',text);


                /*
                 * ------------------------------------------------
                 * BŁĄD HTTP
                 * ------------------------------------------------
                 */

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${text}`);
                }


                /*
                 * ------------------------------------------------
                 * JSON
                 * ------------------------------------------------
                 */

                try {
                    return JSON.parse(text);
                }

                catch (error) {
                    throw new Error(`Worker zwrócił niepoprawny JSON: ${text}`);
                }
            })


            /*
             * =================================================
             * PRZETWARZANIE JSON
             * =================================================
             */

            .then(data => {
                console.log('Dane JSON:',data);


                /*
                 * ------------------------------------------------
                 * BRAK WYNIKU
                 * ------------------------------------------------
                 */

                if (!data.found) {
                    const songs =
                        document.getElementById('songs');

                    if (songs) {
                        songs.innerHTML = `<p class="error">${escapeHTML(data.message || 'Nie znaleziono utworu.')}</p>`;
                    }

                    return;
                }


                /*
                 * =================================================
                 * OKŁADKA
                 * =================================================
                 */

                const imageDisplay = data.artworkUrl100 || 'https://i.ibb.co/NBz6BLZ/hit_default_plug.png';


                /*
                 * =================================================
                 * ARTYSTA
                 * =================================================
                 */

                const artist = data.artist || artistSplit || 'Artysta';


                /*
                 * =================================================
                 * TYTUŁ
                 * =================================================
                 */

                const title = data.title || songsSplit || cleanSearch;


                /*
                 * =================================================
                 * PREVIEW
                 * =================================================
                 */

                const previewUrl = data.previewUrl || '';


                /*
                 * =================================================
                 * GATUNEK
                 * =================================================
                 */

                const genre = data.primaryGenreName || '';


                /*
                 * =================================================
                 * DATA WYDANIA
                 * =================================================
                 */

                const releaseDate = data.releaseDate || '';


                /*
                 * =================================================
                 * LINK ITUNES
                 * =================================================
                 */

                const trackViewUrl = data.trackViewUrl || '';


                /*
                 * =================================================
                 * HTML DANYCH UTWORU
                 * =================================================
                 */

                const html = `<div class="getSongs_box">

                        <!-- ====================================
                             OKŁADKA
                             ==================================== -->

                        <div class="getSongs_cover">
                            <img src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent(imageDisplay)}&w=250&h=250&q=75&d=1" alt="${escapeHTML(`${artist} - ${title}`)}" loading="lazy">
                        </div>


                        <!-- ====================================
                             INFORMACJE
                             ==================================== -->

                        <div class="getSongs_teaser">
                            <h3>
                                ${escapeHTML(title)}
                            </h3>
                            <p>
                                ${escapeHTML(artist)}
                            </p>
                            ${genre ? `<p class="song-genre">${escapeHTML(genre)}</p>` : ''}
                            ${releaseDate ? `<p class="song-release">${escapeHTML(releaseDate.substring(0, 10))}</p>` : ''}


                            <!-- =================================
                                 PREVIEW
                                 ================================= -->

                            ${previewUrl ? `<a href="#" class="fa-play-a" data-audio="${escapeHTML(previewUrl)}" title="Słuchaj próbki" aria-label="Słuchaj próbki"><i class="fa-solid fa-play"></i></a>` : `<span class="no-preview">Brak próbki</span>`}
                            ${trackViewUrl ? `<a href="${escapeHTML(trackViewUrl)}" target="_blank" rel="noopener noreferrer" class="itunes-link" title="Otwórz w Apple Music">Apple Music</a>` : ''}
                        </div>
                    </div>
                `;


                /*
                 * =================================================
                 * WSTAWIENIE HTML
                 * =================================================
                 */

                const songs =
                    document.getElementById('songs');

                if (songs) {
                    songs.innerHTML = html;
                }

                console.log('Utwór:', artist, '-', title);

                console.log('Okładka:', imageDisplay);

                console.log('Preview:', previewUrl);
            })


            /*
             * =================================================
             * BŁĄD FETCH
             * =================================================
             */

            .catch(error => {
                console.error('Błąd podczas pobierania danych:', error);
				
                const songs = document.getElementById('songs');

                if (songs) {
                    songs.innerHTML = `<p class="error">Nie udało się pobrać informacji o utworze.</p>`;
                }
            });
    }
}


/*
 * ============================================================
 * ODTWARZANIE PREVIEW
 * ============================================================
 *
 * Jeden element Audio jest używany ponownie.
 * Dzięki temu nie uruchomisz kilku próbek naraz.
 *
 * ============================================================
 */

let currentAudio = null;


document.addEventListener('click',
    function (event) {

        /*
         * --------------------------------------------------------
         * SPRAWDZENIE PRZYCISKU
         * --------------------------------------------------------
         */

        const button = event.target.closest('.fa-play-a');


        if (!button) {
            return;
        }


        /*
         * --------------------------------------------------------
         * BLOKADA DOMYŚLNEGO LINKU
         * --------------------------------------------------------
         */

        event.preventDefault();


        /*
         * --------------------------------------------------------
         * URL AUDIO
         * --------------------------------------------------------
         */

        const audioUrl = button.dataset.audio;


        if (!audioUrl) {
            console.warn('Brak URL preview.');

            return;
        }


        /*
         * ========================================================
         * TEN SAM UTWÓR
         * ========================================================
         *
         * Jeśli kliknięto ten sam przycisk podczas odtwarzania,
         * zatrzymaj audio.
         */

        if (
            currentAudio &&
            !currentAudio.paused &&
            currentAudio.src === audioUrl
        ) {
            currentAudio.pause();

            currentAudio.currentTime = 0;

            button.classList.remove('is-playing');

            return;
        }


        /*
         * ========================================================
         * ZATRZYMANIE POPRZEDNIEGO AUDIO
         * ========================================================
         */

        if (currentAudio) {
            currentAudio.pause();

            currentAudio.currentTime = 0;

            document.querySelectorAll('.fa-play-a').forEach(item => {
                item.classList.remove('is-playing');
            });
        }


        /*
         * ========================================================
         * NOWE AUDIO
         * ========================================================
         */

        currentAudio = new Audio(audioUrl);


        currentAudio.volume = 1;


        /*
         * --------------------------------------------------------
         * PRELOAD
         * --------------------------------------------------------
         */

        currentAudio.preload = 'auto';


        /*
         * ========================================================
         * ODTWARZANIE
         * ========================================================
         */

        currentAudio.play()
            .then(() => {
                button.classList.add('is-playing');
            })

            .catch(error => {
                console.error('Nie można odtworzyć próbki:',error);
                button.classList.remove('is-playing');
            });


        /*
         * ========================================================
         * KONIEC PREVIEW
         * ========================================================
         */

        currentAudio.addEventListener('ended',
            function () {
                button.classList.remove('is-playing');
                currentAudio.currentTime = 0;
            }
        );


        /*
         * ========================================================
         * BŁĄD AUDIO
         * ========================================================
         */

        currentAudio.addEventListener('error',
            function () {
                console.error('Błąd odtwarzania preview:',currentAudio.error);
                button.classList.remove('is-playing');
            }
        );
    }
);
