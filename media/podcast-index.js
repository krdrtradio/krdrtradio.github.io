function NowZone(...args) {
   return new Date(
      new Date(...args).toLocaleString("sv-SE", {
         timeZone: "Europe/Warsaw"
      })
   );
}

const MonthWeekCalculator = (dateInput, requestedWeeks) => {
   const date = new Date(dateInput);

   // Walidacja daty
   if (isNaN(date.getTime())) return null;

   const day = date.getDate();
   const month = date.getMonth();
   const year = date.getFullYear();
   const daysInMonth = new Date(year, month + 1, 0).getDate();

   // Zakres tygodnia (poniedziałek - niedziela)
   const getWeekRange = () => {
      const from = new Date(date);
      const dayOfWeek = from.getDay(); // 0 = niedziela

      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      from.setDate(from.getDate() + diff);

      const to = new Date(from);
      to.setDate(to.getDate() + 6);

      return {
         from,
         to
      };
   };

   const weekRange = getWeekRange();

   // Pomocnicza funkcja do obliczeń tygodni w skali miesiąca
   const getWeekByStartDay = (targetDayIdx, reverse = false) => {
      if (!reverse) {
         const firstOfMonth = new Date(year, month, 1).getDay();
         const offset = (firstOfMonth - targetDayIdx + 7) % 7;
         return Math.ceil((day + offset) / 7);
      } else {
         const lastOfMonth = new Date(year, month, daysInMonth).getDay();
         const distFromEnd = daysInMonth - day + 1;
         const offset = (targetDayIdx - lastOfMonth + 7) % 7;
         return Math.ceil((distFromEnd + offset) / 7);
      }
   };

   // Obiekt z wynikami
   const calculations = {
      day,
      month,
      year,

      fromDate: weekRange.from,
      toDate: weekRange.to,

      dayGroup: Math.ceil(day / 7),
      lastDayGroup: Math.ceil((daysInMonth - day + 1) / 7),

      firstSunday: getWeekByStartDay(0),
      firstMonday: getWeekByStartDay(1),
      firstTuesday: getWeekByStartDay(2),
      firstWednesday: getWeekByStartDay(3),
      firstThursday: getWeekByStartDay(4),
      firstFriday: getWeekByStartDay(5),
      firstSaturday: getWeekByStartDay(6),

      lastSunday: getWeekByStartDay(0, true),
      lastMonday: getWeekByStartDay(1, true),
      lastTuesday: getWeekByStartDay(2, true),
      lastWednesday: getWeekByStartDay(3, true),
      lastThursday: getWeekByStartDay(4, true),
      lastFriday: getWeekByStartDay(5, true),
      lastSaturday: getWeekByStartDay(6, true)
   };

   // Punkt odniesienia:
   // Poniedziałek 22.12.2025 = maksymalna wartość każdego cyklu
   const baseDate = new Date(2025, 11, 22);

   const MS_PER_WEEK = 1000 * 60 * 60 * 24 * 7;
   const weeksPassed = Math.floor((date - baseDate) / MS_PER_WEEK);

   // Generowanie mod2...mod16
   for (let i = 2; i <= 16; i++) {
      let modValue = ((weeksPassed % i) + i) % i;
      calculations[`mod${i}`] = modValue === 0 ? i : modValue;
   }

   // Zwróć pojedynczą wartość
   if (typeof requestedWeeks === "string") {
      return calculations[requestedWeeks];
   }

   // Zwróć wybrane wartości
   if (Array.isArray(requestedWeeks)) {
      return requestedWeeks.reduce((acc, key) => {
         if (key in calculations) {
            acc[key] = calculations[key];
         }
         return acc;
      }, {});
   }

   // Zwróć cały obiekt
   return calculations;
};

// Funkcja wybierająca odpowiedni blok (np. ramówka świąteczna vs standardowa)
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

// Główna funkcja formatująca czas emisji
function getDisplaySchedule(programId, rawSchedule) {
   const daysMapFull = {
      "1": "Poniedziałek",
      "2": "Wtorek",
      "3": "Środa",
      "4": "Czwartek",
      "5": "Piątek",
      "6": "Sobota",
      "0": "Niedziela"
   };
   const daysMapShort = {
      "1": "Pn",
      "2": "Wt",
      "3": "Śr",
      "4": "Czw",
      "5": "Pt",
      "6": "Sob",
      "0": "Ndz"
   };

   const months = {
      0: "styczeń",
      1: "luty",
      2: "marzec",
      3: "kwiecień",
      4: "maj",
      5: "czerwiec",
      6: "lipiec",
      7: "sierpień",
      8: "wrzesień",
      9: "październik",
      10: "listopad",
      11: "grudzień"
   };

   // Mapa tłumaczeń kluczy z MonthWeekCalculator na czytelny tekst
   const labelMap = {
      dayGroup: "tydzień miesiąca",
      lastDayGroup: "tydzień od końca miesiąca",

      firstMonday: "poniedziałek miesiąca",
      firstTuesday: "wtorek miesiąca",
      firstWednesday: "środa miesiąca",
      firstThursday: "czwartek miesiąca",
      firstFriday: "piątek miesiąca",
      firstSaturday: "sobota miesiąca",
      firstSunday: "niedziela miesiąca",

      lastMonday: "ostatni poniedziałek miesiąca",
      lastTuesday: "ostatni wtorek miesiąca",
      lastWednesday: "ostatnia środa miesiąca",
      lastThursday: "ostatni czwartek miesiąca",
      lastFriday: "ostatni piątek miesiąca",
      lastSaturday: "ostatnia sobota miesiąca",
      lastSunday: "ostatnia niedziela miesiąca",

      month: "miesiąc",
      fromDate: "od",
      toDate: "do"
   };

   const timeGroups = {};
   const firstAppearance = {};
   const now = NowZone();

   const activeBlock = getActiveScheduleBlock(now, rawSchedule);
   const scheduleSource = activeBlock ? (activeBlock.schedule || []) : [];

   const filtered = scheduleSource.filter(p => {
      if (p.id !== programId || !p.active || p.private || p.delete || p.hide_in_schedule) return false;
      return (
        (p.publish_from_date ? now >= new Date(p.publish_from_date) : true) &&
        (p.publish_to_date ? now <= new Date(p.publish_to_date) : true)
      );
   });

   if (filtered.length === 0) return "";

   filtered.forEach(occ => {
      const start = (occ.hour_start || "00:00").substring(0, 5);
      const end = (occ.hour_end || "00:00").substring(0, 5);

      let suffixes = [];

      // Funkcja pomocnicza do generowania opisu reguł
      const buildRules = (obj, isExclude = false) => {
         if (!obj) return;

         Object.keys(obj).forEach(key => {
            const val = obj[key];
            let label = "";

            if (key.startsWith("mod")) {
               const num = key.replace("mod", "");
               label = `co ${num} tyg. (cykl ${val})`;
            }
            else if (key === "month") {
               label = months[val] || val;
            }
            else if (key === "fromDate" || key === "toDate") {
               const d = new Date(val);

               label =
                  `${labelMap[key]} ${String(d.getDate()).padStart(2, "0")}.` +
                  `${String(d.getMonth() + 1).padStart(2, "0")}.` +
                  `${d.getFullYear()}`;
            }
            else if (labelMap[key]) {
               label = `${val}. ${labelMap[key]}`;
            }

            if (label) {
               suffixes.push(isExclude ? `oprócz: ${label}` : label);
            }
         });
      };

      buildRules(occ.weekmonth, false);
      buildRules(occ.weekmonth_exclude, true);

      const suffixText = suffixes.length > 0 ? ` (${suffixes.join(', ')})` : "";
      const timeKey = `${start} - ${end}${suffixText}`;

      if (!timeGroups[timeKey]) timeGroups[timeKey] = new Set();
      const days = Array.isArray(occ.days) ? occ.days : [occ.days];

      days.forEach(d => {
         if (d !== null && d !== undefined) {
            const dStr = d.toString();
            timeGroups[timeKey].add(dStr);
            const sortVal = dStr === "0" ? 7 : parseInt(dStr);
            const weight = sortVal * 10000 + parseInt(start.replace(":", ""));
            if (!firstAppearance[timeKey] || weight < firstAppearance[timeKey]) {
               firstAppearance[timeKey] = weight;
            }
         }
      });
   });

   const sortedTimeKeys = Object.keys(timeGroups).sort((a, b) => firstAppearance[a] - firstAppearance[b]);

   return sortedTimeKeys.map(timeKey => {
      const sortedDays = Array.from(timeGroups[timeKey]).sort((a, b) => (a == "0" ? 7 : a) - (b == "0" ? 7 : b));
      let parts = [];
      let i = 0;
      while (i < sortedDays.length) {
         let j = i;
         while (j < sortedDays.length - 1) {
            const curr = sortedDays[j] == "0" ? 7 : parseInt(sortedDays[j]);
            const next = sortedDays[j + 1] == "0" ? 7 : parseInt(sortedDays[j + 1]);
            if (next === curr + 1) j++;
            else break;
         }
         const diff = j - i;
         if (diff >= 2) parts.push(`${daysMapShort[sortedDays[i]]} - ${daysMapShort[sortedDays[j]]}`);
         else if (diff === 1) parts.push(`${daysMapShort[sortedDays[i]]} i ${daysMapShort[sortedDays[j]]}`);
         else parts.push(daysMapShort[sortedDays[i]]);
         i = j + 1;
      }

      const dayString = (sortedDays.length === 1 && sortedTimeKeys.length === 1) ? daysMapFull[sortedDays[0]] : parts.join(", ");
      return `${dayString} ${timeKey}`;
   }).join(" | ");
}

function podcastLists(targetPodcasts) {
    if (!targetPodcasts) {
        console.warn("Brak danych podcastu");
        return;
    }

    const fn = targetPodcasts.function;
    const args = targetPodcasts.argument;

    if (!fn) {
        console.warn("Brak nazwy funkcji podcastu");
        return;
    }

    if (typeof window[fn] !== "function") {
        console.warn("Nie znaleziono funkcji:", fn);
        return;
    }

    if (Array.isArray(args)) {
        return window[fn](...args);
    }

    return window[fn](args);
}

async function uruchomPodcast() {
   const params = new URLSearchParams(window.location.search);
   const uid = params.get('uid');
   const station = params.get('st');
   const now = NowZone();
   const localIsoToday = now.toLocaleDateString('sv-SE');
   
   if (!uid || !station) {
      document.body.innerHTML = "Błąd: Brak parametrów 'uid' lub 'st' w adresie URL.";
      document.title = window.location.href;
      return;
   }

   try {
      // Uniwersalna funkcja pobierania JSON
      const fetchJSON = async (fileName) => {
         const url = fileName.startsWith("http")
            ? fileName
            : `https://krdrtradio.github.io/media/json/${station}_${fileName}.json`;

         try {
            const res = await fetch(url);

            if (!res.ok) {
               console.warn("Nie znaleziono pliku:", url);
               return fileName.includes('config') ? {} : [];
            }

            const data = await res.json();

            // CONFIG może być obiektem albo tablicą z jednym elementem
            if (fileName.includes('config')) {
               return (Array.isArray(data) ? data[0] : data) || {};
            }

            // Pozostałe dane zawsze jako tablica
            return Array.isArray(data) ? data : [];

         } catch (e) {
            console.error("Błąd pobierania JSON:", url, e);
            return fileName.includes('config') ? {} : [];
         }
      };

      // Wywołanie w Promise.all pozostaje bez zmian:
      const [PODCASTS, CONFIG, SCHEDULE_DATA] = await Promise.all([
         fetchJSON('podcasts'),
         fetchJSON('config'),
         fetchJSON(`https://krdrtradio.github.io/radios/json/${station}_schedule.json`)
      ]);

      const podcast = PODCASTS.find(p => p.id === uid);

      if (!podcast || podcast.delete === true || CONFIG.disable_podcasts_info) {
         document.body.innerHTML = "Nie znaleziono podcastu o ID: " + uid;
         document.title = window.location.href;
      }
      
      if (podcast.private === true) {
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

      // Obliczenia aktualnego dnia
      const todayWeekStats = MonthWeekCalculator(localIsoToday);


      // Pobranie aktywnego bloku harmonogramu
      const activeBlock = getActiveScheduleBlock(
         now,
         Array.isArray(SCHEDULE_DATA) ? SCHEDULE_DATA : []
      );


      const scheduleSource = activeBlock?.schedule || [];


      // Informacja o emisji
      const scheduleInfo = getDisplaySchedule(
         podcast.schedule_onair || podcast.uid,
         Array.isArray(SCHEDULE_DATA) ? SCHEDULE_DATA : []
      );
      
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
      const thumb_metaT = podcast.thumbnail_uri ? 'https://' + podcast.thumbnail_uri : '';
      const thumb_meta = thumb ? '' : thumb_metaT;
      const desc_meta = podcast.meta_description ? podcast.meta_description : podcast.description;

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
         .filter(cfg => podcast[cfg.key])
         .map(cfg => `<a href="${podcast[cfg.key]}" target="_blank"><i class="${cfg.icon}"></i></a>`)
         .join('\n');

      // 4. Budowanie treści (Zmienione na document.documentElement.innerHTML)
      const fullHTML = `<!DOCTYPE html>
            <html lang="pl">
                <head>
                    <meta charset="UTF-8">
                    <meta name='robots' content='noindex, follow' />
                    <title>${escapeHTML(podcast.meta_title ? podcast.meta_title : podcast.name)} | KrdrtRadio</title>
                    <meta name="description" content="${escapeHTML(HTMLStripper(desc_meta))}"/>
                    <meta property="og:title" content="${escapeHTML(podcast.meta_title ? podcast.meta_title : podcast.name)}"/>
                    <meta property="og:type" content="website"/>
                    <meta property="og:url" content="https://krdrtradio.github.io/media/podcast?uid=${uid}&st=${station}"/>
                    <meta property="og:image" content="${thumb_meta || 'https://i.ibb.co/ZpKQJtGC/broadcast_default_plug.png'}"/>
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
                                <div class="podcast_info_title">${escapeHTML(podcast.name)}</div>
                                <div class="podcast_info_box">
                                    <div class="podcast_info_cover">${thumbnailText}</div>
                                    <div class="podcast_info_data">
                                        ${podcast.onair ? `<div class="podcast_info_airtime">${escapeHTML(podcast.onair)}</div>` : ""}
                                        ${podcast.label ? `<div class="podcast_info_producter"><small>Wydawca:</small><br>${escapeHTML(podcast.label)}</div>` : ""}
                                        ${emailContact ? `<div class="podcast_info_email"><small>E-mail:</small><br>${emailContact}</div>` : ""}
                                        <div class="podcast_info_djs"><small>Prowadzący:</small><br>${escapeHTML(occurrencesHostA)}</div>
                                    </div>
                                </div>
                                <div class="podcast_info_desc">${podcast.description || "Brak opisu podcastu."}</div>
                                <div class="podcast_info_urls">${socialUrlsHtml}</div>
                                ${scheduleInfo ? `<div class="podcast_info_onairs">Na antenie:</div>` : ""}
                                ${scheduleInfo ? `<div class="podcast_info_onairs_list">${scheduleInfo}</div>` : ""}
                                ${podcastList}
                            </section>
                            <script src="https://krdrtradio.github.io/site-bottom.js"><\/script>
                        </main>
                    </div>
                    <script src="https://krdrtradio.github.io/script.js"><\/script>
                    <script src="https://krdrtradio.github.io/script-def.js"><\/script>
                    <script src="https://krdrtradio.github.io/media/site-episode.js"><\/script>
                    <script src="https://krdrtradio.github.io/media/site-audio.js"><\/script>
                </body>
            </html>`;
      // Podmiana całej strony
      document.open();
      document.write(fullHTML);
      document.close();
      // 👉 WAŻNE: inicjalizacja po renderze
      setTimeout(() => {
         startPodcastEngine(podcast.podcast);
         podcastLists(podcast.podcast);
         bindLoadMoreButton();
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
