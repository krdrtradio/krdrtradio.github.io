function NowZone(...args) {
   return new Date(
      new Date(...args).toLocaleString("sv-SE", {
         timeZone: "Europe/Warsaw"
      })
   );
}

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

const replacedIds = new Set(
    allItems
        .filter(item => item.schedule_onair)
        .map(item => item.id)
);

const ids = new Set();

for (const item of allItems) {

    if (replacedIds.has(item.id))
        continue;

    if (item.delete)
        continue;
  
    if (item.private)
        continue;

    if (item.hide_in_schedule)
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

    if (item.only_the_schedule_hosts === true) {

        const rows = schedule.filter(r =>
            r.id === item.id &&
            r.active &&
            !r.private &&
            !r.delete &&
            !r.hide_in_schedule &&
            (!r.publish_from_date || now >= new Date(r.publish_from_date)) &&
            (!r.publish_to_date || now <= new Date(r.publish_to_date))
        );

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

    if (Array.isArray(item.leaders_host)) {

        if (item.leaders_host.includes(peopleName)) {
            ids.add(item.id);
            continue;
        }

    } else if (item.leaders_host === peopleName) {

        ids.add(item.id);
        continue;
    }

    if (Array.isArray(item.host)) {

        if (item.host.includes(peopleName)) {
            ids.add(item.id);
            continue;
        }

    } else if (typeof item.host === "string") {

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
    .map(item => ({
        ...item,
        target_url: programs.some(p => p.id === item.id)
            ? `https://krdrtradio.github.io/radios/program?uid=${item.id}&st=${station}`
            : `https://krdrtradio.github.io/media/podcast?uid=${item.id}&st=${station}`
    }))
    .sort((a, b) => {

        const sa = Array.isArray(a.sorted)
            ? a.sorted.join(".")
            : "";

        const sb = Array.isArray(b.sorted)
            ? b.sorted.join(".")
            : "";

        return sa.localeCompare(
            sb,
            undefined,
            {
                numeric: true
            }
        );
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

      if (!people || people.private === true || people.delete === true || CONFIG.disable_peoples_info) {
         document.body.innerHTML = "Nie znaleziono ekipy o ID: " + uid;
         document.title = window.location.href;
         return;
      }

      people.except = people.except || {};

      // 3. Przygotowanie zmiennych pomocniczych
      const escapeHTML = (str) =>
         str ? String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
         } [m])) : "";

      const HTMLStripper = (str) =>
         str ? str.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n/g, "") : "";

      const thumb = people.thumbnail_text;
      const style = thumb ? [
         thumb.background ? `background:${thumb.background}` : '',
         thumb.color ? `color:${thumb.color}` : ''
      ].filter(Boolean).join(';') : '';

      const name = (thumb && thumb.name) || people.name || "";
      const thumbnailDisplay = people.thumbnail_uri ?
         `<img decoding="async" src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent('https://' + people.thumbnail_uri)}&w=500&h=500&q=75&d=1" alt="${escapeHTML(people.name)}">` : "";

      const thumbnailText = thumb ? `<div class="podcast_info_name_box" style="${style}">${escapeHTML(name)}</div>` : thumbnailDisplay;
      const thumb_metaT = people.thumbnail_uri ? 'https://' + people.thumbnail_uri : '';
      const thumb_meta = thumb ? '' : thumb_metaT;
      const desc_meta = people.meta_description ? people.meta_description : people.description;

      const emailContact = Array.isArray(people.email) ? 
         people.email.map(t => `<a href="mailto:${t}">${escapeHTML(t)}</a>`).join(', ') :
         typeof people.email === 'string' && people.email.trim() !== '' ? `<a href="mailto:${people.email}">${escapeHTML(people.email)}</a>` : '';

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
            key: 'url_apple_podcasts',
            icon: 'fa-brands fa-apple'
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
            key: 'url_linkedin',
            icon: 'fa-brands fa-linkedin'
         },
         {
            key: 'url_soundcloud',
            icon: 'fa-brands fa-soundcloud'
         },
         {
            key: 'url_mixcloud',
            icon: 'fa-brands fa-mixcloud'
         },
         {
            key: 'url_wikipedia',
            icon: 'fa-brands fa-wikipedia-w'
         }
      ];

      const socialUrlsHtml = socialConfig
         .filter(cfg => people[cfg.key])
         .map(cfg => `<a href="${people[cfg.key]}" target="_blank"><i class="${cfg.icon}"></i></a>`)
         .join('\n');

      // <<< DODAJ TUTAJ >>>
      const leaders_trg = await getDisplayleaders(people.name, station);

      const leadersHTML = leaders_trg.length
          ? leaders_trg
              .map(item =>
                  `<a href="${item.url_immediately || item.target_url}">${escapeHTML(item.name)}</a>`
              )
              .join(", ")
          : "";

      // 4. Budowanie treści (Zmienione na document.documentElement.innerHTML)
      const fullHTML = `<!DOCTYPE html>
            <html lang="pl">
                <head>
                    <meta charset="UTF-8">
                    <meta name='robots' content='noindex, follow' />
                    <title>${escapeHTML(people.meta_title ? people.meta_title : people.name)} | KrdrtRadio</title>
                    <meta name="description" content="${escapeHTML(HTMLStripper(desc_meta))}"/>
                    <meta property="og:title" content="${escapeHTML(people.meta_title ? people.meta_title : people.name)}"/>
                    <meta property="og:type" content="website"/>
                    <meta property="og:url" content="https://krdrtradio.github.io/media/people?uid=${uid}&st=${station}"/>
                    <meta property="og:image" content="${thumb_meta || 'https://i.ibb.co/ZRzp5yDs/team_default_plug.png'}"/>
                    <meta property="og:image:height" content="315"/>
                    <meta property="og:image:width" content="600"/>
                    ${desc_meta ? `<meta property="og:description" content="${escapeHTML(HTMLStripper(desc_meta))}"/>` : ''}
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
                                        ${(!people.except?.functions && people.functions) ? `<div class="podcast_info_functions">${Array.isArray(people.functions) ? escapeHTML(people.functions.join(', ')) : escapeHTML(people.functions)}</div>` : ""}
                                        ${(!people.except?.email && emailContact) ? `<div class="podcast_info_email">E-mail: ${emailContact}</div>` : ""}
                                        ${(!people.except?.leaders && people.leaders) ? `<div class="podcast_info_djs"><span class="podcast_info_djs_cat">Prowadzi:</span><br>${Array.isArray(people.leaders) ? escapeHTML(people.leaders.join(", ")) : escapeHTML(people.leaders)}</div>` : ""}
                                        ${(!people.except?.programs && leadersHTML) ? `<div class="podcast_info_djs"><span class="podcast_info_djs_cat">Audycje:</span><br>${leadersHTML}</div>` : ""}
                                    </div>
                                </div>
                                <div class="podcast_info_desc">${!people.except?.description ? (people.description || "Brak opisu ekipy.") : ""}</div>
                                <div class="podcast_info_urls">${!people.except?.url ? socialUrlsHtml : ""}</div>
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
