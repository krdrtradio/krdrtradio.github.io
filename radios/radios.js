let hlsInstance = null;
let SITE_ID = null;
let CURRENT_STATION = null;
let CURRENT_STATION_ID = null;
let SCHEDULE_APP = null;
let playlistInterval = null;

const dayOrder = ["1", "2", "3", "4", "5", "6", "0"];

const dayNames = {
   "1": "Poniedziałek",
   "2": "Wtorek",
   "3": "Środa",
   "4": "Czwartek",
   "5": "Piątek",
   "6": "Sobota",
   "0": "Niedziela"
};

let PROGRAMS = [],
   IMAGES = [],
   SCHEDULE = [],
   SCHEDULEDETAIL = [],
   STATIONS = [],
   CONFIG = [];

function NowZone(value = new Date()) {
   return new Date(
      new Date(value).toLocaleString("sv-SE", {
         timeZone: "Europe/Warsaw"
      })
   );
}

let lastDay = NowZone().getDay();

// =====================
// LOAD
// =====================
async function loadData(siteId) {
   const baseUrl = `https://krdrtradio.github.io/radios/json/${siteId}`;
   SITE_ID = siteId;

   // Helper z rozszerzoną diagnostyką
   const fetchJson = async (suffix) => {
      try {
         const response = await fetch(`${baseUrl}_${suffix}.json`);
         if (!response.ok) throw new Error(`Status: ${response.status}`);
         return await response.json();
      } catch (err) {
         console.warn(`⚠️ Błąd ładowania ${suffix}:`, err.message);
         return null;
      }
   };

   try {
      const [images, programs, schedule, scheduledetail, stations, config] = await Promise.all([
         fetchJson("images"),
         fetchJson("programs"),
         fetchJson("schedule"),
         fetchJson("scheduledetail"),
         fetchJson("station"),
         fetchJson("config")
      ]);

      // ✅ Mapowanie z zabezpieczeniem typów
      IMAGES = images || [];
      PROGRAMS = programs || [];

      // Obsługa SCHEDULE (sprawdza czy to tablica)
      SCHEDULE = Array.isArray(schedule) ? schedule : [];

      // Obsługa SCHEDULEDETAIL
      SCHEDULEDETAIL = Array.isArray(scheduledetail) ? scheduledetail : [];

      // ✅ KLUCZOWE: STATIONS często ma strukturę { station: [...] }
      if (stations && stations.station) {
         STATIONS = stations.station;
      } else if (Array.isArray(stations)) {
         STATIONS = stations;
      } else {
         STATIONS = [];
      }

      // Obsługa CONFIG
      CONFIG = (Array.isArray(config) ? config[0] : config) || {};

      console.log("✅ Dane załadowane pomyślnie. Stacji:", STATIONS.length);

      // Inicjalizacja widoku po załadowaniu
      if (typeof renderSchedules === "function") renderSchedules();
      if (typeof renderCurrent === "function") renderCurrent();

   } catch (error) {
      console.error("❌ Krytyczny błąd loadData:", error);
   }
}

// =====================
// HELPERS
// =====================
// ✅ POPRAWIONE: Domknięcie funkcji escapeHTML
const escapeHTML = (str) =>
   str ? String(str).replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
   } [m])) : "";

// ✅ POPRAWIONE: Zabezpieczenie przed pusta wartością (undefined/null)
function formatHour(h) {
   if (!h) return "";
   return h.slice(0, 5);
}

const MonthWeekCalculator = (dateInput, requestedWeeks) => {
   const date = NowZone(dateInput);
   // Walidacja daty
   if (isNaN(date.getTime())) return null;

   const day = date.getDate();
   const month = date.getMonth();
   const year = date.getFullYear();
   const daysInMonth = NowZone(year, month + 1, 0).getDate();

   // Pomocnicza funkcja do obliczeń
   const getWeekByStartDay = (targetDayIdx, reverse = false) => {
      if (!reverse) {
         const firstOfMonth = NowZone(year, month, 1).getDay();
         const offset = (firstOfMonth - targetDayIdx + 7) % 7;
         return Math.ceil((day + offset) / 7);
      } else {
         const lastOfMonth = NowZone(year, month, daysInMonth).getDay();
         const distFromEnd = daysInMonth - day + 1;
         const offset = (targetDayIdx - lastOfMonth + 7) % 7;
         return Math.ceil((distFromEnd + offset) / 7);
      }
   };

   // Obiekt z leniwym ładowaniem lub pełny wynik
   const calculations = {
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
      lastMonday: getWeekByStartDay(1, true)
   };

   // Generowanie modów
   for (let i = 2; i <= 16; i++) {
      calculations[`mod${i}`] = ((calculations.dayGroup - 1) % i) + 1;
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

// ✅ Zarządzanie zakładkami (Ramówka / Programy)
function openTab(evt, tabName) {
   document.querySelectorAll(".tabcontent").forEach(el => el.style.display = "none");
   document.querySelectorAll(".tablinks").forEach(el => el.classList.remove("active"));

   const targetTab = document.getElementById(tabName);
   if (targetTab) targetTab.style.display = "block";

   if (evt && evt.currentTarget) {
      evt.currentTarget.classList.add("active");
   }

   // Jeśli otwieramy szczegółową listę, odświeżamy ją
   if (tabName === 'sch_detail') renderSDetails();
}

function openDayTab(event, dayId) {
   // 1. Ukryj wszystkie listy dni
   document.querySelectorAll(".schedule_list").forEach(el => {
      el.style.display = "none";
   });

   // 2. Usuń klasę active ze wszystkich przycisków dni
   document.querySelectorAll(".day_tablinks").forEach(btn => {
      btn.classList.remove("active");
   });

   // 3. Pokaż wybraną listę
   const selectedTab = document.getElementById("day_" + dayId);
   if (selectedTab) {
      selectedTab.style.display = "block";
   }

   // 4. Dodaj klasę active do klikniętego przycisku
   if (event && event.currentTarget) {
      event.currentTarget.classList.add("active");
   }

   // 5. Odśwież statusy ON AIR dla nowo pokazanego dnia
   if (typeof updateOnAirStatus === "function") {
      updateOnAirStatus();
   }
}

// ✅ Sprawdzanie zakresu czasu (obsługa audycji nocnych)
function isInTimeRange(start, end, current) {
   if (!start || !end) return false;
   if (start <= end) {
      return current >= start && current < end;
   } else {
      // Przejście przez północ: current musi być PO starcie LUB PRZED końcem
      return current >= start || current < end;
   }
}

function getActiveScheduleBlock(date = NowZone()) {
   return SCHEDULE.find(block => {
      if (!block.startDate || !block.EndDate) return false;
      return date >= NowZone(block.startDate) && date <= NowZone(block.EndDate);
   }) || SCHEDULE.find(b => b.scheduleID === 0) || {
      schedule: []
   };
}

// ✅ Pobieranie rozszerzonych danych o programie
function getProgramData(p) {
   if (!p) return {};
   // Szukamy w stałej bazie PROGRAMS po ID
   const found = PROGRAMS.find(x => x.id === p.id);
   // Zwracamy znalezione dane lub sam obiekt p (zabezpieczone przed null)
   return found || p || {};
}

// ✅ POPRAWIONE OBRAZKI (Zgodnie z Twoją strukturą IMAGES)
function getThumbnail(p, data) {
   // 1. Sprawdź thumbnail_id w programie lub danych bazowych
   const tId = p.thumbnail_id || (data && data.thumbnail_id);
   if (tId) {
      // Szukamy w załadowanej liście obrazków
      const img = IMAGES.find(i => i.id === tId || i.thumbnail_id === tId);
      if (img) return img.url || img.thumbnail_uri;
   }

   // 2. Sprawdź bezpośrednie linki uri w obiektach
   if (p.thumbnail_uri) return p.thumbnail_uri;
   if (data && data.thumbnail_uri) return data.thumbnail_uri;
   // if (p.cover) return p.cover;

   // 3. Fallback: Jeśli nic nie ma, zwróć cover aktualnej stacji
   // const station = STATIONS.find(s => s.id === CURRENT_STATION_ID);
   // return station ? station.cover : null;
}

// =====================
// ON AIR
// =====================
function renderCurrent() {
   const now = NowZone();
   const currentTime = now.toTimeString().slice(0, 8);
   const currentDay = now.getDay().toString();
   const yesterday = (now.getDay() === 0 ? 6 : now.getDay() - 1).toString();

   const localIsoToday = now.toLocaleDateString('sv-SE');
   const yesterdayDate = NowZone(now);
   yesterdayDate.setDate(now.getDate() - 1);
   const localIsoYesterday = yesterdayDate.toLocaleDateString('sv-SE');

   const station = STATIONS.find(x => x.id === CURRENT_STATION_ID);
   if (!station) return;

   // 1. OBSŁUGA PLUGÓW / API ZEWNĘTRZNYCH
   if (station.schedule && !station.radio_plug && !station.radio_listen && (!CONFIG || !CONFIG.radio_plug)) {
      scheduleCurrent(station.schedule);
      if (typeof SCHEDULE_APP !== 'undefined' && SCHEDULE_APP === 1) return;
   }

   // 2. LOGIKA FILTROWANIA RAMÓWKI
   const activeBlock = getActiveScheduleBlock(now);
   const scheduleSource = activeBlock ? activeBlock.schedule : [];

   const filtered = scheduleSource.filter(p => {
      if (!p.active) return false;
      if (p.publish_from_date && now < NowZone(p.publish_from_date)) return false;

      // Sprawdzenie stacji
      const isForStation = (!p.station || p.station.includes(CURRENT_STATION_ID)) &&
         !p.station_exclude?.includes(CURRENT_STATION_ID);
      if (!isForStation) return false;

      let timeMatch = false;
      let dateToUse = localIsoToday;

      const isMidnight = p.midnight === true;
      const crossesMidnight = p.hour_start > p.hour_end;

      // A. Programy nocne
      if (isMidnight) {
         if (p.days.includes(currentDay)) {
            if (currentTime >= p.hour_start && currentTime < p.hour_end) {
               timeMatch = true;
               dateToUse = localIsoToday;
            }
         }
      }
      // B. Programy przechodzące przez północ
      else if (crossesMidnight) {
         if (p.days.includes(yesterday) && currentTime < p.hour_end) {
            timeMatch = true;
            dateToUse = localIsoYesterday;
         } else if (p.days.includes(currentDay) && currentTime >= p.hour_start) {
            timeMatch = true;
            dateToUse = localIsoToday;
         }
      }
      // C. Standardowe audycje dzienne
      else if (p.days.includes(currentDay)) {
         if (currentTime >= p.hour_start && currentTime < p.hour_end) {
            timeMatch = true;
            dateToUse = localIsoToday;
         }
      }

      if (!timeMatch) return false;

      // Weryfikacja tygodnia (MOD2 / DayGroup)
      if (p.weekmonth) {
         const keys = Object.keys(p.weekmonth);
         const stats = MonthWeekCalculator(dateToUse, keys);
         if (!keys.every(k => stats[k] === p.weekmonth[k])) return false;
      }

      if (p.weekmonth_exclude) {
         const exKeys = Object.keys(p.weekmonth_exclude);
         const exStats = MonthWeekCalculator(dateToUse, exKeys);
         if (exKeys.every(k => exStats[k] === p.weekmonth_exclude[k])) return false;
      }

      return true;
   });

   // 3. ZAAWANSOWANE SORTOWANIE (Wybór najważniejszego programu)
   filtered.sort((a, b) => {
      const dataA = getProgramData(a);
      const dataB = getProgramData(b);

      const getScore = (item) => {
         let score = 0;
         if (item.station) score += 10; // Priorytet 1: Konkretna stacja
         if (item.weekmonth) score += 5; // Priorytet 2: Rotacja (mod2)
         if (item.subschedule) score += 2; // Priorytet 3: Subschedule
         return score;
      };

      const scoreA = getScore(a);
      const scoreB = getScore(b);

      if (scoreA !== scoreB) return scoreB - scoreA;

      // Jeśli punkty równe, wybierz ten, który zaczął się później
      if (a.hour_start !== b.hour_start) {
         return (b.hour_start || "").localeCompare(a.hour_start || "");
      }

      return (a.name || dataA.name || "").localeCompare(b.name || dataB.name || "");
   });

   const program = filtered[0];

   // 4. RENDEROWANIE DO UI
   const ui = {
      item: document.querySelector(".current_program_item"),
      hour: document.querySelector(".current_program_hour"),
      title: document.querySelector(".current_program_title"),
      host: document.querySelector(".current_program_host"),
      photo: document.querySelector(".current_program_photo")
   };

   // 3. WIDOK DOMYŚLNY (RADIO ONLINE / PLUG)
   if (!program || station.radio_plug || station.radio_listen === true || (typeof CONFIG !== 'undefined' && CONFIG.radio_plug)) {
      if (ui.item) ui.item.textContent = "";
      if (ui.hour) ui.hour.textContent = "";
      if (ui.title) {
         ui.title.style.fontWeight = '400';
         ui.title.textContent = station.plug_name || station.name || "Radio Online";
      }
      if (ui.host) ui.host.textContent = "";
      if (ui.photo) ui.photo.innerHTML = `<img decoding="async" src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent('https://' + station.cover)}&w=500&h=500&q=75&d=1" alt="${escapeHTML(station.plug_name) || escapeHTML(station.name) || "Logo Stacji"}">`;
      return;
   }

   // 4. RENDEROWANIE AKTUALNEGO PROGRAMU
   const data = getProgramData(program);
   const thumb = program.thumbnail_text || data.thumbnail_text;
   const thumbnail = getThumbnail(program, data);

   // Generowanie HTML dla miniatury (Priorytet: Box tekstowy > Zdjęcie audycji > Logo stacji)
   let thumbnailHTML = "";
   if (thumb) {
      const style = [
         thumb.background ? `background:${thumb.background}` : '',
         thumb.color ? `color:${thumb.color}` : ''
      ].filter(Boolean).join(';');
      thumbnailHTML = `<div class="current_program_box" style="${style}">${thumb.name || program.name || data.name || ""}</div>`;
   } else if (thumbnail) {
      thumbnailHTML = `<img decoding="async" src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent('https://' + thumbnail)}&w=500&h=500&q=75&d=1" alt="${escapeHTML(program.name) || escapeHTML(data.name) || "Cover Audycji"}">`;
   } else {
      thumbnailHTML = `<img decoding="async" src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent('https://' + station.cover)}&w=500&h=500&q=75&d=1" alt="${escapeHTML(program.name) || escapeHTML(data.name) || "Logo Stacji"}">`;
   }

   // Aktualizacja pól tekstowych
   if (ui.item) ui.item.textContent = program.item || "";

   if (ui.hour) {
      const start = program.hour_start ? program.hour_start.slice(0, 5) : "00:00";
      const end = program.hour_end ? program.hour_end.slice(0, 5) : "00:00";
      ui.hour.textContent = `${start} - ${end}`;
   }

   if (ui.title) {
      ui.title.style.fontWeight = '600';
      ui.title.textContent = program.name || data.name || ""; // Audycja
   }

   if (ui.host) {
      ui.host.textContent = program.host || data.host || "";
   }

   if (ui.photo) {
      ui.photo.innerHTML = thumbnailHTML;
   }
}

// =====================
// SCHEDULES
// =====================
function renderSchedules() {
   const tabs = document.getElementById("days");
   const contents = document.getElementById("day_contents");
   const stations = STATIONS.find(x => x.id === CURRENT_STATION_ID);
   if (!tabs || !contents) return;

   tabs.innerHTML = "";
   contents.innerHTML = "";

   const now = NowZone();
   const currentDayIdx = now.getDay();
   const todayStr = currentDayIdx.toString();

   const activeDayTab = todayStr;

   const activeBlock = getActiveScheduleBlock(now);
   const scheduleSource = activeBlock ? activeBlock.schedule : [];

   dayOrder.forEach(day => {
      const dayStr = day.toString();

      const targetDate = NowZone(now);
      const currentAdj = (currentDayIdx === 0) ? 7 : currentDayIdx;
      const targetAdj = (parseInt(day) === 0) ? 7 : parseInt(day);
      const diff = targetAdj - currentAdj;

      targetDate.setDate(now.getDate() + diff);
      const currentTabIsoDate = targetDate.toLocaleDateString('sv-SE');

      const btn = document.createElement("button");
      btn.className = "day_tablinks" + (dayStr === activeDayTab ? " active" : "");
      btn.textContent = dayNames[day];
      btn.onclick = (e) => openDayTab(e, day);

      const tab = document.createElement("div");
      tab.className = "schedule_list";
      tab.id = "day_" + day;
      tab.style.display = (dayStr === activeDayTab) ? "block" : "none";

      // 2. FILTROWANIE RAMÓWKI
      scheduleSource
         .filter(p => {
            const data = getProgramData(p);
            const tomorrow = ((parseInt(day) + 1) % 7).toString();

            // --- FILTR A: Publikacja i Aktywność ---
            const isPublished = p.publish_from_date ? now >= NowZone(p.publish_from_date) : true;
            if (!p.active || !isPublished || data.hide_in_schedule) return false;

            const isAssigned = p.midnight ? p.days.includes(tomorrow) : p.days.includes(dayStr);
            if (!isAssigned) return false;

            // --- FILTR C: Stacja ---
            const isForStation = (!p.station || p.station.includes(CURRENT_STATION_ID)) &&
               !p.station_exclude?.includes(CURRENT_STATION_ID);
            if (!isForStation) return false;

            let dateToCheck = currentTabIsoDate;
            if (p.midnight) {
               const nextDayDate = NowZone(targetDate);
               nextDayDate.setDate(targetDate.getDate() + 1);
               dateToCheck = nextDayDate.toLocaleDateString('sv-SE');
            }

            if (p.weekmonth) {
               const keys = Object.keys(p.weekmonth);
               const stats = MonthWeekCalculator(dateToCheck, keys);
               if (!keys.every(k => stats[k] === p.weekmonth[k])) return false;
            }

            if (p.weekmonth_exclude) {
               const exKeys = Object.keys(p.weekmonth_exclude);
               const exStats = MonthWeekCalculator(dateToCheck, exKeys);
               if (exKeys.every(k => exStats[k] === p.weekmonth_exclude[k])) return false;
            }

            return true;
         })
         .sort((a, b) => {
            const hourA = a.midnight ? "24:" + a.hour_start : a.hour_start;
            const hourB = b.midnight ? "24:" + b.hour_start : b.hour_start;
            return hourA.localeCompare(hourB);
         })
         .forEach(p => {
            const data = getProgramData(p);
            const isProgramsDisabled = stations?.disable_programs_info || (typeof CONFIG !== 'undefined' && CONFIG.disable_programs_info);
            const isPrivate = p.private || data.private;
            const hasNoId = !data.id;
            const thumbnail = getThumbnail(p, data);
            const thumb = p.thumbnail_text || data.thumbnail_text;

            // Miniatura / Box tekstowy
            let thumbnailHTML = "";
            if (thumb) {
               const style = [
                  thumb.background ? `background:${thumb.background}` : '',
                  thumb.color ? `color:${thumb.color}` : ''
               ].filter(Boolean).join(';');
               thumbnailHTML = `<div class="schedule_name_box" style="${style}">${thumb.name || p.name || data.name || ""}</div>`;
            } else if (thumbnail) {
               thumbnailHTML = `<img decoding="async" src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent('https://' + thumbnail)}&w=500&h=500&q=75&d=1" alt="${escapeHTML(p.name) || escapeHTML(data.name) || "cover"}">`;
            } else {
               thumbnailHTML = '';
               // thumbnailHTML = `<img decoding="async" src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent('https://' + stations.cover)}&w=500&h=500&q=75&d=1" alt="logo">`;
            }

            const displayName = p.name || data.name || ""; // Audycja
            const isRestricted = hasNoId || isPrivate || isProgramsDisabled;

            const url = data.url_immediately || `program?uid=${data.id}&st=${SITE_ID}`;
            const urlP = p.url_immediately_with_private || data.url_immediately_with_private;
            const urlNameP = (urlP) ?
               `<div class="schedule_program_name"><a href="${urlP}" target="_blank">${displayName}</a></div>` :
               `<div class="schedule_program_name">${displayName}</div>`;
            const nameHTML = isRestricted ? urlNameP :
               `<div class="schedule_program_name"><a href="${url}" target="_blank">${displayName}</a></div>`;

            const el = document.createElement("div");
            el.className = p.subschedule ? "schedule_program small" : "schedule_program";

            // --- DATASET DLA updateOnAirStatus ---
            if (!isRestricted) {
               el.dataset.uid = data.id; // Używamy data.id, bo to ono trafia do URL
            }
            el.dataset.start = p.hour_start;
            el.dataset.end = p.hour_end;
            el.dataset.midnight = p.midnight ? "true" : "false";

            el.innerHTML = `
               <div class="schedule_program_cover">${thumbnailHTML}</div>
               <div class="schedule_program_content">
                   <div class="schedule_program_item">${p.item || ""}</div>
                   <div class="schedule_program_data">${p.hour_start.slice(0,5)} - ${p.hour_end.slice(0,5)}</div>
                   ${nameHTML}
                   <div class="schedule_program_host">${p.host || data.host || ""}</div>
                   ${p.comment ? `<div class="schedule_program_comment">${p.comment}</div>` : ''}
               </div>
            `;
            tab.appendChild(el);
         });

      tabs.appendChild(btn);
      contents.appendChild(tab);
   });

   // Na końcu uruchamiamy status "Na antenie"
   updateOnAirStatus();
}


function initDefaultTab() {
   const currentDay = NowZone().getDay().toString();
   // Symulujemy kliknięcie lub wywołujemy bezpośrednio dla dzisiejszego dnia
   openTab(null, currentDay);
}

function switchScheduleDay(dayId) {
   document.querySelectorAll('.schedule_list').forEach(el => {
      el.style.display = 'none';
   });
   const selectedDay = document.getElementById(`day_${dayId}`);
   if (selectedDay) selectedDay.style.display = 'block';

   // Opcjonalnie: aktualizacja klasy active na przyciskach menu
   document.querySelectorAll('.day_tab_btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.day === dayId);
   });
}
// =====================
// ON AIR STATUS
// =====================
function updateOnAirStatus() {
   const now = NowZone();
   const currentTime = now.toTimeString().slice(0, 8);
   const currentDay = now.getDay().toString(); // "0" (Niedziela)
   const yesterday = (now.getDay() === 0 ? 6 : now.getDay() - 1).toString(); // "6" (Sobota)
   const localIsoDate = now.toLocaleDateString('sv-SE');

   const station = STATIONS.find(x => x.id === CURRENT_STATION_ID);
   const isRadioPlugActive = station?.radio_plug || (typeof CONFIG !== 'undefined' && CONFIG.radio_plug);

   // 1. Pobierz aktualnie aktywny blok danych
   const activeBlock = getActiveScheduleBlock(now);

   document.querySelectorAll('.schedule_program').forEach(row => {
      // Szybkie wyjście, jeśli radio plug jest aktywne
      if (isRadioPlugActive) {
         row.classList.remove('onair');
         return;
      }

      const {
         start,
         end,
         midnight,
         id
      } = row.dataset;
      if (!start || !end) return;

      const isMidnightType = midnight === "true"; // Flaga decydująca o systemie
      const crossesMidnight = start > end; // Czy audycja trwa np. 23:00 - 06:00
      const dayOfTab = row.closest('.schedule_list').id.replace('day_', '');

      // --- 2. LOGIKA TYGODNIOWA I MOD2 ---
      const prog = activeBlock?.schedule.find(p => p.id === id || (p.hour_start === start && p.hour_end === end));

      if (prog) {
         // const isPublished = prog.publish_from_date ? now >= NowZone(prog.publish_from_date) : true;
         // Usunięto !prog.active - teraz sprawdzamy tylko datę publikacji
         // if (!prog.active || !isPublished) {
         //   row.classList.remove('onair');
         //   return;
         // }
         let dateForMod = localIsoDate;
         if (dayOfTab === yesterday && !isMidnightType && crossesMidnight) {
            // Jeśli to "ogon" audycji 23-06, która nie jest typu midnight, używamy daty wczorajszej
            const yDate = NowZone(now);
            yDate.setDate(now.getDate() - 1);
            dateForMod = yDate.toLocaleDateString('sv-SE');
         }

         // Sprawdź inkluzję weekmonth
         // if (prog.weekmonth) {
         //    const keys = Object.keys(prog.weekmonth);
         //    const stats = MonthWeekCalculator(dateForMod, keys);
         //    if (!keys.every(k => stats[k] === prog.weekmonth[k])) {
         //       row.classList.remove('onair');
         //       return;
         //    }
         // }

         // Sprawdź ekskluzję weekmonth_exclude
         // if (prog.weekmonth_exclude) {
         //    const exKeys = Object.keys(prog.weekmonth_exclude);
         //    const exStats = MonthWeekCalculator(dateForMod, exKeys);
         //    if (exKeys.every(k => exStats[k] === prog.weekmonth_exclude[k])) {
         //       row.classList.remove('onair');
         //       return;
         //    }
         // }
      }
      let isActive = false;
      if (isMidnightType) {
         if (dayOfTab === yesterday) {
            isActive = (currentTime >= start && currentTime < end);
         }
      } else {
         if (dayOfTab === currentDay) {
            if (!crossesMidnight) {
               isActive = (currentTime >= start && currentTime < end);
            } else {
               isActive = (currentTime >= start); // Startuje wieczorem
            }
         }
      }
      if (crossesMidnight) {
         // Sprawdź czy trwa "ogon" audycji w zakładce wczorajszej
         if (dayOfTab === yesterday && currentTime < end) {
            isActive = true;
         }
      }

      // 4. Dodaj lub usuń klasę CSS
      row.classList.toggle('onair', isActive);
   });
}

// =====================
// SCHEDULE DETAIL LIST
// =====================
function renderSDetails() {
   const container = document.getElementById("sdetail_list");
   if (!container) return;

   const now = NowZone();
   const escapeHTML = (str) =>
      str ? String(str).replace(/[&<>"']/g, m => ({
         '&': '&amp;',
         '<': '&lt;',
         '>': '&gt;',
         '"': '&quot;',
         "'": '&#039;'
      } [m])) : "";

   container.innerHTML = "";

   // 1. Znajdź aktywny blok w SCHEDULEDETAIL (np. specjalny zakres dat lub domyślny ID: 0)
   const activeDetailBlock = SCHEDULEDETAIL.find(block => {
      if (!block.startDate || !block.EndDate) return false;
      const start = NowZone(block.startDate);
      const end = NowZone(block.EndDate);
      return now >= start && now <= end;
   }) || SCHEDULEDETAIL.find(block => block.scheduleID === 0);

   // Jeśli nie znaleziono żadnego pasującego bloku danych
   if (!activeDetailBlock || !activeDetailBlock.schedule) {
      container.innerHTML = '<div class="no_detail">Brak dostępnych szczegółów ramówki.</div>';
      return;
   }

   // 2. Renderowanie elementów z wybranego bloku
   activeDetailBlock.schedule
      .filter(p => {
         if (p.active === false) return false;

         // Opcjonalne filtrowanie po stacji
         if (p.station && Array.isArray(p.station)) {
            if (!p.station.includes(CURRENT_STATION_ID)) return false;
         }
         return true;
      })
      .forEach(p => {
         const els = document.createElement("div");
         els.className = "sdetail_list_content";

         // Pobieranie i zabezpieczanie danych
         const name = p.name || "Bez nazwy";
         const host = escapeHTML(p.host || "");
         const onair = escapeHTML(p.onair || "");
         const url = p.url || null;

         const nameHTML = url ?
            `<div class="schedule_detail_name" style="cursor:pointer;"><a href="${url}" target="_blank">${name}</a></div>` :
            `<div class="schedule_detail_name">${name}</div>`;

         els.innerHTML = `
            ${nameHTML}
            ${host ? `<div class="schedule_detail_host">${host}</div>` : ''}
            ${onair ? `<div class="schedule_detail_onair">${onair}</div>` : ''}
         `;
         container.appendChild(els);
      });

   // Fallback, gdyby filtr odrzucił wszystkie audycje w bloku
   if (container.innerHTML === "") {
      container.innerHTML = '<div class="no_detail">Brak audycji dla tej stacji.</div>';
   }
}

// =====================
// PROGRAM LIST
// =====================
function renderPrograms() {
   const container = document.getElementById("program_list");
   const filter = document.getElementById("categoryFilter")?.value || "";
   const search = document.getElementById("searchInput")?.value.toLowerCase() || "";

   if (!container) return;

   // Poprawiona funkcja bezpiecznego escapowania znaków
   const escapeHTML = (str) =>
      str ? String(str).replace(/[&<>"']/g, m => ({
         '&': '&amp;',
         '<': '&lt;',
         '>': '&gt;',
         '"': '&quot;',
         "'": '&#039;'
      } [m])) : "";

   container.innerHTML = "";

   // Pobranie kontekstu czasowego raz, przed pętlą (optymalizacja)
   const now = NowZone();
   const localIsoToday = now.toLocaleDateString('sv-SE');
   const activeBlock = getActiveScheduleBlock(now);
   const scheduleSource = activeBlock ? activeBlock.schedule : [];

   // Pre-kalkulacja statystyk tygodnia dla dzisiejszej daty
   // (używane później do filtrowania wystąpień w harmonogramie)
   const todayWeekStats = MonthWeekCalculator(localIsoToday);

   const filteredPrograms = PROGRAMS
      .filter(p => {
         // Podstawowe filtry widoczności
         if (p.hide_in_program || p.hide_in_schedule || p.private || p.archive || p.hide_only_information_schedule) return false;

         // Filtr stacji
         if (p.station && !p.station.includes(CURRENT_STATION_ID)) return false;

         // Logika kategorii
         if (p.category_not_all && filter === "") return false;
         if (filter !== "" && !(p.category && p.category.includes(filter))) return false;

         // Wyszukiwarka (nazwa lub prowadzący)
         const name = (p.name || "").toLowerCase();
         const host = (p.host || "").toLowerCase();
         return name.includes(search) || host.includes(search);
      })
      .sort((a, b) => {
         const sortA = Array.isArray(a.sorted) ? a.sorted : [a.sorted || ""];
         const sortB = Array.isArray(b.sorted) ? b.sorted : [b.sorted || ""];

         // 1. Porównaj pierwszy element tablicy (np. "0" vs "1")
         const res = sortA[0].toString().localeCompare(sortB[0].toString(), undefined, {
            numeric: true
         });

         // 2. Jeśli pierwsze elementy są identyczne, porównaj drugi element (np. "1" vs "7")
         if (res === 0 && (sortA[1] !== undefined || sortB[1] !== undefined)) {
            const res2 = (sortA[1] || "").toString().localeCompare((sortB[1] || "").toString(), undefined, {
               numeric: true
            });
            if (res2 !== 0) return res2;
         }

         // 3. Jeśli priorytety są identyczne, sortuj alfabetycznie po nazwie
         return res !== 0 ? res : a.name.localeCompare(b.name);
      });

   filteredPrograms.forEach(p => {
      // --- LOGIKA DYNAMICZNYCH PROWADZĄCYCH Z HARMONOGRAMU ---

      // Znajdź wystąpienia programu, które są aktywne "dzisiaj" i spełniają warunki tygodnia
      const activeOccurrences = scheduleSource.filter(osch => {
         if (osch.id !== p.id || !osch.active || osch.private || osch.hide_in_schedule) return false;

         // Sprawdzanie publikacji czasowej
         if (osch.publish_from_date && now < NowZone(osch.publish_from_date)) return false;

         // Logika tygodnia miesiąca (weekmonth)
         if (osch.weekmonth) {
            const keys = Object.keys(osch.weekmonth);
            if (!keys.every(k => todayWeekStats[k] === osch.weekmonth[k])) return false;
         }

         // Logika wykluczeń tygodnia (weekmonth_exclude)
         if (osch.weekmonth_exclude) {
            const exKeys = Object.keys(osch.weekmonth_exclude);
            if (exKeys.every(k => todayWeekStats[k] === osch.weekmonth_exclude[k])) return false;
         }

         return true;
      });

      // Unikalni prowadzący z odfiltrowanego harmonogramu
      const occurrencesHost = [...new Set(activeOccurrences
         .map(osch => osch.host)
         .filter(h => h && h.trim() !== "")
      )];

      // Wybór źródła prowadzących: z harmonogramu lub z bazy programów
      const hostToDisplay = p.only_the_schedule_hosts ?
         (occurrencesHost.length > 0 ? occurrencesHost.join(', ') : "") :
         (p.host || "");

      // --- GENEROWANIE MINIATURY ---
      let thumbnailHTML = "";
      if (p.thumbnail_text) {
         const thumb = p.thumbnail_text;
         const style = [
            thumb.background ? `background:${thumb.background}` : '',
            thumb.color ? `color:${thumb.color}` : ''
         ].filter(Boolean).join(';');
         thumbnailHTML = `<div class="program_list_box" style="${style}">${escapeHTML(thumb.name || p.name)}</div>`;
      } else if (p.thumbnail_uri) {
         thumbnailHTML = `<img decoding="async" src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent('https://' + p.thumbnail_uri)}&w=500&h=500&q=75&d=1" alt="${escapeHTML(p.name)}">`;
      }

      // --- RENDEROWANIE ELEMENTU ---
      const url = p.url_immediately || `program?uid=${p.id}&st=${SITE_ID}`;

      const el = document.createElement("div");
      el.className = "program_list_content";
      el.dataset.uid = p.id;
      el.innerHTML = `
            <div class="program_list_cover">
                <a href="${url}" target="_blank">${thumbnailHTML}</a>
            </div>
            <div class="program_list_info">
                <div class="program_list_name">
                    <a href="${url}" target="_blank">${escapeHTML(p.name)}</a>
                </div>
                <div class="program_list_host">${escapeHTML(hostToDisplay)}</div>
                <div class="program_list_onair">${escapeHTML(p.onair || "")}</div>
            </div>
        `;

      container.appendChild(el);
   });
}
// =====================
// STATIONS
// =====================
function ButtonsSites(s) {
   const container = document.getElementById("site_buttons_list");
   if (!container) return;

   // Pomocnicza funkcja, aby nie powtarzać logiki sprawdzania linku
   const getBtn = (link, html) => link ? html : '';

   const butWebLive = getBtn(s.button_web_live || CONFIG.button_web_live,
      `<a target="_blank" href="${s.button_web_live || CONFIG.button_web_live}" class="btn-link"><i class="fa-solid fa-tower-broadcast"></i> Słuchaj na YT</a>`);

   const butWebRadioOnline = getBtn(s.button_web_radioonline || CONFIG.button_web_radioonline,
      `<a target="_blank" href="${s.button_web_radioonline || CONFIG.button_web_radioonline}" class="btn-link">💡 Online</a>`);

   const butWebSite = getBtn(s.button_web_site || CONFIG.button_web_site,
      `<a target="_blank" href="${s.button_web_site || CONFIG.button_web_site}" class="btn-link">🌐 Strona</a>`);

   const butWebOtherSite = getBtn(s.button_web_othersite_url || CONFIG.button_web_othersite_url,
      `<a target="_blank" href="${s.button_web_othersite_url || CONFIG.button_web_othersite_url}" class="btn-link">🌐 Strona (${s.button_web_othersite_name || CONFIG.button_web_othersite_name})</a>`);

   const butWebPrograms = getBtn(s.button_web_programs || CONFIG.button_web_programs,
      `<a target="_blank" href="${s.button_web_programs || CONFIG.button_web_programs}" class="btn-link">📻 Programy</a>`);

   const butWebPodcasts = getBtn(s.button_web_podcast || CONFIG.button_web_podcast,
      `<a target="_blank" href="${s.button_web_podcast || CONFIG.button_web_podcast}" class="btn-link"><i class="fa-solid fa-podcast"></i> Podcasty</a>`);

   const butWebPlayer = getBtn(s.button_web_player || CONFIG.button_web_player,
      `<a target="_blank" href="${s.button_web_player || CONFIG.button_web_player}" class="btn-link">► Player</a>`);

   const butWebSchedule = getBtn(s.button_web_schedule || CONFIG.button_web_schedule,
      `<a target="_blank" href="${s.button_web_schedule || CONFIG.button_web_schedule}" class="btn-link">📅 Ramówka</a>`);

   const butMediaSite = getBtn(s.button_media_site || CONFIG.button_media_site,
      `<a target="_blank" href="${s.button_media_site || CONFIG.button_media_site}" class="btn-link accent"><i class="fa-solid fa-photo-film"></i> Media</a>`);

   const butMediaOtherRadio = getBtn(s.button_media_otherradio_url || CONFIG.button_media_otherradio_url,
      `<a target="_blank" href="${s.button_media_otherradio_url || CONFIG.button_media_otherradio_url}" class="btn-link accent"><i class="fa-solid fa-radio"></i> ${s.button_media_otherradio_name || CONFIG.button_media_otherradio_name}</a>`);

   container.innerHTML = `
        ${butWebLive}
        ${butWebRadioOnline}
        ${butWebSite}
        ${butWebOtherSite}
        ${butWebPrograms}
        ${butWebPodcasts}
        ${butWebPlayer}
        ${butWebSchedule}
        ${butMediaSite}
        ${butMediaOtherRadio}
    `;
}

function updateStationUI(s) {
   // 1. Pobranie elementów (upewnij się, że ID w HTML są unikalne!)
   const dc = document.getElementById("AllContentDisplay"); // Label ramówki
   const dp = document.getElementById("AllProgramsDisplay"); // Label programów
   const dsContainer = document.getElementById("ScheduleDisplay"); // Div kontenera harmonogramu
   const btnDetail = document.getElementById("DetailSchBtn"); // Przycisk "Szczegółowe"
   const radioTab1 = document.getElementById("r-tab1");
   const radioTab2 = document.getElementById("r-tab2");

   // 2. Warunki logiczne
   const disableAllSchedule = (s.disable_detail_schedule && s.disable_schedule) ||
      (CONFIG.disable_detail_schedule && CONFIG.disable_schedule) ||
      s.disable_content_schedule || s.radio_listen || CONFIG.disable_content_schedule;

   const disablePrograms = s.disable_programs || CONFIG.disable_programs || CONFIG.disable_programs_info || s.radio_listen;
   const disableMainSch = s.disable_schedule || CONFIG.disable_schedule;
   const disableDetailSch = s.disable_detail_schedule || CONFIG.disable_detail_schedule;

   // 3. Zarządzanie widocznością głównych zakładek (Labels)
   dc.style.display = disableAllSchedule ? "none" : "inline-block";
   dp.style.display = disablePrograms ? "none" : "inline-block";

   // 4. Jeśli ramówka jest wyłączona, a programy włączone -> przełącz na programy
   if (disableAllSchedule && !disablePrograms) {
      radioTab2.checked = true;
   } else {
      radioTab1.checked = true;
   }

   // 5. Zarządzanie podzakładkami wewnątrz Ramówki
   if (dsContainer) {
      dsContainer.style.display = disableAllSchedule ? "none" : "block";
   }

   if (btnDetail) {
      btnDetail.style.display = disableDetailSch ? "none" : "inline-block";
   }

   // 6. Obsługa specyficznego przypadku: jeśli główny tydzień jest wyłączony, wymuś widok szczegółowy
   if (disableMainSch && !disableDetailSch) {
      // Ukrywamy wszystko i pokazujemy tylko sch_detail
      document.querySelectorAll(".tabcontent").forEach(el => el.style.display = "none");
      document.querySelectorAll(".tablinks").forEach(el => el.classList.remove("active"));

      const detailTab = document.getElementById('sch_detail');
      if (detailTab) detailTab.style.display = "block";
      if (btnDetail) btnDetail.classList.add("active");
   } else {
      // Domyślnie pokaż sch_schedule (Tydzień)
      openTab(null, 'sch_schedule');
   }
}

function renderStations() {
   const select = document.getElementById("stationSelect");
   const player = document.getElementById("player");

   const params = new URLSearchParams(window.location.search);
   const stationSlug = params.get('st');

   // 1. Ustalenie stacji startowej
   let initialStationIndex = 0;
   if (stationSlug) {
      const foundIndex = STATIONS.findIndex(s => s.id === stationSlug || s.slug === stationSlug);
      if (foundIndex !== -1) initialStationIndex = foundIndex;
   }

   // 2. Renderowanie listy i inicjalizacja
   STATIONS.forEach((s, i) => {
      if (!s.no_on_player) {
         const opt = document.createElement("option");
         opt.value = s.id;
         opt.textContent = s.name;
         if (i === initialStationIndex) opt.selected = true;
         select.appendChild(opt);
      }

      if (i === initialStationIndex) {
         setupStation(s, false);
      }
   });

   function setupStation(s, shouldPlay = false) {
      CURRENT_STATION = s.station_schedule;
      CURRENT_STATION_ID = s.id;

      AudioPlayer(s.stream); // Uruchamia logikę odtwarzacza
      ButtonsSites(s);
      updateStationUI(s);
      playlistNowPlaying(s.playlist);

      if (shouldPlay) {
         player.play().catch(() => console.log("Wymagana interakcja użytkownika do startu audio"));
      }
      reloadAll();
   }

   select.onchange = () => {
      const s = STATIONS.find(x => x.id === select.value);
      if (s) setupStation(s, true);
   };
}

function AudioPlayer(url) {
   const audio = document.getElementById('player');

   // Czyszczenie poprzedniej instancji HLS
   if (hlsInstance) {
      hlsInstance.destroy();
      hlsInstance = null;
   }

   const sm = url.slice(0, 7) === 'http://' ?
      'https://cors.krdrtradio.workers.dev/?url=' + encodeURIComponent(url) : url;

   if (url.includes('.m3u8')) {
      if (Hls.isSupported()) {
         hlsInstance = new Hls();
         hlsInstance.loadSource(sm);
         hlsInstance.attachMedia(audio);
      } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
         audio.src = sm;
      }
   } else {
      audio.src = sm;
   }
}

function ReloadAudio() {
   const audio = document.getElementById('player');
   // Jeśli używamy HLS, bierzemy URL z instancji, w przeciwnym razie z src audio
   const currentUrl = hlsInstance ? hlsInstance.url : audio.src;

   if (currentUrl) {
      console.log("Przeładowuję strumień...");
      // Ważne: przy przeładowaniu warto zapamiętać, czy grało, 
      // bo zmiana src zatrzyma odtwarzanie.
      const wasPlaying = !audio.paused;
      AudioPlayer(currentUrl);
      if (wasPlaying) audio.play();
   }
}

function reloadAll() {
   if (typeof renderCurrent === "function") renderCurrent();
   if (typeof renderSchedules === "function") renderSchedules();
   if (typeof renderSDetails === "function") renderSDetails();
   if (typeof renderPrograms === "function") renderPrograms();
   if (typeof updateOnAirStatus === "function") updateOnAirStatus();
}

function playlistNowPlaying(playlistString) {
   // playlistString to np. "getNowPlayingEurozet('antbal_new')"
   if (playlistInterval) clearInterval(playlistInterval);

   const updateTrack = () => {
      if (!playlistString) return;

      // Rozbijamy string na nazwę funkcji i argument
      const match = playlistString.match(/^(\w+)\(['"]?(.*?)['"]?\)$/);

      if (match) {
         const functionName = match[1]; // np. getNowPlayingEurozet
         const argument = match[2]; // np. antbal_new

         if (typeof window[functionName] === "function") {
            window[functionName](argument);
         }
      } else {
         // Jeśli to nie funkcja, a zwykły tekst, wyświetl go
         const resultElem = document.getElementById('resultTrack');
         if (resultElem) resultElem.innerText = playlistString;
      }
   };

   updateTrack();
   playlistInterval = setInterval(updateTrack, 20000);
}

function scheduleCurrent(scheduleString) {
   if (!scheduleString) return;

   // 1. Próba dopasowania formatu: nazwaFunkcji(argumenty)
   const match = scheduleString.match(/^(\w+)\((.*)\);?$/);

   if (match) {
      const functionName = match[1];
      const rawArgs = match[2];

      // 2. Sprawdzenie, czy funkcja o tej nazwie istnieje w globalnym zasięgu
      if (typeof window[functionName] === "function") {

         // 3. Ustawienie flagi blokady dla renderCurrent
         // SCHEDULE_APP = 1;

         // 4. Parsowanie argumentów (usuwanie cudzysłowów i spacji)
         const args = rawArgs.split(',')
            .map(arg => arg.trim().replace(/^['"]|['"]$/g, ''));

         // 5. Wywołanie funkcji z przekazanymi parametrami
         window[functionName](...args);

      } else {
         console.warn(`⚠️ Funkcja ${functionName} jest zdefiniowana w JSON, ale nie istnieje w JS.`);
         // SCHEDULE_APP = null;
      }
   } else {
      // 6. Jeśli to nie funkcja, traktujemy to jako zwykły tekst informacyjny
      const resultElemS = document.getElementById('resultCP');
      if (resultElemS) {
         resultElemS.innerText = scheduleString;
      }
      // SCHEDULE_APP = null;
   }
}
// =====================
// INIT
// =====================
function init() {
   renderStations();
   renderCurrent();
   renderSchedules();
   renderSDetails();
   renderPrograms();
   updateOnAirStatus();

   document.getElementById("categoryFilter").onchange = renderPrograms;

   setInterval(() => {
      const now = NowZone();
      const newDay = now.getDay();

      renderCurrent();
      updateOnAirStatus();

      if (newDay !== lastDay) {
         renderSchedules();
         lastDay = newDay;
      }

   }, 60000);
}
