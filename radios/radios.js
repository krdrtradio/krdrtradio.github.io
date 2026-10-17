// Poprawiony JavaScript odtworzony z przekazanego pliku.
let hlsInstance = null;
let CURRENT_STREAM_URL = "";
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
    CONFIG = {};

function NowZone(...args) {
    return new Date(
        new Date(...args).toLocaleString("sv-SE", {
            timeZone: "Europe/Warsaw"
        })
    );
}

let lastDay = NowZone().getDay();

async function loadData(name) {
  const response = await fetch(
    `https://station.krdrtradio.workers.dev/?si=${encodeURIComponent(name)}`
  );

  if (!response.ok) {
    throw new Error(`Nie udało się pobrać danych stacji: ${response.status}`);
  }

  return await response.json();
}

// =====================
// DAY PARAMETER z URL
// =====================

function getDayIdFromSlug(slug) {
    if (!slug) return null;

    const normalized = slug
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const dayMap = {
        "pon": "1",
        "pn": "1",
        "po": "1",
        "1": "1",
        "wt": "2",
        "2": "2",
        "śro": "3",
        "sro": "3",
        "śr": "3",
        "sr": "3",
        "3": "3",
        "czw": "4",
        "cz": "4",
        "4": "4",
        "pt": "5",
        "pi": "5",
        "pią": "5",
        "pia": "5",
        "5": "5",
        "sob": "6",
        "sb": "6",
        "so": "6",
        "6": "6",
        "nd": "0",
        "ndz": "0",
        "n": "0",
        "nie": "0",
        "nied": "0",
        "niedz": "0",
        "7": "0",
        "0": "0"
    };

    return dayMap[normalized] || null;
}

function openDayFromURL() {
    const params = new URLSearchParams(window.location.search);
    const daySlug = params.get("day");
    const dayId = getDayIdFromSlug(daySlug);

    if (!dayId) return;

    document.querySelectorAll(".schedule_list").forEach(el => {
        el.style.display = "none";
    });

    document.querySelectorAll(".day_tablinks").forEach(btn => {
        btn.classList.remove("active");
    });

    const selectedTab = document.getElementById("day_" + dayId);

    if (selectedTab) {
        selectedTab.style.display = "block";
    }

    document.querySelectorAll(".day_tablinks").forEach(btn => {
        if (btn.textContent.trim() === dayNames[dayId]) {
            btn.classList.add("active");
        }
    });
}

// =====================
// HELPERS
// =====================

const escapeHTML = (str) =>
    str
        ? String(str).replace(/[&<>"']/g, m => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[m]))
        : "";

const HTMLStripper = (str) =>
    str
        ? str.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n/g, "")
        : "";

function formatHour(h) {
    if (!h) return "";
    return String(h).slice(0, 5);
}

// =====================
// ZAKŁADKI
// =====================

function openTab(evt, tabName) {
    document.querySelectorAll(".tabcontent").forEach(el => {
        el.style.display = "none";
    });

    document.querySelectorAll(".tablinks").forEach(el => {
        el.classList.remove("active");
    });

    const targetTab = document.getElementById(tabName);

    if (targetTab) {
        targetTab.style.display = "block";
    }

    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add("active");
    }

    if (tabName === "sch_detail") {
        renderSDetails();
    }
}

function openDayTab(event, dayId) {
    document.querySelectorAll(".schedule_list").forEach(el => {
        el.style.display = "none";
    });

    document.querySelectorAll(".day_tablinks").forEach(btn => {
        btn.classList.remove("active");
    });

    const selectedTab = document.getElementById("day_" + dayId);

    if (selectedTab) {
        selectedTab.style.display = "block";
    }

    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active");
    }
}

// =====================
// AKTUALNIE NA ANTENIE
// =====================

async function renderCurrent() {
    if (!SITE_ID || !CURRENT_STATION_ID) return;

    const params = new URLSearchParams({
        si: SITE_ID,
        st: CURRENT_STATION_ID
    });

    const url =
        `https://current-program.krdrtradio.workers.dev/?${params}`;

    try {
        const response = await fetch(url, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();

        const program =
            payload.program ||
            payload.current ||
            payload.data ||
            payload;

        const station =
            STATIONS.find(s => s.id === CURRENT_STATION_ID) || {};

        const ui = {
            item: document.querySelector(".current_program_item"),
            hour: document.querySelector(".current_program_hour"),
            title: document.querySelector(".current_program_title"),
            host: document.querySelector(".current_program_host"),
            photo: document.querySelector(".current_program_photo"),
            track: document.getElementById("resultTrack")
        };

        const data = program.program_data || program.data || program;

        const title =
            program.name ||
            data.name ||
            program.title ||
            "Radio Online";

        if (ui.item) {
            ui.item.textContent = program.item || "";
        }

        if (ui.hour) {
            ui.hour.textContent =
                `${formatHour(program.hour_start)}${
                    program.hour_end
                        ? ` - ${formatHour(program.hour_end)}`
                        : ""
                }`;
        }

        if (ui.title) {
            ui.title.textContent = title;
        }

        const host = program.host || data.host || "";

        if (ui.host) {
            ui.host.textContent = Array.isArray(host)
                ? host.join(", ")
                : host;
        }

        const image =
            program.thumbnail_uri ||
            program.thumbnail ||
            data.thumbnail_uri ||
            data.thumbnail ||
            station.cover;

        if (ui.photo && image) {
            ui.photo.src = /^https?:\/\//i.test(image)
                ? image
                : `https://${image}`;

            ui.photo.alt = title;
        }

        if (ui.track) {
            ui.track.textContent =
                program.track ||
                program.song ||
                data.track ||
                "";
        }
    } catch (error) {
        console.error("Nie udało się pobrać aktualnego programu:", error);
    }
}

async function renderSchedules() {
    const tabs = document.getElementById("days");
    const contents = document.getElementById("day_contents");

    if (!tabs || !contents || !SITE_ID || !CURRENT_STATION_ID) return;

    const params = new URLSearchParams({
        si: SITE_ID,
        st: CURRENT_STATION_ID,
        onair: "true"
    });

    try {
        const response = await fetch(
            `https://schedule.krdrtradio.workers.dev/?${params}`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();

        const days = Array.isArray(payload)
            ? payload
            : (payload.schedule || payload.data || []);

        tabs.replaceChildren();
        contents.replaceChildren();

        days.forEach((entry, index) => {
            const dayId = String(entry.day ?? index);
            const label =
                dayNames[dayId] || entry.name || `Dzień ${dayId}`;

            const button = document.createElement("button");
            button.type = "button";
            button.className = "day_tablinks";
            button.textContent = label;

            button.addEventListener("click", () => {
                openDayTab({ currentTarget: button }, dayId);
            });

            tabs.appendChild(button);

            const panel = document.createElement("div");
            panel.id = `day_${dayId}`;
            panel.className = "schedule_list";
            panel.style.display = "none";

            (entry.schedule || entry.programs || []).forEach(p => {
                const card = document.createElement("article");
                card.className = p.subschedule
                    ? "schedule_program small"
                    : "schedule_program";

                const heading = document.createElement("div");
                heading.className = "schedule_program_name";
                heading.textContent = p.name || "Audycja";

                const hours = document.createElement("div");
                hours.className = "schedule_program_data";
                hours.textContent =
                    `${formatHour(p.hour_start)} - ${formatHour(p.hour_end)}`;

                const host = document.createElement("div");
                host.className = "schedule_program_host";
                host.textContent = Array.isArray(p.host)
                    ? p.host.join(", ")
                    : (p.host || "");

                card.append(heading, hours, host);

                if (p.comment) {
                    const comment = document.createElement("div");
                    comment.className = "schedule_program_comment";
                    comment.textContent = p.comment;
                    card.appendChild(comment);
                }

                panel.appendChild(card);
            });

            contents.appendChild(panel);
        });

        const today = String(NowZone().getDay());
        const initial = days.some(d => String(d.day) === today)
            ? today
            : String(days[0]?.day ?? "1");

        switchScheduleDay(initial);
    } catch (error) {
        console.error("Nie udało się pobrać ramówki:", error);
        contents.textContent =
            "Nie udało się wczytać ramówki. Spróbuj ponownie później.";
    }
}

function initDefaultTab() {
    const currentDay = NowZone().getDay().toString();
    openTab(null, currentDay);
}

function switchScheduleDay(dayId) {
    document.querySelectorAll(".schedule_list").forEach(el => {
        el.style.display = "none";
    });

    const selectedDay = document.getElementById(`day_${dayId}`);

    if (selectedDay) {
        selectedDay.style.display = "block";
    }

    document.querySelectorAll(".day_tab_btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.day === dayId);
    });
}

// =====================
// LISTA PROGRAMÓW
// =====================

async function renderPrograms() {
    const container = document.getElementById("program_list");

    if (!container || !SITE_ID || !CURRENT_STATION_ID) return;

    const search = (
        document.getElementById("searchInput")?.value || ""
    ).trim().toLocaleLowerCase("pl");

    const params = new URLSearchParams({
        si: SITE_ID,
        st: CURRENT_STATION_ID
    });

    try {
        const response = await fetch(
            `https://contentlist.krdrtradio.workers.dev/?${params}`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();

        const items = Array.isArray(payload)
            ? payload
            : (payload.programs || payload.content || payload.data || []);

        container.replaceChildren();

        items
            .filter(p => {
                const host = Array.isArray(p.host)
                    ? p.host.join(" ")
                    : (p.host || "");

                return `${p.name || ""} ${host}`
                    .toLocaleLowerCase("pl")
                    .includes(search);
            })
            .forEach(p => {
                const card = document.createElement("article");
                card.className = "program_list_content";

                const name = document.createElement("a");
                name.className = "program_list_name";
                name.textContent = p.name || "Program";

                name.href = p.url_immediately || p.url ||
                    `program?uid=${encodeURIComponent(p.id || p.uid || "")}` +
                    `&st=${encodeURIComponent(SITE_ID)}`;

                name.target = "_blank";
                name.rel = "noopener noreferrer";

                const host = document.createElement("div");
                host.className = "program_list_host";
                host.textContent = Array.isArray(p.host)
                    ? p.host.join(", ")
                    : (p.host || "");

                const desc = document.createElement("div");
                desc.className = "program_list_desc";
                desc.textContent = p.description || "";

                card.append(name, host);

                if (desc.textContent) {
                    card.appendChild(desc);
                }

                container.appendChild(card);
            });
    } catch (error) {
        console.error("Błąd listy programów:", error);
        container.textContent = "Nie udało się wczytać programów.";
    }
}

// =====================
// PODCASTY
// =====================

async function renderPodcasts() {
    const container =
        document.getElementById("podcast_list") ||
        document.querySelector(".podcasts_display .program_list");

    if (!container || !SITE_ID || !CURRENT_STATION_ID) return;

    const params = new URLSearchParams({
        si: SITE_ID,
        st: CURRENT_STATION_ID
    });

    try {
        const response = await fetch(
            `https://contentlist.krdrtradio.workers.dev/podcast?${params}`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();

        const items = Array.isArray(payload)
            ? payload
            : (payload.podcasts || payload.data || []);

        container.replaceChildren();

        items.forEach(p => {
            const row = document.createElement("article");
            row.className = "program_list_content";

            const a = document.createElement("a");
            a.textContent = p.name || "Podcast";
            a.href = p.url ||
                `program?uid=${encodeURIComponent(p.id || p.uid || "")}` +
                `&st=${encodeURIComponent(SITE_ID)}&podcast=true`;

            a.target = "_blank";
            a.rel = "noopener noreferrer";

            const desc = document.createElement("p");
            desc.textContent = p.description || "";

            row.appendChild(a);

            if (desc.textContent) {
                row.appendChild(desc);
            }

            container.appendChild(row);
        });
    } catch (error) {
        console.error("Błąd podcastów:", error);
        container.textContent = "Nie udało się wczytać podcastów.";
    }
}

// =====================
// OSOBY / EKIPA RADIA
// =====================

async function renderPersons() {
    const container =
        document.getElementById("persons_list") ||
        document.querySelector(".persons_display .program_list");

    if (!container || !SITE_ID || !CURRENT_STATION_ID) return;

    const params = new URLSearchParams({
        si: SITE_ID,
        st: CURRENT_STATION_ID
    });

    try {
        const response = await fetch(
            `https://contentlist.krdrtradio.workers.dev/person?${params}`,
            { cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();

        const items = Array.isArray(payload)
            ? payload
            : (payload.persons || payload.people || payload.data || []);

        container.replaceChildren();

        items.forEach(p => {
            const row = document.createElement("article");
            row.className = "program_list_content";

            const a = document.createElement("a");
            a.textContent = p.name || "Osoba";
            a.href = p.url ||
                `people?uid=${encodeURIComponent(p.id || p.uid || "")}` +
                `&st=${encodeURIComponent(SITE_ID)}`;

            a.target = "_blank";
            a.rel = "noopener noreferrer";

            const role = document.createElement("div");
            role.textContent = Array.isArray(p.role)
                ? p.role.join(", ")
                : (p.role || "");

            const desc = document.createElement("p");
            desc.textContent = p.description || "";

            row.appendChild(a);

            if (role.textContent) {
                row.appendChild(role);
            }

            if (desc.textContent) {
                row.appendChild(desc);
            }

            container.appendChild(row);
        });
    } catch (error) {
        console.error("Błąd ekipy:", error);
        container.textContent = "Nie udało się wczytać ekipy.";
    }
}

// =====================
// PRZYCISKI STRON / STACJI
// =====================

function ButtonsSites() {
    const container =
        document.getElementById("stations") ||
        document.getElementById("stations_list") ||
        document.querySelector(".stations");

    if (!container) return;

    container.replaceChildren();

    const stations = Array.isArray(STATIONS) ? STATIONS : [];

    stations.forEach(station => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "station_button";
        button.textContent = station.name || station.title || "Stacja";

        button.dataset.stationId = String(
            station.id ?? station.slug ?? ""
        );

        if (
            String(CURRENT_STATION_ID) ===
            String(station.id ?? station.slug ?? "")
        ) {
            button.classList.add("active");
        }

        button.addEventListener("click", () => {
            renderStations(station.id ?? station.slug);
        });

        container.appendChild(button);
    });
}

// =====================
// WYBÓR STACJI
// =====================

async function renderStations(stationId = null) {
    try {
        const siteName =
            typeof SITE_ID !== "undefined" && SITE_ID
                ? SITE_ID
                : new URLSearchParams(window.location.search).get("name");

        if (!siteName) {
            console.error("Brak parametru name / SITE_ID.");
            return;
        }

        const url =
            "https://station.krdrtradio.workers.dev/?si=" +
            encodeURIComponent(siteName);

        const response = await fetch(url, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const payload = await response.json();

        STATIONS = Array.isArray(payload)
            ? payload
            : payload.stations ||
              payload.data ||
              payload.results ||
              [];

        if (!Array.isArray(STATIONS) || STATIONS.length === 0) {
            console.warn("API nie zwróciło żadnych stacji.");
            return;
        }

        let station = stationId
            ? STATIONS.find(s =>
                String(s.id) === String(stationId) ||
                String(s.slug) === String(stationId)
            )
            : null;

        if (!station) {
            station = STATIONS[0];
        }

        CURRENT_STATION = station;
        CURRENT_STATION_ID = station.id ?? station.slug;

        const title =
            document.getElementById("station_name") ||
            document.querySelector(".station_name");

        if (title) {
            title.textContent = station.name || station.title || "";
        }

        const cover =
            document.getElementById("station_cover") ||
            document.querySelector(".station_cover");

        const image =
            station.cover ||
            station.image ||
            station.thumbnail ||
            station.logo;

        if (cover && image) {
            cover.src = image;
            cover.alt = station.name || station.title || "Stacja radiowa";
        }

        const streamUrl =
            station.stream ||
            station.stream_url ||
            station.url ||
            station.audio_url;

        if (streamUrl) {
            AudioPlayer(streamUrl);
        }

        ButtonsSites();

        await Promise.allSettled([
            renderCurrent(),
            renderSchedules(),
            renderPrograms(),
            renderPodcasts(),
            renderPersons()
        ]);

    } catch (error) {
        console.error("Nie udało się pobrać listy stacji:", error);
    }
}

// =====================
// ODTWARZACZ AUDIO
// =====================

function getAudioElement() {
    return (
        document.getElementById("audio") ||
        document.getElementById("audio_player") ||
        document.querySelector("audio")
    );
}

function AudioPlayer(url) {
    const audio = getAudioElement();

    if (!audio) {
        console.error("Nie znaleziono elementu audio w HTML.");
        return;
    }

    if (!url || typeof url !== "string") {
        console.error("Nieprawidłowy adres strumienia audio.");
        return;
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(url, window.location.href);
    } catch {
        console.error("Nie można odczytać adresu strumienia:", url);
        return;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        console.error("Niedozwolony protokół strumienia.");
        return;
    }

    CURRENT_STREAM_URL = parsedUrl.href;

    // Zatrzymaj poprzedni strumień.
    audio.pause();

    if (hlsInstance) {
        try {
            hlsInstance.destroy();
        } catch (error) {
            console.warn("Błąd zamykania poprzedniego HLS:", error);
        }

        hlsInstance = null;
    }

    audio.removeAttribute("src");
    audio.load();

    // Jeśli strumień korzysta z HLS.
    const isHls = /\.m3u8(?:$|[?#])/i.test(CURRENT_STREAM_URL);

    if (
        isHls &&
        typeof Hls !== "undefined" &&
        Hls.isSupported()
    ) {
        hlsInstance = new Hls();

        hlsInstance.loadSource(CURRENT_STREAM_URL);
        hlsInstance.attachMedia(audio);

        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
            if (data && data.fatal) {
                console.error("Krytyczny błąd HLS:", data);

                try {
                    hlsInstance.destroy();
                } catch {}

                hlsInstance = null;
            }
        });

        return;
    }

    // Natywne HLS, np. Safari.
    if (
        isHls &&
        audio.canPlayType("application/vnd.apple.mpegurl")
    ) {
        audio.src = CURRENT_STREAM_URL;
        audio.load();
        return;
    }

    // Zwykły strumień audio.
    // Używaj proxy tylko wtedy, gdy jest ono skonfigurowane
    // i obsługuje konkretny adres źródłowy.
    audio.src = CURRENT_STREAM_URL;
    audio.load();
}

// =====================
// ODTWARZANIE / PAUZA
// =====================

async function PlayAudio() {
    const audio = getAudioElement();

    if (!audio) return;

    try {
        await audio.play();
    } catch (error) {
        console.error("Nie udało się rozpocząć odtwarzania:", error);
    }
}

function PauseAudio() {
    const audio = getAudioElement();

    if (audio) {
        audio.pause();
    }
}

async function ToggleAudio() {
    const audio = getAudioElement();

    if (!audio) return;

    if (audio.paused) {
        await PlayAudio();
    } else {
        PauseAudio();
    }
}

// =====================
// PONOWNE POŁĄCZENIE
// =====================

function ReloadAudio() {
    if (!CURRENT_STREAM_URL) {
        const station = CURRENT_STATION;

        if (station) {
            CURRENT_STREAM_URL =
                station.stream ||
                station.stream_url ||
                station.url ||
                station.audio_url ||
                "";
        }
    }

    if (!CURRENT_STREAM_URL) {
        console.warn("Brak adresu strumienia do ponownego połączenia.");
        return;
    }

    AudioPlayer(CURRENT_STREAM_URL);
    PlayAudio();
}

// =====================
// PRZYCISK ODTWARZANIA
// =====================

function setupAudioControls() {
    const playButton =
        document.getElementById("play") ||
        document.getElementById("play_button") ||
        document.querySelector(".play_button");

    const pauseButton =
        document.getElementById("pause") ||
        document.getElementById("pause_button") ||
        document.querySelector(".pause_button");

    const toggleButton =
        document.getElementById("toggle_audio");

    const reloadButton =
        document.getElementById("reload_audio") ||
        document.getElementById("reload_button");

    if (playButton) {
        playButton.addEventListener("click", PlayAudio);
    }

    if (pauseButton) {
        pauseButton.addEventListener("click", PauseAudio);
    }

    if (toggleButton) {
        toggleButton.addEventListener("click", ToggleAudio);
    }

    if (reloadButton) {
        reloadButton.addEventListener("click", ReloadAudio);
    }
}

// =====================
// OBSŁUGA BŁĘDÓW AUDIO
// =====================

function setupAudioEvents() {
    const audio = getAudioElement();

    if (!audio) return;

    audio.addEventListener("playing", () => {
        document.body.classList.add("audio-playing");
        document.body.classList.remove("audio-error");
    });

    audio.addEventListener("pause", () => {
        document.body.classList.remove("audio-playing");
    });

    audio.addEventListener("waiting", () => {
        document.body.classList.add("audio-loading");
    });

    audio.addEventListener("playing", () => {
        document.body.classList.remove("audio-loading");
    });

    audio.addEventListener("error", () => {
        document.body.classList.remove("audio-loading");
        document.body.classList.add("audio-error");

        console.error(
            "Błąd odtwarzania. Sprawdź adres strumienia, CORS i dostępność serwera."
        );
    });
}

// =====================
// WYSZUKIWANIE PROGRAMÓW
// =====================

function setupProgramSearch() {
    const input = document.getElementById("searchInput");

    if (!input) return;

    let timeout = null;

    input.addEventListener("input", () => {
        clearTimeout(timeout);

        timeout = setTimeout(() => {
            renderPrograms();
        }, 250);
    });
}

// =====================
// INICJALIZACJA
// =====================

async function initRadioPlayer() {
    setupAudioControls();
    setupAudioEvents();
    setupProgramSearch();

    openDayFromURL();

    if (Array.isArray(STATIONS) && STATIONS.length > 0) {
        renderStations(
            CURRENT_STATION_ID || STATIONS[0].id || STATIONS[0].slug
        );
    }
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initRadioPlayer,
        { once: true }
    );
} else {
    initRadioPlayer();
}
