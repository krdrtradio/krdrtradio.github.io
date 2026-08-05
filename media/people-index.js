function getActiveScheduleBlock(date = NowZone(), scheduleData) {
   if (!Array.isArray(scheduleData)) return {
      schedule: []
   };

   // Szukaj bloku z zakresem dat
   const specialBlock = scheduleData.find(block => {
      if (!block.startDate || !block.EndDate) return false;
      return date >= new Date(block.startDate) && date <= new Date(block.EndDate);
   });

   // Zwróć specjalny blok, domyślny (ID 0) lub pusty obiekt
   return specialBlock || scheduleData.find(b => b.scheduleID === 0) || {
      schedule: []
   };
}


async function getDisplayleaders(peopleName, station) {

    const fetchJSON = async (url, object = false) => {
        try {
            const res = await fetch(url);

            if (!res.ok)
                return object ? {} : [];

            const data = await res.json();

            return object
                ? (Array.isArray(data) ? (data[0] || {}) : (data || {}))
                : (Array.isArray(data) ? data : []);

        } catch (e) {
            console.error(e);
            return object ? {} : [];
        }
    };

    const [
        podcasts,
        programs,
        scheduleBlocks,
        mediaConfig,
        programConfig
    ] = await Promise.all([
        fetchJSON(`https://krdrtradio.github.io/media/json/${station}_podcasts.json`),
        fetchJSON(`https://krdrtradio.github.io/radios/json/${station}_programs.json`),
        fetchJSON(`https://krdrtradio.github.io/radios/json/${station}_schedule.json`),
        fetchJSON(`https://krdrtradio.github.io/media/json/${station}_config.json`, true),
        fetchJSON(`https://krdrtradio.github.io/radios/json/${station}_config.json`, true)
    ]);

    const now = typeof NowZone === "function"
        ? NowZone()
        : new Date();

    const activeBlock = getActiveScheduleBlock(now, scheduleBlocks);
    const schedule = activeBlock?.schedule || [];

    const allItems = [...programs, ...podcasts];

    const ids = new Set();

    for (const item of allItems) {

        if (item.private)
            continue;

        if (item.hide_in_program)
            continue;

        if (item.hide_in_podcast)
            continue;

        if (item.hide_only_information_schedule)
            continue;

        const isPodcast = podcasts.some(p => p.id === item.id);
        const isProgram = programs.some(p => p.id === item.id);

        if (isPodcast && mediaConfig.disable_podcasts_info)
            continue;

        if (isProgram && programConfig.disable_programs_info)
            continue;

        // only_the_schedule_hosts = true
        if (item.only_the_schedule_hosts === true) {

            const rows = schedule.filter(r => r.id === item.id && r.active);

            for (const row of rows) {

                const hosts = Array.isArray(row.host)
                    ? row.host
                    : row.host
                        ? [row.host]
                        : [];

                if (hosts.includes(peopleName)) {
                    ids.add(item.id);
                    break;
                }
            }

            continue;
        }

        // leaders_host
        if (Array.isArray(item.leaders_host)) {

            if (item.leaders_host.includes(peopleName)) {
                ids.add(item.id);
                continue;
            }

        } else if (item.leaders_host === peopleName) {

            ids.add(item.id);
            continue;
        }

        // host
        if (Array.isArray(item.host)) {

            if (item.host.includes(peopleName)) {
                ids.add(item.id);
                continue;
            }

        } else if (typeof item.host === "string") {

            // dokładne dopasowanie
            if (item.host === peopleName) {
                ids.add(item.id);
                continue;
            }

            if (item.host.includes(peopleName)) {
                ids.add(item.id);
                continue;
            }
        }
    }

    return allItems
        .filter(item => ids.has(item.id))
        .sort((a, b) => {
            const sa = Array.isArray(a.sorted) ? a.sorted.join(".") : "";
            const sb = Array.isArray(b.sorted) ? b.sorted.join(".") : "";
            return sa.localeCompare(sb, undefined, { numeric: true });
        });
}

async function uruchomPeople() {
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
      const [PEOPLES, CONFIG] = await Promise.all([
         fetchJSON('peoples'),
         fetchJSON('config')
      ]);

      const people = PEOPLES.find(p => p.id === uid);

      if (!people || people.private === true || CONFIG.disable_peoples_info) {
         document.body.innerHTML = "Nie znaleziono ekipy o ID: " + uid;
         document.title = window.location.href;
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

      const thumb = people.thumbnail_text;
      const style = thumb ? [
         thumb.background ? `background:${thumb.background}` : '',
         thumb.color ? `color:${thumb.color}` : ''
      ].filter(Boolean).join(';') : '';

      const name = (thumb && thumb.name) || people.name || "";
      const thumbnailDisplay = people.thumbnail_uri ?
         `<img decoding="async" src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent('https://' + people.thumbnail_uri)}&w=500&h=500&q=75&d=1" alt="${escapeHTML(people.name)}">` : "";

      const thumbnailText = thumb ? `<div class="podcast_info_name_box" style="${style}">${escapeHTML(name)}</div>` : thumbnailDisplay;

      // 4. Budowanie treści (Zmienione na document.documentElement.innerHTML)
      const fullHTML = `<!DOCTYPE html>
            <html lang="pl">
                <head>
                    <meta charset="UTF-8">
                    <meta name='robots' content='noindex, follow' />
                    <title>${escapeHTML(people.name)} | KrdrtRadio</title>
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
                            <section>
                                <div class="podcast_info_title">${escapeHTML(people.name)}</div>
                                <div class="podcast_info_box">
                                    <div class="podcast_info_cover">${thumbnailText}</div>
                                    <div class="podcast_info_data">
                                        ${people.functions ? `<div class="podcast_info_functions">${Array.isArray(people.functions) ? escapeHTML(people.functions.join(', ')) : escapeHTML(people.functions)}</div>` : ""}
                                        ${people.leaders ? `<div class="podcast_info_djs"><small>Prowadzi:</small><br>${Array.isArray(people.leaders) ? escapeHTML(people.leaders.join(', ')) : escapeHTML(people.leaders)}</div>` : ""}
                                    </div>
                                </div>
                                <div class="podcast_info_desc">${people.description || "Brak opisu ekipy."}</div>
                            </section>
                            <script src="https://krdrtradio.github.io/site-bottom.js"><\/script>
                        </main>
                    </div>
                    <script src="https://krdrtradio.github.io/script.js"><\/script>
                    <script src="https://krdrtradio.github.io/script-def.js"><\/script>
                </body>
            </html>`;
      // Podmiana całej strony
      document.open();
      document.write(fullHTML);
      document.close();
   } catch (err) {
      console.error(err);
      document.body.innerHTML =
         "Błąd krytyczny: " + err.message;
   }
}
uruchomPeople();
