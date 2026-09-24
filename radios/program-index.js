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
        document.body.innerHTML = "Błąd: Brak parametrów 'uid' lub 'st' w adresie URL.";
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
        if (!program || program.hide_in_schedule || program.delete) {
            document.body.innerHTML = `Nie znaleziono programu o ID: ${uid}`; // Program niedostępny.
            document.title = window.location.href;
            return;
        }
        program.except = program.except || {};
        if (program.private) {
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
            document.body.innerHTML = `Nie znaleziono programu o ID: ${uid}`; // Program niedostępny.
            document.title = window.location.href;
            // console.log("Informacje o programie są wyłączone w konfiguracji.");
            // Tutaj możesz np. ukryć konkretny kontener w DOM zamiast blokować skrypt
            return;
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
            if (osch.id !== uid || !osch.active || osch.private || osch.delete || osch.hide_in_schedule) return false;
            // Tygodnie/Mody
            // if (osch.weekmonth) {
            //    const keys = Object.keys(osch.weekmonth);
            //    if (!keys.every(k => todayWeekStats[k] === osch.weekmonth[k])) return false;
            // }
            // Wykluczenia
            // if (osch.weekmonth_exclude) {
            //    const exKeys = Object.keys(osch.weekmonth_exclude);
            //    if (exKeys.every(k => todayWeekStats[k] === osch.weekmonth_exclude[k])) return false;
            // }
            return (
                (osch.publish_from_date ? now >= new Date(osch.publish_from_date) : true) && (osch.publish_to_date ? now <= new Date(osch.publish_to_date) : true));
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
        const occurrencesHost = [...new Set(occurrencesSch.flatMap(o => {
            if (!o.active || !o.host) return [];
            return Array.isArray(o.host) ? o.host : [o.host];
        }).map(h => h.trim()).filter(Boolean))];
        const baseHost = Array.isArray(program.host) ? program.host.join(", ") : (program.host || "---");
        const hostToDisplay = program.only_the_schedule_hosts ? (occurrencesHost.length > 0 ? occurrencesHost.join(', ') : "---") : baseHost;
        // 3. Renderowanie HTML
        const escapeHTML = (str) => str ? String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        } [m])) : "";
        const HTMLStripper = (str) => str ? str.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n/g, "") : "";
        const thumb = program.thumbnail_text;
        const style = thumb ? `background:${thumb.background || ''};color:${thumb.color || ''}` : '';
        const thumbnailText = thumb ? `<div class="podcast_info_name_box" style="${style}">${escapeHTML(thumb.name || program.name)}</div>` : (program.thumbnail_uri ? `<img src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent('https://' + program.thumbnail_uri)}&w=500&h=500&q=75&d=1" alt="${escapeHTML(program.name)}">` : "");
        const thumb_metaT = program.thumbnail_uri ? 'https://' + program.thumbnail_uri : '';
        const thumb_meta = thumb ? '' : thumb_metaT;
        const descF = program.description_full ? program.description_full : program.description;
        const desc_meta = program.meta_description ? program.meta_description : program.description;
        const emailContact = Array.isArray(program.email) ? program.email.map(t => `<a href="mailto:${t}">${escapeHTML(t)}</a>`).join(', ') : typeof program.email === 'string' && program.email.trim() !== '' ? `<a href="mailto:${program.email}">${escapeHTML(program.email)}</a>` : '';
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
        const socialUrlsHtml = socialConfig.filter(cfg => program[cfg.key]).map(cfg => `<a href="${program[cfg.key]}" target="_blank"><i class="${cfg.icon}"></i></a>`).join('\n');
        const fullHTML = `<!DOCTYPE html>
            <html lang="pl">
                <head>
                    <meta charset="UTF-8">
                    <meta name='robots' content='noindex, follow' />
                    <title>${escapeHTML(program.meta_title ? program.meta_title : program.name)} | KrdrtRadio</title>
                    <meta name="description" content="${escapeHTML(HTMLStripper(desc_meta))}"/>
                    <meta property="og:title" content="${escapeHTML(program.meta_title ? program.meta_title : program.name)}"/>
                    <meta property="og:type" content="website"/>
                    <meta property="og:url" content="https://krdrtradio.github.io/radios/program?uid=${uid}&st=${station}"/>
                    <meta property="og:image" content="${thumb_meta || 'https://i.ibb.co/ZpKQJtGC/broadcast_default_plug.png'}"/>
                    <meta property="og:image:height" content="315"/>
                    <meta property="og:image:width" content="600"/>
                    ${desc_meta ? `<meta property="og:description" content="${escapeHTML(HTMLStripper(desc_meta))}"/>` : ''}
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
                                        ${(!program.except?.onair && program.onair) ? `<div class="program_info_airtime">${escapeHTML(program.onair)}</div>` : ""}
                                        ${(!program.except?.label && program.label) ? `<div class="program_info_producter"><small>Wydawca:</small><br>${escapeHTML(program.label)}</div>` : ""}
                                        ${(!program.except?.email && emailContact) ? `<div class="program_info_email"><small>E-mail:</small><br>${emailContact}</div>` : ""}
                                        ${!program.except?.host ? `<div class="program_info_djs"><small>Prowadzący:</small><br>${escapeHTML(hostToDisplay)}</div>` : ""}
                                    </div>
                                </div>
                                <div class="program_info_desc">${!program.except?.description ? (descF || "Brak opisu programu.") : ""}</div>
                                <div class="program_info_urls">
                                    ${!program.except?.url ? socialUrlsHtml : ""}
                                </div>
                                ${(!program.except?.schedule && scheduleInfo) ? `<div class="program_info_onairs">Na antenie:</div>` : ""}
                                ${(!program.except?.schedule && scheduleInfo) ? `<div class="program_info_onairs_list">${scheduleInfo}</div>` : ""}
                                ${!program.except?.podcast ? podcastList : ""}
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
        document.open();
        document.write(fullHTML);
        document.close();
        // 👉 WAŻNE: inicjalizacja po renderze
        setTimeout(() => {
            startPodcastEngine(program.podcast);
            podcastLists(program.podcast);
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
uruchomProgram();
