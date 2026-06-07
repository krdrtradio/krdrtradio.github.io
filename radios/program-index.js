function NowZone(...args) {
   return new Date(
      new Date(...args).toLocaleString("sv-SE", {
         timeZone: "Europe/Warsaw"
      })
   );
}

const MonthWeekCalculator = (dateInput, requestedWeeks) => {
   const date = new Date(dateInput);
   const day = date.getDate();
   const month = date.getMonth();
   const year = date.getFullYear();
   const daysInMonth = new Date(year, month + 1, 0).getDate();

   const getWeekByStartDay = (currentDay, targetDayIdx, reverse = false) => {
      if (!reverse) {
         const firstOfMonth = new Date(year, month, 1).getDay();
         const offset = (firstOfMonth - targetDayIdx + 7) % 7;
         return Math.ceil((currentDay + offset) / 7);
      } else {
         const lastOfMonth = new Date(year, month, daysInMonth).getDay();
         const distFromEnd = daysInMonth - currentDay + 1;
         const offset = (targetDayIdx - lastOfMonth + 7) % 7;
         return Math.ceil((distFromEnd + offset) / 7);
      }
   };

   const firstMon = getWeekByStartDay(day, 1);
   const calculations = {
      dayGroup: Math.ceil(day / 7),
      lastDayGroup: Math.ceil((daysInMonth - day + 1) / 7),
      firstSunday: getWeekByStartDay(day, 0),
      firstMonday: firstMon,
      firstTuesday: getWeekByStartDay(day, 2),
      firstWednesday: getWeekByStartDay(day, 3),
      firstThursday: getWeekByStartDay(day, 4),
      firstFriday: getWeekByStartDay(day, 5),
      firstSaturday: getWeekByStartDay(day, 6),
      lastSunday: getWeekByStartDay(0, true),
      lastMonday: getWeekByStartDay(1, true),
      lastTuesday: getWeekByStartDay(2, true),
      lastWednesday: getWeekByStartDay(3, true),
      lastThursday: getWeekByStartDay(4, true),
      lastFriday: getWeekByStartDay(5, true),
      lastSaturday: getWeekByStartDay(6, true)
   };

   // --- Obiczenia ciągłego cyklu dla mod2 do mod16 ---
   // Punkt odniesienia: Poniedziałek 22.12.2025 (wszystkie mody zwracają max wartość)
   const baseDate = new Date(2025, 11, 22); 
   
   // Obliczamy bezwzględną różnicę tygodni
   const diffTime = date - baseDate;
   const weeksPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));

   // Generowanie ciągłych modów
   for (let i = 2; i <= 16; i++) {
      // Bezpieczne modulo dla liczb dodatnich i ujemnych
      let modValue = (weeksPassed % i + i) % i;
      
      // Mapowanie wartości 0 na maksymalny dzielnik cyklu (np. dla i=3: zamiast 0 zwraca 3)
      calculations[`mod${i}`] = modValue === 0 ? i : modValue;
   }

   // --- Logika zwracania wyników ---
   if (typeof requestedWeeks === 'string') {
      return calculations[requestedWeeks];
   }

   if (Array.isArray(requestedWeeks)) {
      return requestedWeeks.reduce((acc, key) => {
         if (key in calculations) acc[key] = calculations[key];
         return acc;
      }, {});
   }

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
      lastSunday: "ostatnia niedziela miesiąca"
   };

   const timeGroups = {};
   const firstAppearance = {};
   const now = NowZone();

   const activeBlock = getActiveScheduleBlock(now, rawSchedule);
   const scheduleSource = activeBlock ? (activeBlock.schedule || []) : [];

   const filtered = scheduleSource.filter(p => {
      if (p.id !== programId || !p.active || p.private || p.hide_in_schedule) return false;
      return p.publish_from_date ? now >= new Date(p.publish_from_date) : true;
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

            if (key.startsWith('mod')) {
               const num = key.replace('mod', '');
               label = `co ${num} tyg. (cykl ${val})`;
            } else if (labelMap[key]) {
               label = `${val}. ${labelMap[key]}`;
            }

            if (label) suffixes.push(isExclude ? `oprócz: ${label}` : label);
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

/** 
 * GŁÓWNA FUNKCJA URUCHAMIAJĄCA
 */
async function uruchomProgram() {
   const params = new URLSearchParams(window.location.search);
   const uid = params.get('uid');
   const station = params.get('st');
   const now = NowZone();
   const localIsoToday = now.toLocaleDateString('sv-SE');

   if (!uid || !station) {
      document.body.innerHTML = "Błąd parametrów.";
      return;
   }

   try {
      const fetchJSON = async (suffix) => {
         const res = await fetch(`https://krdrtradio.github.io/radios/json/${station}_${suffix}.json`);
         if (!res.ok) return suffix === 'config' ? {} : [];
         return await res.json();
      };

      // 1. Pobieranie danych
      const [PROGRAMS, SCHEDULE_DATA, CONFIG_RAW] = await Promise.all([
         fetchJSON('programs'), fetchJSON('schedule'), fetchJSON('config')
      ]);
      const CONFIG = Array.isArray(CONFIG_RAW) ? CONFIG_RAW[0] : CONFIG_RAW;

      const program = PROGRAMS.find(p => p.id === uid);
      if (!program || program.hide_in_schedule || program.private) {
         // Używamy ?. aby uniknąć błędu, jeśli program jest undefined
         const redirectUrl = program?.url_immediately_with_private;

         if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
         } else {
            document.body.innerHTML = `Nie znaleziono programu o ID: ${uid}`; // Program niedostępny.
            document.title = window.location.href;
            return;
         }
      }

      if (CONFIG.disable_programs_info) {
         const redirectUrl = program?.url_immediately_with_private;

         if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
         } else {
            document.body.innerHTML = `Nie znaleziono programu o ID: ${uid}`; // Program niedostępny.
            document.title = window.location.href;
            // console.log("Informacje o programie są wyłączone w konfiguracji.");
            // Tutaj możesz np. ukryć konkretny kontener w DOM zamiast blokować skrypt
            return;
         }
      }

      if (program.url_immediately) {
         window.location.href = program.url_immediately;
         return;
      }

      // 2. Obliczanie statystyk tygodnia
      const todayWeekStats = MonthWeekCalculator(localIsoToday);

      // 3. Pobranie aktywnego bloku harmonogramu
      const activeBlock = getActiveScheduleBlock(now, SCHEDULE_DATA);
      const scheduleSource = activeBlock ? activeBlock.schedule : [];

      // 4. Logika emisji i prowadzących (filtrowanie na podstawie AKTUALNEGO bloku)
      const occurrencesSch = scheduleSource.filter(osch => {
         if (osch.id !== uid || !osch.active || osch.private || osch.hide_in_schedule) return false;

         // Tygodnie/Mody
         if (osch.weekmonth) {
            const keys = Object.keys(osch.weekmonth);
            if (!keys.every(k => todayWeekStats[k] === osch.weekmonth[k])) return false;
         }

         // Wykluczenia
         if (osch.weekmonth_exclude) {
            const exKeys = Object.keys(osch.weekmonth_exclude);
            if (exKeys.every(k => todayWeekStats[k] === osch.weekmonth_exclude[k])) return false;
         }

         return osch.publish_from_date ? now >= new Date(osch.publish_from_date) : true;
      });

      // 5. Pobranie pełnego napisu harmonogramu (z wszystkich bloków)
      const scheduleInfo = getDisplaySchedule(uid, SCHEDULE_DATA);

      if (program.hide_only_information_schedule && occurrencesSch.length === 0) {
         const redirectUrl = program?.url_immediately_with_private;

         if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
         } else {
            document.body.innerHTML = `Nie znaleziono programu o ID: ${uid}`; // Brak planowanych emisji
            document.title = window.location.href;
            return;
         }
      }

      // Prowadzący
      const occurrencesHost = [...new Set(occurrencesSch.map(o => o.host).filter(h => h))];
      const hostToDisplay = program.only_the_schedule_hosts ?
         (occurrencesHost.length > 0 ? occurrencesHost.join(', ') : "---") :
         (program.host || "---");

      // 3. Renderowanie HTML
      const escapeHTML = (str) =>
         str ? String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
         } [m])) : "";

      const thumb = program.thumbnail_text;
      const style = thumb ? `background:${thumb.background || ''};color:${thumb.color || ''}` : '';
      const thumbnailText = thumb ?
         `<div class="podcast_info_name_box" style="${style}">${escapeHTML(thumb.name || program.name)}</div>` :
         (program.thumbnail_uri ? `<img src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent('https://' + program.thumbnail_uri)}&w=500&h=500&q=75&d=1" alt="${escapeHTML(program.name)}">` : "");

      const emailContact = Array.isArray(program.email) ? 
         program.email.map(t => `<a href="mailto:${t}">${escapeHTML(t)}</a>`).join(', ') :
         typeof program.email === 'string' && program.email.trim() !== '' ? `<a href="mailto:${program.email}">${escapeHTML(program.email)}</a>` : '';

      const podcastList = (program.podcast) ? `
          <audio controls="" id="player" style="display:none;margin-top:10px;margin-left:25px;"><source src=""></audio>
          <div class="podcast_list_episode">
          <h3>Lista odcinków podcastu:</h3>
          <div id="episode-list">Ładowanie odcinków...</div>
          <button id="load-more-btn" style="display:none;">Załaduj więcej</button>
          </div>` : '';

      // Definicja ikon społecznościowych dla pętli
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
         .filter(cfg => program[cfg.key])
         .map(cfg => `<a href="${program[cfg.key]}" target="_blank"><i class="${cfg.icon}"></i></a>`)
         .join('\n');

      const fullHTML = `<!DOCTYPE html>
            <html lang="pl">
                <head>
                    <meta charset="UTF-8">
                    <meta name='robots' content='noindex, follow' />
                    <title>${escapeHTML(program.name)} | KrdrtRadio</title>
                    <script src="https://krdrtradio.github.io/site-head.js"><\/script>
                    <link rel="stylesheet" href="https://krdrtradio.github.io/style-def.css">
                    <link rel="stylesheet" href="https://krdrtradio.github.io/radios/radios.css">
                    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"><\/script>
                </head>
                <body>
                    <div>
                        <script src="https://krdrtradio.github.io/site-top.js"><\/script>
                        <div class="overlay" id="overlay"></div>
                        <main class="main-content">
                            <script src="https://krdrtradio.github.io/site-tophead.js"><\/script>
                            <section>
                                <div class="program_info_title">${escapeHTML(program.name)}</div>
                                <div class="program_info_box">
                                    <div class="program_info_cover">${thumbnailText}</div>
                                    <div class="program_info_data">
                                        ${program.onair ? `<div class="program_info_airtime">${escapeHTML(program.onair)}</div>` : ""}
                                        ${program.label ? `<div class="program_info_producter">Wydawca: ${escapeHTML(program.label)}</div>` : ""}
                                        ${emailContact ? `<div class="program_info_email">E-mail: ${emailContact}</div>` : ""}
                                        <div class="program_info_djs"><small>Prowadzący:</small><br>${escapeHTML(hostToDisplay)}</div>
                                    </div>
                                </div>
                                <div class="program_info_desc">${program.description || "Brak opisu programu."}</div>
                                <div class="program_info_urls">
                                    ${socialUrlsHtml}
                                </div>
                                ${scheduleInfo ? `<div class="program_info_onairs">Na antenie:</div>` : ""}
                                ${scheduleInfo ? `<div class="program_info_onairs_list">${scheduleInfo}</div>` : ""}
                                ${podcastList}
                            </section>
                            <script src="https://krdrtradio.github.io/site-bottom.js"><\/script>
                        </main>
                    </div>
                    <script src="https://krdrtradio.github.io/script.js"><\/script>
                    <script src="https://krdrtradio.github.io/script-def.js"><\/script>
                    <script src="https://krdrtradio.github.io/media/site-episode.js"><\/script>
                    <script src="https://krdrtradio.github.io/media/site-audio.js"><\/script>
                    ${program.podcast ? `<script>${program.podcast}<\/script>` : ""}
                </body>
            </html>`;
      document.open();
      document.write(fullHTML);
      document.close();
      // 👉 WAŻNE: inicjalizacja po renderze
      setTimeout(() => {
         bindLoadMoreButton();
         startPodcastEngine(program.podcast);
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
uruchomProgram();
