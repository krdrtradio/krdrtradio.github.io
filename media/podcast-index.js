async function uruchomPodcast() {
   const params = new URLSearchParams(window.location.search);
   const uid = params.get('uid');
   const station = params.get('st');

   if (!uid || !station) {
      document.body.innerHTML = "Błąd: Brak parametrów 'uid' lub 'st' w adresie URL.";
      document.title = window.location.href;
      return;
   }

   try {
      // Funkcja pomocnicza z POPRAWIONĄ ŚCIEŻKĄ: /media/json/
      const fetchJSON = async (fileName) => {
         const url = `https://krdrtradio.github.io/media/json/${station}_${fileName}.json`;
         try {
            const res = await fetch(url);
            if (!res.ok) return fileName === 'config' ? {} : [];

            const data = await res.json();

            // Twoja poprawka: standaryzacja CONFIG i SCHEDULE
            if (fileName === 'config') {
               return (Array.isArray(data) ? data[0] : data) || {};
            }

            // Dla schedule i programs upewniamy się, że to zawsze tablica (do .filter i .find)
            return Array.isArray(data) ? data : [];

         } catch (e) {
            return (fileName === 'config') ? {} : [];
         }
      };

      // Wywołanie w Promise.all pozostaje bez zmian:
      const [PODCASTS, CONFIG] = await Promise.all([
         fetchJSON('podcasts'),
         fetchJSON('config')
      ]);

      const podcast = PODCASTS.find(p => p.id === uid);

      if (!podcast || podcast.private === true || CONFIG.disable_podcasts_info) {
         // Używamy ?. aby uniknąć błędu, jeśli podcast jest undefined
         const redirectUrl = podcast?.url_immediately_with_private;

         if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
         } else {
            document.body.innerHTML = "Nie znaleziono podcastu o ID: " + uid;
            document.title = window.location.href;
            return;
         }
      }

      // 2. Obsługa natychmiastowego przekierowania
      if (podcast.url_immediately) {
         window.location.href = podcast.url_immediately;
         return;
      }

      // 3. Przygotowanie zmiennych pomocniczych
      const escapeHTML = (str) =>
         str ? String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
         } [m])) : "";

      const occurrencesHostA = podcast.host || "---";

      const thumb = podcast.thumbnail_text;
      const style = thumb ? [
         thumb.background ? `background:${thumb.background}` : '',
         thumb.color ? `color:${thumb.color}` : ''
      ].filter(Boolean).join(';') : '';

      const name = (thumb && thumb.name) || podcast.name || "";
      const thumbnailDisplay = podcast.thumbnail_uri ?
         `<img decoding="async" src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent('https://' + podcast.thumbnail_uri)}&w=500&h=500&q=75&d=1" alt="${escapeHTML(podcast.name)}">` : "";

      const thumbnailText = thumb ? `<div class="podcast_info_name_box" style="${style}">${escapeHTML(name)}</div>` : thumbnailDisplay;

      const emailContact = Array.isArray(podcast.email) ? 
         podcast.email.map(t => `<a href="mailto:${t}">${escapeHTML(t)}</a>`).join(', ') :
         typeof podcast.email === 'string' && podcast.email.trim() !== '' ? `<a href="mailto:${podcast.email}">${escapeHTML(podcast.email)}</a>` : '';

      const podcastList = (podcast.podcast) ? `
          <audio controls="" id="player" style="display:none;margin-top:10px;margin-left:25px;"><source src=""></audio>
          <div class="podcast_list_episode">
              <h3>Lista odcinków podcastu:</h3>
              <div id="episode-list">Ładowanie odcinków...</div>
              <button id="load-more-btn" style="display:none;">Załaduj więcej</button>
          </div>` : '';

      const socialConfig = [{
            key: 'url',
            icon: 'fa-solid fa-link'
         },
         {
            key: 'url_rss',
            icon: 'fa-solid fa-rss'
         },
         {
            key: 'url_podcast',
            icon: 'fa-solid fa-podcast'
         },
         {
            key: 'url_spreaker',
            icon: 'fa-solid fa-table-list'
         },
         {
            key: 'url_spotify',
            icon: 'fa-brands fa-spotify'
         },
         {
            key: 'url_kick',
            icon: 'fa-brands fa-kickstarter-k'
         },
         {
            key: 'url_twitch',
            icon: 'fa-brands fa-twitch'
         },
         {
            key: 'url_youtube',
            icon: 'fa-brands fa-youtube'
         },
         {
            key: 'url_facebook',
            icon: 'fa-brands fa-facebook'
         },
         {
            key: 'url_instagram',
            icon: 'fa-brands fa-instagram'
         },
         {
            key: 'url_tiktok',
            icon: 'fa-brands fa-tiktok'
         },
         {
            key: 'url_x',
            icon: 'fa-brands fa-x-twitter'
         },
         {
            key: 'url_soundcloud',
            icon: 'fa-brands fa-soundcloud'
         },
         {
            key: 'url_mixcloud',
            icon: 'fa-brands fa-mixcloud'
         }
      ];

      const socialUrlsHtml = socialConfig
         .filter(cfg => podcast[cfg.key])
         .map(cfg => `<a href="${podcast[cfg.key]}" target="_blank"><i class="${cfg.icon}"></i></a>`)
         .join('\n');

      // 4. Budowanie treści (Zmienione na document.documentElement.innerHTML)
      const fullHTML = `<!DOCTYPE html>
            <html lang="pl">
                <head>
                    <meta charset="UTF-8">
                    <meta name='robots' content='noindex, follow' />
                    <title>${escapeHTML(podcast.name)} | KrdrtRadio</title>
                    <script src="https://krdrtradio.github.io/site-head.js"><\/script>
                    <link rel="stylesheet" href="https://krdrtradio.github.io/style-def.css">
                    <link rel="stylesheet" href="https://krdrtradio.github.io/media/media.css">
                    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"><\/script>
                </head>
                <body>
                    <div>
                        <script src="https://krdrtradio.github.io/site-top.js"><\/script>
                        <div class="overlay" id="overlay"></div>
                        <main class="main-content">
                            <script src="https://krdrtradio.github.io/site-tophead.js"><\/script>
                            <section class="hero">
                                <div class="podcast_info_title">${escapeHTML(podcast.name)}</div>
                                <div class="podcast_info_box">
                                    <div class="podcast_info_cover">${thumbnailText}</div>
                                    <div class="podcast_info_data">
                                        ${podcast.onair ? `<div class="podcast_info_airtime">${escapeHTML(podcast.onair)}</div>` : ""}
                                        ${podcast.label ? `<div class="podcast_info_producter">Wydawca: ${escapeHTML(podcast.label)}</div>` : ""}
                                        ${emailContact ? `<div class="podcast_info_email">E-mail: ${emailContact}</div>` : ""}
                                        <div class="podcast_info_djs"><small>Prowadzący:</small><br>${escapeHTML(occurrencesHostA)}</div>
                                    </div>
                                </div>
                                <div class="podcast_info_desc">${podcast.description || "Brak opisu podcastu."}</div>
                                <div class="podcast_info_urls">${socialUrlsHtml}</div>
                                ${podcastList}
                            </section>
                            <script src="https://krdrtradio.github.io/site-bottom.js"><\/script>
                        </main>
                    </div>
                    <script src="https://krdrtradio.github.io/script.js"><\/script>
                    <script src="https://krdrtradio.github.io/script-def.js"><\/script>
                    <script src="https://krdrtradio.github.io/media/site-episode.js"><\/script>
                    <script src="https://krdrtradio.github.io/media/site-audio.js"><\/script>
                    ${podcast.podcast ? `<script>${podcast.podcast}<\/script>` : ""}
                </body>
            </html>`;
      // Podmiana całej strony
      document.open();
      document.write(fullHTML);
      document.close();
      // 👉 WAŻNE: inicjalizacja po renderze
      setTimeout(() => {
         bindLoadMoreButton();
         startPodcastEngine(podcast.podcast);
      }, 1000);
      // 👉 RESET pagination (globalnie)
      if (typeof resetPodcastPagination === "function") {
         resetPodcastPagination();
      }
   } catch (err) {
      console.error(err);
      document.body.innerHTML =
         "Błąd krytyczny: " + err.message;
   }
}
uruchomPodcast();
