function NowZone(...args) {
    return new Date(new Date(...args).toLocaleString("sv-SE", {
        timeZone: "Europe/Warsaw"
    }));
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
    /*
     * midnight:
     *
     * days: ["1"] -> Z niedzieli na poniedziałek
     * days: ["0"] -> Z soboty na niedzielę
     *
     * Przy kilku przejściach używamy skrótów:
     *
     * ["1", "2", "3", "4"]
     * -> Pn/Wt - Czw/Pt
     */
    const midnightDaysMapFull = {
        "1": "Z niedzieli na poniedziałek",
        "2": "Z poniedziałku na wtorek",
        "3": "Z wtorku na środę",
        "4": "Ze środy na czwartek",
        "5": "Z czwartku na piątek",
        "6": "Z piątku na sobotę",
        "0": "Z soboty na niedzielę"
    };
    const midnightDaysMapShort = {
        "1": "Pn/Wt",
        "2": "Wt/Śr",
        "3": "Śr/Czw",
        "4": "Czw/Pt",
        "5": "Pt/Sob",
        "6": "Sob/Ndz",
        "0": "Ndz/Pn"
    };
    /*
     * Kolejność przejść midnight.
     *
     * Tu ważne:
     *
     * 1 = Pn/Wt
     * 2 = Wt/Śr
     * ...
     * 6 = Sob/Ndz
     * 0 = Ndz/Pn
     *
     * Do sortowania traktujemy 0 jako 7.
     */
    const midnightSortValue = day => day === "0" ? 7 : Number(day);
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
    const now = NowZone();
    /*
     * ---------------------------------------------------------
     * AKTYWNY BLOK
     * ---------------------------------------------------------
     */
    const activeBlock = getActiveScheduleBlock(now, rawSchedule);
    const scheduleSource = activeBlock?.schedule || [];
    /*
     * ---------------------------------------------------------
     * FILTROWANIE
     * ---------------------------------------------------------
     */
    const filtered = scheduleSource.filter(p => {
        if (p.id !== programId || !p.active || p.private || p.delete || p.hide_in_schedule) {
            return false;
        }
        return (
            (p.publish_from_date ? now >= new Date(p.publish_from_date) : true) && (p.publish_to_date ? now <= new Date(p.publish_to_date) : true));
    });
    if (filtered.length === 0) {
        return "";
    }
    /*
     * ---------------------------------------------------------
     * FORMATOWANIE LISTY LICZB
     * ---------------------------------------------------------
     *
     * [1]
     * -> 1.
     *
     * [1, 2]
     * -> 1. i 2.
     *
     * [1, 2, 4]
     * -> 1., 2. i 4.
     */
    const formatNumberList = values => {
        const arr = values.filter(v => v !== null && v !== undefined && v !== "").map(Number).filter(v => !Number.isNaN(v));
        if (arr.length === 0) {
            return "";
        }
        if (arr.length === 1) {
            return `${arr[0]}.`;
        }
        if (arr.length === 2) {
            return `${arr[0]}. i ${arr[1]}.`;
        }
        return (arr.slice(0, -1).map(v => `${v}.`).join(", ") + ` i ${arr[arr.length - 1]}.`);
    };
    /*
     * ---------------------------------------------------------
     * FORMAT DATY
     * ---------------------------------------------------------
     */
    const formatDate = value => {
        const d = new Date(value);
        if (isNaN(d.getTime())) {
            return null;
        }
        return (`${String(d.getDate()).padStart(2, "0")}.` + `${String(d.getMonth() + 1).padStart(2, "0")}.` + `${d.getFullYear()}`);
    };
    /*
     * ---------------------------------------------------------
     * BUILD RULES
     * ---------------------------------------------------------
     */
    const buildRules = (obj, isExclude = false) => {
        if (!obj || typeof obj !== "object") {
            return [];
        }
        const rules = [];
        /*
         * -----------------------------------------------------
         * MOD
         * -----------------------------------------------------
         *
         * mod2: 1
         * ->
         * co 2 tyg. (cykl 1)
         *
         * weekmonth_exclude:
         * ->
         * oprócz: co 2 tyg. (cykl 1)
         */
        Object.keys(obj).forEach(key => {
            if (!key.startsWith("mod")) {
                return;
            }
            const num = key.replace("mod", "");
            const values = Array.isArray(obj[key]) ? obj[key] : [obj[key]];
            values.forEach(value => {
                const text = `co ${num} tyg. (cykl ${value})`;
                rules.push(isExclude ? `oprócz: ${text}` : text);
            });
        });
        /*
         * -----------------------------------------------------
         * MONTH
         * -----------------------------------------------------
         *
         * month: 4
         * ->
         * miesiąc: maj
         *
         * month: [5, 6]
         * ->
         * miesiące: czerwiec i lipiec
         *
         * exclude:
         * ->
         * oprócz miesiąca: maj
         *
         * oprócz miesięcy: czerwiec i lipiec
         */
        if (Object.prototype.hasOwnProperty.call(obj, "month")) {
            const values = Array.isArray(obj.month) ? obj.month : [obj.month];
            const names = values.map(v => months[v] ?? v).filter(v => v !== null && v !== undefined && v !== "");
            if (names.length === 1) {
                rules.push(isExclude ? `oprócz miesiąca: ${names[0]}` : `miesiąc: ${names[0]}`);
            }
            if (names.length > 1) {
                const text = names.length === 2 ? `${names[0]} i ${names[1]}` : (names.slice(0, -1).join(", ") + ` i ${names[names.length - 1]}`);
                rules.push(isExclude ? `oprócz miesięcy: ${text}` : `miesiące: ${text}`);
            }
        }
        /*
         * -----------------------------------------------------
         * DATE RANGE
         * -----------------------------------------------------
         *
         * fromDate + toDate:
         *
         * od 14.04.2026 do 25.04.2026
         */
        const hasFromDate = Object.prototype.hasOwnProperty.call(obj, "fromDate");
        const hasToDate = Object.prototype.hasOwnProperty.call(obj, "toDate");
        if (hasFromDate || hasToDate) {
            const from = hasFromDate ? formatDate(obj.fromDate) : null;
            const to = hasToDate ? formatDate(obj.toDate) : null;
            let dateText = "";
            if (from && to) {
                dateText = `od ${from} do ${to}`;
            } else if (from) {
                dateText = `od ${from}`;
            } else if (to) {
                dateText = `do ${to}`;
            }
            if (dateText) {
                rules.push(isExclude ? `oprócz: ${dateText}` : dateText);
            }
        }
        /*
         * -----------------------------------------------------
         * TYDZIEŃ / DZIEŃ MIESIĄCA
         * -----------------------------------------------------
         */
        Object.keys(obj).forEach(key => {
            if (key.startsWith("mod") || key === "month" || key === "fromDate" || key === "toDate") {
                return;
            }
            if (!labelMap[key]) {
                return;
            }
            const values = Array.isArray(obj[key]) ? obj[key] : [obj[key]];
            const numericValues = values.filter(v => v !== null && v !== undefined && v !== "").map(Number).filter(v => !Number.isNaN(v));
            if (numericValues.length === 0) {
                return;
            }
            const formatted = formatNumberList(numericValues);
            const text = `${formatted} ${labelMap[key]}`;
            rules.push(isExclude ? `oprócz: ${text}` : text);
        });
        return rules;
    };
    /*
     * ---------------------------------------------------------
     * GRUPY CZASOWE
     * ---------------------------------------------------------
     *
     * Grupujemy po godzinie.
     *
     * midnight jest trzymane osobno.
     *
     * Dzięki temu:
     *
     * Sob 02:00 - 06:00
     *
     * oraz
     *
     * Sob/Ndz 02:00 - 06:00
     *
     * mogą istnieć jednocześnie.
     */
    /*
     * ---------------------------------------------------------
     * GRUPY CZASOWE
     * ---------------------------------------------------------
     */
    const timeGroups = {};
    const firstAppearance = {};
    filtered.forEach(occ => {
        const start = (occ.hour_start || "00:00").substring(0, 5);
        const end = (occ.hour_end || "00:00").substring(0, 5);
        const timeKey = `${start} - ${end}`;
        if (!timeGroups[timeKey]) {
            timeGroups[timeKey] = {
                normalDays: new Set(),
                midnightDays: new Set(),
                rules: new Set(),
                excludeRules: new Set()
            };
        }
        const group = timeGroups[timeKey];
        const days = Array.isArray(occ.days) ? occ.days : [occ.days];
        days.forEach(d => {
            if (d === null || d === undefined) {
                return;
            }
            const dStr = d.toString();
            /*
             * Rozdzielamy zwykłe dni i midnight.
             */
            if (occ.midnight === true) {
                const dayNum = Number(dStr);
                const previousDay = dayNum === 0 ? "6" : String(dayNum - 1);
                group.midnightDays.add(previousDay);
            } else {
                group.normalDays.add(dStr);
            }
            /*
             * Kolejność całej grupy.
             */
            const sortVal = dStr === "0" ? 7 : parseInt(dStr, 10);
            const startNumber = parseInt(start.replace(":", ""), 10);
            const weight = sortVal * 10000 + startNumber;
            if (firstAppearance[timeKey] === undefined || weight < firstAppearance[timeKey]) {
                firstAppearance[timeKey] = weight;
            }
        });
        /*
         * Reguły.
         */
        buildRules(occ.weekmonth, false).forEach(rule => {
            group.rules.add(rule);
        });
        buildRules(occ.weekmonth_exclude, true).forEach(rule => {
            group.excludeRules.add(rule);
        });
    });
    /*
     * ---------------------------------------------------------
     * FORMATOWANIE ZWYKŁYCH DNI
     * ---------------------------------------------------------
     */
    const formatNormalDays = days => {
        if (days.length === 0) {
            return "";
        }
        const sorted = [...days].sort(
            (a, b) => (a === "0" ? 7 : Number(a)) - (b === "0" ? 7 : Number(b)));
        if (sorted.length === 1) {
            return daysMapFull[sorted[0]];
        }
        const parts = [];
        let i = 0;
        while (i < sorted.length) {
            let j = i;
            while (j < sorted.length - 1) {
                const curr = sorted[j] === "0" ? 7 : Number(sorted[j]);
                const next = sorted[j + 1] === "0" ? 7 : Number(sorted[j + 1]);
                if (next === curr + 1) {
                    j++;
                } else {
                    break;
                }
            }
            const diff = j - i;
            if (diff >= 2) {
                parts.push(`${daysMapShort[sorted[i]]} - ` + `${daysMapShort[sorted[j]]}`);
            } else if (diff === 1) {
                parts.push(`${daysMapShort[sorted[i]]} i ` + `${daysMapShort[sorted[j]]}`);
            } else {
                parts.push(daysMapShort[sorted[i]]);
            }
            i = j + 1;
        }
        return parts.join(", ");
    };
    /*
     * ---------------------------------------------------------
     * FORMATOWANIE MIDNIGHT
     * ---------------------------------------------------------
     */
    const formatMidnightDays = (days, timeKey) => {
        if (days.length === 0) {
            return "";
        }
        const sorted = [...days].sort(
            (a, b) => midnightSortValue(a) - midnightSortValue(b));
        /*
         * Pozostałe pojedyncze midnight
         * zawsze skrótowo.
         */
        if (sorted.length === 1) {
            return midnightDaysMapFull[sorted[0]];
        }
        /*
         * Kilka midnight.
         */
        const parts = [];
        let i = 0;
        while (i < sorted.length) {
            let j = i;
            while (j < sorted.length - 1) {
                const curr = midnightSortValue(sorted[j]);
                const next = midnightSortValue(sorted[j + 1]);
                if (next === curr + 1) {
                    j++;
                } else {
                    break;
                }
            }
            const diff = j - i;
            if (diff >= 2) {
                parts.push(`${midnightDaysMapShort[sorted[i]]} - ` + `${midnightDaysMapShort[sorted[j]]}`);
            } else if (diff === 1) {
                parts.push(`${midnightDaysMapShort[sorted[i]]} i ` + `${midnightDaysMapShort[sorted[j]]}`);
            } else {
                parts.push(midnightDaysMapShort[sorted[i]]);
            }
            i = j + 1;
        }
        return parts.join(", ");
    };
    /*
     * ---------------------------------------------------------
     * SORTOWANIE CZASÓW
     * ---------------------------------------------------------
     */
    const sortedTimeKeys = Object.keys(timeGroups).sort(
        (a, b) => firstAppearance[a] - firstAppearance[b]);
    /*
     * ---------------------------------------------------------
     * GENEROWANIE WYNIKU
     * ---------------------------------------------------------
     */
    return sortedTimeKeys.map(timeKey => {
        const group = timeGroups[timeKey];
        const normalDays = Array.from(group.normalDays);
        const midnightDays = Array.from(group.midnightDays);
        const dayParts = [];
        /*
         * ZWYKŁE DNI
         */
        if (normalDays.length > 0) {
            dayParts.push(formatNormalDays(normalDays));
        }
        /*
         * MIDNIGHT
         */
        if (midnightDays.length > 0) {
            dayParts.push(formatMidnightDays(midnightDays, timeKey));
        }
        /*
         * Jeżeli istnieją oba typy,
         * zachowujemy oba.
         */
        const dayString = dayParts.filter(Boolean).join(" | ");
        /*
         * REGUŁY
         */
        const rules = [...group.rules, ...group.excludeRules];
        const suffixText = rules.length > 0 ? ` (${rules.join(", ")})` : "";
        return (`${dayString} ` + `${timeKey}` + suffixText);
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
            const url = fileName.startsWith("http") ? fileName : `https://krdrtradio.github.io/media/json/${station}_${fileName}.json`;
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
        podcast.except = podcast.except || {};
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
        const activeBlock = getActiveScheduleBlock(now, Array.isArray(SCHEDULE_DATA) ? SCHEDULE_DATA : []);
        const scheduleSource = activeBlock?.schedule || [];
        // Informacja o emisji
        const scheduleInfo = getDisplaySchedule(podcast.schedule_onair || podcast.uid, Array.isArray(SCHEDULE_DATA) ? SCHEDULE_DATA : []);
        // 3. Przygotowanie zmiennych pomocniczych
        const escapeHTML = (str) => str ? String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        } [m])) : "";
        const HTMLStripper = (str) => str ? str.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n/g, "") : "";
        const occurrencesHostA = podcast.host || "---";
        const thumb = podcast.thumbnail_text;
        const style = thumb ? [
            thumb.background ? `background:${thumb.background}` : '',
            thumb.color ? `color:${thumb.color}` : ''
        ].filter(Boolean).join(';') : '';
        const name = (thumb && thumb.name) || podcast.name || "";
        const thumbnailDisplay = podcast.thumbnail_uri ? `<img decoding="async" src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent('https://' + podcast.thumbnail_uri)}&w=500&h=500&q=75&d=1" alt="${escapeHTML(podcast.name)}">` : "";
        const thumbnailText = thumb ? `<div class="podcast_info_name_box" style="${style}">${escapeHTML(name)}</div>` : thumbnailDisplay;
        const thumb_metaT = podcast.thumbnail_uri ? 'https://' + podcast.thumbnail_uri : '';
        const thumb_meta = thumb ? '' : thumb_metaT;
        const descF = podcast.description_full ? podcast.description_full : podcast.description;
        const desc_meta = podcast.meta_description ? podcast.meta_description : podcast.description;
        const emailContact = Array.isArray(podcast.email) ? podcast.email.map(t => `<a href="mailto:${t}">${escapeHTML(t)}</a>`).join(', ') : typeof podcast.email === 'string' && podcast.email.trim() !== '' ? `<a href="mailto:${podcast.email}">${escapeHTML(podcast.email)}</a>` : '';
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
        }, {
            key: 'url_rss',
            icon: 'fa-solid fa-rss'
        }, {
            key: 'url_podcast',
            icon: 'fa-solid fa-podcast'
        }, {
            key: 'url_spreaker',
            icon: 'fa-solid fa-table-list'
        }, {
            key: 'url_apple_podcasts',
            icon: 'fa-brands fa-apple'
        }, {
            key: 'url_sets',
            icon: 'fa-solid fa-compact-disc'
        }, {
            key: 'url_spotify',
            icon: 'fa-brands fa-spotify'
        }, {
            key: 'url_kick',
            icon: 'fa-brands fa-kickstarter-k'
        }, {
            key: 'url_twitch',
            icon: 'fa-brands fa-twitch'
        }, {
            key: 'url_youtube',
            icon: 'fa-brands fa-youtube'
        }, {
            key: 'url_facebook',
            icon: 'fa-brands fa-facebook'
        }, {
            key: 'url_instagram',
            icon: 'fa-brands fa-instagram'
        }, {
            key: 'url_tiktok',
            icon: 'fa-brands fa-tiktok'
        }, {
            key: 'url_x',
            icon: 'fa-brands fa-x-twitter'
        }, {
            key: 'url_linkedin',
            icon: 'fa-brands fa-linkedin'
        }, {
            key: 'url_soundcloud',
            icon: 'fa-brands fa-soundcloud'
        }, {
            key: 'url_mixcloud',
            icon: 'fa-brands fa-mixcloud'
        }, {
            key: 'url_wikipedia',
            icon: 'fa-brands fa-wikipedia-w'
        }];
        const socialUrlsHtml = socialConfig.filter(cfg => podcast[cfg.key]).map(cfg => `<a href="${podcast[cfg.key]}" target="_blank"><i class="${cfg.icon}"></i></a>`).join('\n');
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
                                        ${(!podcast.except?.onair && podcast.onair) ? `<div class="podcast_info_airtime">${escapeHTML(podcast.onair)}</div>` : ""}
                                        ${(!podcast.except?.label && podcast.label) ? `<div class="podcast_info_producter"><small>Wydawca:</small><br>${escapeHTML(podcast.label)}</div>` : ""}
                                        ${(!podcast.except?.email && emailContact) ? `<div class="podcast_info_email"><small>E-mail:</small><br>${emailContact}</div>` : ""}
                                        ${!podcast.except?.host ? `<div class="podcast_info_djs"><small>Prowadzący:</small><br>${escapeHTML(occurrencesHostA)}</div>` : ""}
                                    </div>
                                </div>
                                <div class="podcast_info_desc">${!podcast.except?.description ? (descF || "Brak opisu podcastu.") : ""}</div>
                                <div class="podcast_info_urls">${!podcast.except?.url ? socialUrlsHtml : ""}</div>
                                ${(!podcast.except?.schedule && scheduleInfo) ? `<div class="podcast_info_onairs">Na antenie:</div>` : ""}
                                ${(!podcast.except?.schedule && scheduleInfo) ? `<div class="podcast_info_onairs_list">${scheduleInfo}</div>` : ""}
                                ${!podcast.except?.podcast ? podcastList : ""}
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
        document.body.innerHTML = "Błąd krytyczny: " + err.message;
    }
}
uruchomPodcast();
