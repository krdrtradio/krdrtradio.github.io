let PODCASTS = [];
let PEOPLES = [];
let SITE_ID = null;

// =====================
// LOAD
// =====================

async function loadData(siteId) {
    SITE_ID = siteId;

    const baseUrl = `https://krdrtradio.github.io/media/json/${siteId}`;

    const fetchJson = async (name) => {
        try {
            const response = await fetch(`${baseUrl}_${name}.json`);

            if (!response.ok) {
                console.warn(`${name}.json nie został znaleziony.`);
                return [];
            }

            return await response.json();
        } catch (err) {
            console.error(`Błąd podczas pobierania ${name}.json`, err);
            return [];
        }
    };

    [PODCASTS, PEOPLES] = await Promise.all([
        fetchJson("podcasts"),
        fetchJson("peoples")
    ]);

    console.log("Dane załadowane pomyślnie");
}

// =====================
// PROGRAMS LEADERS
// =====================

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


    /*
     * ============================================================
     * POBIERANIE DANYCH
     * ============================================================
     */

    const [
        podcasts,
        programs,
        scheduleBlocks,
        mediaConfig,
        programConfig
    ] = await Promise.all([
        fetchJSON(
            `https://krdrtradio.github.io/media/json/${station}_podcasts.json`
        ),

        fetchJSON(
            `https://krdrtradio.github.io/radios/json/${station}_programs.json`
        ),

        fetchJSON(
            `https://krdrtradio.github.io/radios/json/${station}_schedule.json`
        ),

        fetchJSON(
            `https://krdrtradio.github.io/media/json/${station}_config.json`,
            true
        ),

        fetchJSON(
            `https://krdrtradio.github.io/radios/json/${station}_config.json`,
            true
        )
    ]);


    /*
     * ============================================================
     * CZAS / SCHEDULE
     * ============================================================
     */

    const now = typeof NowZone === "function"
        ? NowZone()
        : new Date();

    const activeBlock = getActiveScheduleBlock(
        now,
        scheduleBlocks
    );

    const schedule = activeBlock?.schedule || [];


    /*
     * ============================================================
     * MAPA PROGRAMÓW
     * ============================================================
     *
     * podcast.schedule_onair === program.id
     */

    const programById = new Map(
        programs
            .filter(item => item?.id)
            .map(item => [item.id, item])
    );


    /*
     * ============================================================
     * SPRAWDZENIE 6 WARUNKÓW PROGRAMU
     * ============================================================
     *
     * Zwraca true tylko wtedy, gdy program przechodzi 6/6.
     */

    const canUseProgram = (program) => {

        if (!program)
            return false;


        // 1/6
        if (program.delete)
            return false;


        // 2/6
        if (program.private)
            return false;


        // 3/6
        if (program.hide_in_schedule)
            return false;


        // 4/6
        if (program.hide_in_program)
            return false;


        // 5/6
        if (program.hide_only_information_schedule)
            return false;


        // 6/6
        if (programConfig.disable_programs_info)
            return false;


        return true;
    };


    /*
     * ============================================================
     * SPRAWDZENIE PODCASTU
     * ============================================================
     *
     * Podcast ma własne 3 warunki + konfigurację.
     */

    const canUsePodcast = (podcast) => {

        if (!podcast)
            return false;


        // 1/3
        if (podcast.delete)
            return false;


        // 2/3
        if (podcast.private)
            return false;


        // 3/3
        if (podcast.hide_in_podcast)
            return false;


        // konfiguracja podcastów
        if (mediaConfig.disable_podcasts_info)
            return false;


        return true;
    };


    /*
     * ============================================================
     * CZY OSOBA JEST PRZYPISANA DO ELEMENTU
     * ============================================================
     */

    const hasPerson = (item) => {

        /*
         * leaders_host
         */

        if (Array.isArray(item.leaders_host)) {

            if (item.leaders_host.includes(peopleName))
                return true;

        } else if (item.leaders_host === peopleName) {

            return true;
        }


        /*
         * host
         */

        if (Array.isArray(item.host)) {

            if (item.host.includes(peopleName))
                return true;

        } else if (typeof item.host === "string") {

            if (item.host === peopleName)
                return true;

            if (item.host.includes(peopleName))
                return true;
        }


        return false;
    };


    /*
     * ============================================================
     * ID PROGRAMÓW I PODCASTÓW
     * ============================================================
     */

    const programIds = new Set();
    const podcastIds = new Set();


    /*
     * ============================================================
     * PROGRAMY
     * ============================================================
     */

    for (const item of programs) {

        if (!item?.id)
            continue;


        /*
         * Program musi przejść 6/6.
         */

        if (!canUseProgram(item))
            continue;


        /*
         * only_the_schedule_hosts
         */

        if (item.only_the_schedule_hosts === true) {

            const rows = schedule.filter(r =>
                r.id === item.id &&
                r.active &&
                !r.private &&
                !r.delete &&
                !r.hide_in_schedule &&
                (
                    !r.publish_from_date ||
                    now >= new Date(r.publish_from_date)
                ) &&
                (
                    !r.publish_to_date ||
                    now <= new Date(r.publish_to_date)
                )
            );


            let foundHost = false;


            for (const row of rows) {

                const hosts = Array.isArray(row.host)
                    ? row.host
                    : row.host
                        ? [row.host]
                        : [];


                if (hosts.includes(peopleName)) {
                    foundHost = true;
                    break;
                }
            }


            if (foundHost)
                programIds.add(item.id);


            continue;
        }


        /*
         * Normalne leaders_host / host
         */

        if (hasPerson(item)) {
            programIds.add(item.id);
        }
    }


    /*
     * ============================================================
     * PODCASTY
     * ============================================================
     */

    for (const item of podcasts) {

        if (!item?.id)
            continue;


        /*
         * Podcast musi przejść własne filtry.
         */

        if (!canUsePodcast(item))
            continue;


        /*
         * Podcast musi należeć do tej osoby.
         */

        if (!hasPerson(item))
            continue;


        /*
         * ========================================================
         * schedule_onair
         * ========================================================
         *
         * Jeżeli podcast ma schedule_onair:
         *
         *      podcast.schedule_onair
         *                  ↓
         *             program.id
         *
         * próbujemy pokazać program.
         */

        if (item.schedule_onair) {

            const linkedProgram =
                programById.get(item.schedule_onair);


            /*
             * Program istnieje.
             */

            if (linkedProgram) {

                /*
                 * =================================================
                 * PROGRAM 6/6
                 * =================================================
                 *
                 * Jeżeli program przechodzi wszystkie warunki
                 * i osoba jest do niego przypisana:
                 *
                 *      PODCAST → PROGRAM
                 */

                if (
                    canUseProgram(linkedProgram) &&
                    (
                        linkedProgram.only_the_schedule_hosts !== true
                            ? hasPerson(linkedProgram)
                            : (() => {

                                const rows = schedule.filter(r =>
                                    r.id === linkedProgram.id &&
                                    r.active &&
                                    !r.private &&
                                    !r.delete &&
                                    !r.hide_in_schedule &&
                                    (
                                        !r.publish_from_date ||
                                        now >= new Date(r.publish_from_date)
                                    ) &&
                                    (
                                        !r.publish_to_date ||
                                        now <= new Date(r.publish_to_date)
                                    )
                                );


                                return rows.some(row => {

                                    const hosts = Array.isArray(row.host)
                                        ? row.host
                                        : row.host
                                            ? [row.host]
                                            : [];


                                    return hosts.includes(peopleName);
                                });

                            })()
                    )
                ) {

                    /*
                     * Program jest poprawny 6/6.
                     *
                     * Nie dodajemy podcastu.
                     * Program zostanie zwrócony.
                     */

                    programIds.add(linkedProgram.id);

                    continue;
                }


                /*
                 * =================================================
                 * PROGRAM NIE PRZECHODZI 6/6
                 * =================================================
                 *
                 * Wracamy do podcastu.
                 *
                 * Nie robimy continue.
                 * Podcast zostaje dodany poniżej.
                 */
            }
        }


        /*
         * ========================================================
         * PODCAST
         * ========================================================
         *
         * Brak poprawnego programu z schedule_onair
         * albo program nie przeszedł 6/6.
         */

        podcastIds.add(item.id);
    }


    /*
     * ============================================================
     * WAŻNE:
     * USUNIĘCIE PODCASTU, JEŻELI PROGRAM ZOSTAŁ WYBRANY
     * ============================================================
     *
     * To zabezpiecza sytuację, gdy podcast został dodany wcześniej,
     * a później jego program został zaakceptowany.
     */

    for (const podcast of podcasts) {

        if (!podcast?.id)
            continue;

        if (!podcast.schedule_onair)
            continue;


        if (programIds.has(podcast.schedule_onair)) {
            podcastIds.delete(podcast.id);
        }
    }


    /*
     * ============================================================
     * BUDOWANIE WYNIKU
     * ============================================================
     */

    const result = [];


    /*
     * ============================================================
     * PROGRAMY
     * ============================================================
     */

    for (const item of programs) {

        if (!programIds.has(item.id))
            continue;


        result.push({
            ...item,

            target_url:
                `https://krdrtradio.github.io/radios/program?uid=${item.id}&st=${station}`
        });
    }


    /*
     * ============================================================
     * PODCASTY
     * ============================================================
     */

    for (const item of podcasts) {

        if (!podcastIds.has(item.id))
            continue;


        result.push({
            ...item,

            target_url:
                `https://krdrtradio.github.io/media/podcast?uid=${item.id}&st=${station}`
        });
    }


    /*
     * ============================================================
     * SORTOWANIE
     * ============================================================
     */

    return result.sort((a, b) => {

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

// =====================
// PODCAST LIST
// =====================
function renderPodcasts() {
   const container = document.getElementById("podcast_list");
   if (!container) return;

   const filter = document.getElementById("categoryFilter")?.value ?? "";
   const search = document.getElementById("searchInput")?.value.toLowerCase() ?? "";
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

   container.innerHTML = "";

   PODCASTS
      .filter(p => {
         // 1. Podstawowe filtry (ukryte/prywatne/archiwalne)
         if (p.hide_in_podcast || p.private || p.archive || p.delete) return false;

         // 2. Logika category_not_all: 
         // Jeśli flaga jest true, pokazuj TYLKO gdy wybrany jest filtr kategorii.
         // Jeśli flaga jest false/brak, pokazuj zawsze.
         if (p.category_not_all && filter === "") return false;

         // 3. Filtr konkretnej kategorii (jeśli wybrana)
         if (filter !== "" && !(p.category && p.category.includes(filter))) return false;

         // 4. Wyszukiwarka tekstowa
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
      })
      .forEach(p => {
         const el = document.createElement("div");
         el.className = "podcast_list_content";
         el.dataset.uid = p.id;

         const thumb = p.thumbnail_text;
         const style = thumb ? [
            thumb.background ? `background:${thumb.background}` : '',
            thumb.color ? `color:${thumb.color}` : ''
         ].filter(Boolean).join(';') : '';
         const name = (thumb && thumb.name) || p.name || "";
         const thumbnailDisplay = p.thumbnail_uri ?
            `<img decoding="async" src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent('https://' + p.thumbnail_uri)}&w=500&h=500&q=75&d=1" alt="${escapeHTML(p.name)}">` : "";
         const thumbnailText = thumb ? `<div class="podcast_list_box" style="${style}">${name}</div>` : thumbnailDisplay;
         const url = p.url_immediately || `podcast?uid=${p.id}&st=${SITE_ID}`;
         const descP = p.description ? p.description : '';
         const desc = p.description_for_the_podcast ? p.description_for_the_podcast : descP;

         el.innerHTML = `
               <div class="podcast_list_cover">
                   <a href="${url}" target="_blank">${thumbnailText}</a>
               </div>
               <div class="podcast_list_info">
                   <div class="podcast_list_name">
                       <a href="${url}" target="_blank">${escapeHTML(p.name)}</a>
                   </div>
                   <div class="podcast_list_host">${p.only_the_schedule_hosts === true ? '' : escapeHTML(p.host) || ""}</div>
                   ${desc ? `<div class="podcast_list_desc">${HTMLStripper(desc)}</div>` : ''}
               </div>
           `;

         container.appendChild(el);
      });
}

// =====================
// PEOPLE LIST
// =====================
function renderPeoples() {
    const container = document.getElementById("people_list");
    if (!container) return;

    const filter = document.getElementById("people_categoryFilter")?.value ?? "";
    const search = document.getElementById("people_searchInput")?.value.toLowerCase() ?? "";

    const escapeHTML = (str) =>
        str ? String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m])) : "";

    const HTMLStripper = (str) =>
     str ? str.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n/g, "") : "";

    container.innerHTML = "";

    const peoples = PEOPLES
        .filter(p => {

            if (p.hide_in_people || p.private || p.delete)
                return false;

            if (p.local_not_all && filter === "")
                return false;

            if (filter !== "" && !(p.local && p.local.includes(filter)))
                return false;

            const name = (p.name || "").toLowerCase();

            return name.includes(search);
        })
        .sort((a, b) => {

            const sortA = Array.isArray(a.sorted)
                ? a.sorted
                : [a.sorted || ""];

            const sortB = Array.isArray(b.sorted)
                ? b.sorted
                : [b.sorted || ""];

            const res = sortA[0].toString().localeCompare(
                sortB[0].toString(),
                undefined,
                { numeric: true }
            );

            if (res === 0 && (sortA[1] !== undefined || sortB[1] !== undefined)) {

                const res2 = (sortA[1] || "").toString().localeCompare(
                    (sortB[1] || "").toString(),
                    undefined,
                    { numeric: true }
                );

                if (res2 !== 0)
                    return res2;
            }

            return res !== 0
                ? res
                : (a.name || "").localeCompare(b.name || "");
        });
          peoples.forEach(p => {
            const thumb = p.thumbnail_text;
            const style = thumb
                ? [
                    thumb.background ? `background:${thumb.background}` : "",
                    thumb.color ? `color:${thumb.color}` : ""
                ].filter(Boolean).join(";") : "";
            const name = (thumb && thumb.name) || p.name || "";
            const thumbnailDisplay = p.thumbnail_uri ? `<img decoding="async" src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent('https://' + p.thumbnail_uri)}&w=500&h=500&q=75&d=1" alt="${escapeHTML(p.name)}">` : "";
            const thumbnailText = thumb ? `<div class="podcast_list_box" style="${style}">${escapeHTML(name)}</div>` : thumbnailDisplay;
            const url = `people?uid=${p.id}&st=${SITE_ID}`;
            const descP = p.description ? p.description : '';
            const desc = p.description_for_the_people ? p.description_for_the_people : descP;
            const row = document.createElement("div");
            row.className = "podcast_list_content";
            row.dataset.uid = p.id;
            row.innerHTML = `
                <div class="podcast_list_cover">
                    <a href="${url}" target="_blank">${thumbnailText}</a>
                </div>
                <div class="podcast_list_info">
                    <div class="podcast_list_name">
                        <a href="${url}" target="_blank">${escapeHTML(p.name)}</a>
                    </div>
                    ${p.functions ? `<div class="podcast_list_functions">${Array.isArray(p.functions) ? escapeHTML(p.functions.join(", ")) : escapeHTML(p.functions)}</div>` : ""}
                    <div class="podcast_list_host leaders-box"></div>
                    ${desc ? `<div class="podcast_list_desc">${HTMLStripper(desc)}</div>` : ''}
                </div>
            `;
            container.appendChild(row);
            getDisplayleaders(p.name, SITE_ID).then(leaders => {
                if (!leaders.length && !p.leaders) return;
                row.querySelector(".leaders-box").innerHTML =
                    (p.leaders ? `<div><span class="podcast_list_host_cat">Prowadzi:</span> ${Array.isArray(p.leaders) ? escapeHTML(p.leaders.join(", ")) : escapeHTML(p.leaders)}</div>` : "") +
                    (leaders.length ? `<div><span class="podcast_list_host_cat">Audycje:</span> ` +
                    leaders.map(item => `<a href="${item.url_immediately || item.target_url}" target="_blank">${escapeHTML(item.name)}</a>`).join(", ") + `</div>` : "");
            });
        });
}

// =====================
// INIT
// =====================
function init() {
    renderPodcasts();
    renderPeoples();

    document.getElementById("categoryFilter")
        ?.addEventListener("change", renderPodcasts);

    document.getElementById("people_categoryFilter")
        ?.addEventListener("change", renderPeoples);

    document.getElementById("searchInput")
        ?.addEventListener("input", renderPodcasts);

    document.getElementById("people_searchInput")
        ?.addEventListener("input", renderPeoples);
}
