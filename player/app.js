/* =========================
   ODTWARZACZ RADIA — POPRAWIONY JAVASCRIPT
   ========================= */
"use strict";
const $ = (id) => document.getElementById(id);
const sidebar = $("sidebar");
const overlay = $("overlay");
const menuBtn = $("menuBtn");
const playlistSelect = $("playlistSelect");
const stationSearch = $("stationSearch");
const container = $("playlist-container");
const player = $("player");
const currentStationText = $("currentStation");
const currentStationFrequency = $("currentStationFrequency");
const reloadBtn = $("reloadBtn");
const downloadBtn = $("downloadBtn");
const streamContainer = $("streamContainer");
const streamSelect = $("streamSelect");
const resultCurrentProgram = $("resultCurrentProgram");
const resultTrack = $("resultTrack");
const resultSite = $("resultSite");
const resultOpenStreamLink = $("resultOpenStreamLink");
const resultGoToRadios = $("resultGoToRadios");
const resultGoToMedia = $("resultGoToMedia");
const resultGoToSchedule = $("resultGoToSchedule");
const resultGoToPodcast = $("resultGoToPodcast");
let currentPlaylist = "miniradio";
let currentStation = null;
let currentElement = null;
let stations = [];
let playlistInterval = null;
let scheduleInterval = null;
let scheduleAppInterval = null;
let hls = null;
let currentScheduleRequest = 0;
const API = {
    playlists: "https://radios.krdrtradio.workers.dev/",
    currentProgram: "https://current-program.krdrtradio.workers.dev/",
    radioPlug: "https://radio-plug.krdrtradio.workers.dev/",
    httpStreamProxy: "https://stream.krdrtradio.workers.dev/"
};
/* =========================
   POMOCNICZE
   ========================= */
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function safeHttpUrl(value) {
    if (typeof value !== "string" || !value.trim()) {
        return "";
    }
    try {
        const url = new URL(value, window.location.href);
        return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
        return "";
    }
}

function stopTimer(timer) {
    if (timer !== null) {
        clearInterval(timer);
    }
    return null;
}
/* =========================
   MENU
   ========================= */
function closeMenu() {
    sidebar?.classList.remove("active");
    overlay?.classList.remove("active");
}

function openMenu() {
    sidebar?.classList.add("active");
    overlay?.classList.add("active");
}
menuBtn?.addEventListener("click", openMenu);
overlay?.addEventListener("click", closeMenu);
/* =========================
   WYBÓR PLAYLISTY
   ========================= */
playlistSelect?.addEventListener("change", () => {
    currentPlaylist = playlistSelect.value || "miniradio";
    fetchPlaylist(currentPlaylist);
});
/* =========================
   WYSZUKIWANIE STACJI
   ========================= */
stationSearch?.addEventListener("input", () => {
    const search = (stationSearch.value || "").trim().toLocaleLowerCase();
    container?.querySelectorAll(".station-item").forEach((item) => {
        item.hidden = !item.textContent.toLocaleLowerCase().includes(search);
    });
});
/* =========================
   POBIERANIE PLAYLISTY
   ========================= */
async function fetchPlaylist(name) {
    if (!container) return;
    try {
        const url = new URL(API.playlists);
        url.searchParams.set("r", name);
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        // API może zwracać tablicę albo obiekt z tablicą station.
        const playlist = Array.isArray(data) ? data : Array.isArray(data.station) ? data.station : null;
        if (!playlist) {
            throw new Error("Nieprawidłowa struktura JSON playlisty.");
        }
        stations = playlist;
        display(stations);
        console.log(`Załadowano ${stations.length} stacji z playlisty: ${name}`);
    } catch (error) {
        console.error("Błąd ładowania playlisty:", error);
        container.replaceChildren();
        const message = document.createElement("p");
        message.textContent = "Nie udało się załadować playlisty. Spróbuj ponownie.";
        container.appendChild(message);
    }
}
/* =========================
   WYŚWIETLANIE STACJI
   ========================= */
function display(list) {
    if (!container) return;
    if (typeof window.no_stations !== "undefined" && window.no_stations) {
        return;
    }
    const fragment = document.createDocumentFragment();
    list.forEach((station) => {
        if (!station || typeof station !== "object") {
            return;
        }
        const div = document.createElement("div");
        div.type = "div";
        div.className = "station-item";
        div.textContent = station.name || "Nieznana stacja";
        div.setAttribute("aria-pressed", "false");
        div.addEventListener("click", () => {
            play(station, div);
        });
        fragment.appendChild(div);
    });
    container.replaceChildren(fragment);
    if (stationSearch?.value) {
        stationSearch.dispatchEvent(new Event("input"));
    }
}
/* =========================
   NORMALIZACJA ADRESU STREAMU
   ========================= */
function normalizeStreamUrl(value) {
    const url = safeHttpUrl(value);
    if (!url) return "";
    try {
        const parsed = new URL(url);
        if (parsed.protocol === "http:") {
            const proxy = new URL(API.httpStreamProxy);
            proxy.searchParams.set("src", url);
            return proxy.toString();
        }
    } catch (error) {
        console.warn("Nieprawidłowy adres strumienia:", error);
    }
    return url;
}
/* =========================
   ODTWARZANIE STACJI
   ========================= */
function play(station, element) {
    if (!station || typeof station !== "object") {
        return;
    }
    currentStation = station;
    currentElement = element || null;
    container?.querySelectorAll(".station-item").forEach((item) => {
        const active = item === element;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
    });
    if (currentStationText) {
        currentStationText.textContent = "Teraz grasz: " + (station.name || "Nieznana stacja");
    }
    if (currentStationFrequency) {
        currentStationFrequency.textContent = station.frequency || "";
    }
    createStreamOptions(station);
    const selectedStream = streamSelect?.value || station.stream || "";
    const streamUrl = normalizeStreamUrl(selectedStream);
    if (streamUrl) {
        loadStream(streamUrl);
    } else {
        stopPlayback();
        console.warn("Ta stacja nie ma prawidłowego adresu strumienia.");
    }
    updateStationLinks(station);
    startMetadata(station);
    if (resultCurrentProgram) {
        resultCurrentProgram.replaceChildren();
    }
    scheduleInterval = stopTimer(scheduleInterval);
    scheduleAppInterval = stopTimer(scheduleAppInterval);
    currentScheduleRequest++;
    if (station.schedule_app) {
        runScheduleApp(station.schedule_app);
        scheduleAppInterval = setInterval(() => {
            runScheduleApp(station.schedule_app);
        }, 60000);
    } else if (station.schedule) {
        loadSchedule(station.schedule, station.radio_plug === true);
        scheduleInterval = setInterval(() => {
            loadSchedule(station.schedule, station.radio_plug === true);
        }, 60000);
    }
    if (player) {
        player.style.display = "block";
    }
    closeMenu();
}
/* =========================
   DODATKOWE STRUMIENIE
   ========================= */
function createStreamOptions(station) {
    if (!streamSelect || !streamContainer) {
        return;
    }
    streamSelect.replaceChildren();
    const streams = station.streams && typeof station.streams === "object" ? Object.entries(station.streams).filter(([, url]) => safeHttpUrl(url)) : [];
    if (streams.length > 0) {
        streams.forEach(([type, url]) => {
            const option = document.createElement("option");
            option.value = url;
            option.textContent = String(type).toUpperCase();
            streamSelect.appendChild(option);
        });
        streamContainer.style.display = "block";
    } else {
        streamContainer.style.display = "none";
    }
}
streamSelect?.addEventListener("change", () => {
    if (!currentStation) return;
    const url = normalizeStreamUrl(streamSelect.value);
    if (url) {
        loadStream(url);
    }
    updateDirectLink(currentStation.open_stream_link || streamSelect.value);
});
/* =========================
   ZATRZYMYWANIE ODTWARZANIA
   ========================= */
function stopPlayback() {
    if (hls) {
        hls.destroy();
        hls = null;
    }
    if (player) {
        player.pause();
        player.removeAttribute("src");
        player.load();
    }
}
/* =========================
   ŁADOWANIE STRUMIENIA
   ========================= */
function loadStream(url) {
    const safeUrl = safeHttpUrl(url);
    if (!safeUrl || !player) {
        return;
    }
    if (hls) {
        hls.destroy();
        hls = null;
    }
    player.pause();
    if (safeUrl.includes(".m3u8") && window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls();
        hls.on(window.Hls.Events.ERROR, (_event, data) => {
            if (data?.fatal) {
                console.error("Błąd odtwarzania HLS:", data);
                if (hls) {
                    hls.destroy();
                    hls = null;
                }
            }
        });
        hls.loadSource(safeUrl);
        hls.attachMedia(player);
    } else {
        player.src = safeUrl;
        player.load();
    }
    const playPromise = player.play();
    if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((error) => {
            console.info("Odtwarzanie może wymagać ręcznego uruchomienia:", error?.message || error);
        });
    }
}
/* =========================
   BEZPIECZNE LINKI
   ========================= */
function setSafeLink(target, url, label) {
    if (!target) return;
    target.replaceChildren();
    const safeUrl = safeHttpUrl(url);
    if (!safeUrl) return;
    const link = document.createElement("a");
    link.href = safeUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = label;
    target.appendChild(link);
}
/* =========================
   LINKI STACJI
   ========================= */
function updateStationLinks(station) {
    setSafeLink(resultSite, station.site, "Przejdź na witrynę");
    setSafeLink(resultGoToRadios, station.goto_site, "Przejdź na moje radio");
    setSafeLink(resultGoToMedia, station.goto_media, "Przejdź na moje media");
    setSafeLink(resultGoToSchedule, station.goto_schedule, "Przejdź na moje ramówki i programy");
    setSafeLink(resultGoToPodcast, station.goto_podcast, "Przejdź na moje podcasty");
    updateDirectLink(station.open_stream_link || station.stream);
}

function updateDirectLink(url) {
    setSafeLink(resultOpenStreamLink, url, "Bezpośredni link do strumienia");
}
/* =========================
   METADANE UTWORÓW
   ========================= */
function startMetadata(station) {
    playlistInterval = stopTimer(playlistInterval);
    const updateTrack = () => {
        const playlist = station?.playlist;
        if (!playlist || typeof playlist.function !== "string") {
            if (resultTrack) {
                resultTrack.textContent = "";
            }
            return;
        }
        const fn = window[playlist.function];
        if (typeof fn === "function") {
            try {
                fn(playlist.argument);
            } catch (error) {
                console.error("Błąd aktualizacji informacji o utworze:", error);
            }
        }
    };
    updateTrack();
    playlistInterval = setInterval(updateTrack, 20000);
}
/* =========================
   BEZPIECZNE KOLORY CSS
   ========================= */
function safeCssColor(value) {
    if (typeof value !== "string") {
        return "";
    }
    const color = value.trim();
    if (/^(#[0-9a-f]{3,8}|[a-z]{1,20}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\))$/i.test(color)) {
        return color;
    }
    return "";
}
/* =========================
   TWORZENIE WIDOKU RAMÓWKI
   ========================= */
function makeProgramMarkup(data, includeItem = true) {
    const thumb = data?.thumb && typeof data.thumb === "object" ? data.thumb : null;
    let thumbnailText = "";
    if (data?.thumbnail_uri) {
        const imageUrl = safeHttpUrl(data.thumbnail_uri);
        if (imageUrl) {
            thumbnailText = `<div class="onair_photo"><img src="${escapeHTML(imageUrl)}" alt="${escapeHTML(data.name || "")}" loading="lazy" width="50" height="50"></div>`;
        }
    } else if (thumb && !(thumb.background === null && thumb.color === null && thumb.name === null)) {
        const background = safeCssColor(thumb.background);
        const color = safeCssColor(thumb.color);
        const style = `${background ? `background:${background};` : ""}` + `${color ? `color:${color};` : ""}`;
        thumbnailText = `
            <div class="onair_photo">
                <div class="onair_name_box" style="${style}">
                    ${escapeHTML(thumb.name || data?.name || "")}
                </div>
            </div>
        `;
    }
    const item = includeItem && data?.item ? `<span class="onair_item">${escapeHTML(data.item)}</span><br>` : "";
    const name = escapeHTML(data?.name || "");
    const host = data?.host ? `<br><small>${escapeHTML(data.host)}</small>` : "";
    return `<small>Na antenie:</small><div class="onair_program">${thumbnailText}<div class="onair_content">${item}${name}${host}</div></div>`;
}
/* =========================
   POBIERANIE RAMÓWKI
   ========================= */
async function requestProgram(baseUrl, schedule) {
    const url = new URL(baseUrl);
    url.searchParams.set("si", String(schedule.site ?? ""));
    url.searchParams.set("st", String(schedule.station ?? ""));
    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
}
async function loadSchedule(schedule, radio_plug = false) {
    if (!schedule || !resultCurrentProgram) {
        return;
    }
    const requestId = ++currentScheduleRequest;
    try {
        let data = await requestProgram(API.currentProgram, schedule);
        if (requestId !== currentScheduleRequest) {
            return;
        }
        // Jeśli stacja wymaga radio_plug, pobierz ramówkę z tego API.
        if (radio_plug || data?.success === false) {
            data = await requestProgram(API.radioPlug, schedule);
            if (requestId !== currentScheduleRequest) {
                return;
            }
        }
        if (data?.success) {
            resultCurrentProgram.innerHTML = makeProgramMarkup(data, true);
        } else {
            resultCurrentProgram.replaceChildren();
        }
    } catch (error) {
        if (requestId === currentScheduleRequest) {
            console.error("Błąd pobierania ramówki:", error);
            resultCurrentProgram.replaceChildren();
        }
    }
}
/* =========================
   ZEWNĘTRZNA APLIKACJA RAMÓWKI
   ========================= */
function runScheduleApp(scheduleApp) {
    if (!scheduleApp || typeof scheduleApp.function !== "string") {
        return;
    }
    const fn = window[scheduleApp.function];
    if (typeof fn !== "function") {
        return;
    }
    const args = Array.isArray(scheduleApp.argument) ? scheduleApp.argument : scheduleApp.argument === undefined ? [] : [scheduleApp.argument];
    try {
        fn(...args);
    } catch (error) {
        console.error("Błąd uruchamiania aplikacji ramówki:", error);
    }
}
/* =========================
   PRZEŁADOWANIE STACJI
   ========================= */
reloadBtn?.addEventListener("click", () => {
    if (currentStation) {
        play(currentStation, currentElement);
    }
});
/* =========================
   POBIERANIE PLAYLISTY M3U
   ========================= */
downloadBtn?.addEventListener("click", async () => {
    try {
        const url = new URL(API.playlists);
        url.searchParams.set("r", currentPlaylist);
        const response = await fetch(url.toString());
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const playlist = await response.json();
        if (playlistData.length === 0) {
            console.warn("Brak stacji do pobrania.");
            return;
        }
        if (typeof window.no_stations !== "undefined" && window.no_stations) {
            return;
        }
        const lines = ["#EXTM3U", ""];
        playlistData.forEach((station) => {
            if (!station || typeof station !== "object") {
                return;
            }
            const name = String(station.name || "Nieznana stacja").replace(/[\r\n]/g, " ");
            const mainStream = safeHttpUrl(station.stream);
            if (mainStream) {
                lines.push(`#EXTINF:-1,${name}`, mainStream, "");
            }
            if (station.streams && typeof station.streams === "object") {
                Object.entries(station.streams).forEach(
                    ([type, streamUrl]) => {
                        const safeUrl = safeHttpUrl(streamUrl);
                        if (!safeUrl) {
                            return;
                        }
                        lines.push(`#EXTINF:-1,${name} (${String(type).toUpperCase()})`, safeUrl, "");
                    });
            }
        });
        const blob = new Blob(
            [lines.join("\r\n")], {
                type: "audio/x-mpegurl;charset=utf-8"
            });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = `${String(currentPlaylist).replace(/[^a-z0-9_-]/gi, "_") || "playlist"}.m3u`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
        }, 1000);
    } catch (error) {
        console.error("Błąd pobierania playlisty:", error);
        alert("Nie udało się pobrać playlisty.");
    }
});
/* =========================
   PARAMETR URL
   Przykład: ?r=miniradio
   ========================= */
const params = new URLSearchParams(window.location.search);
const playlistParam = params.get("r");
if (playlistParam) {
    currentPlaylist = playlistParam;
    if (playlistSelect) {
        playlistSelect.value = playlistParam;
    }
}
/* =========================
   START APLIKACJI
   ========================= */
fetchPlaylist(currentPlaylist);
/* =========================
   SPRZĄTANIE PO OPUSZCZENIU STRONY
   ========================= */
window.addEventListener("beforeunload", () => {
    playlistInterval = stopTimer(playlistInterval);
    scheduleInterval = stopTimer(scheduleInterval);
    scheduleAppInterval = stopTimer(scheduleAppInterval);
    if (hls) {
        hls.destroy();
        hls = null;
    }
});
