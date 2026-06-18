const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const menuBtn = document.getElementById("menuBtn");

const playlistSelect = document.getElementById("playlistSelect");
const stationSearch = document.getElementById("stationSearch");

const container = document.getElementById("playlist-container");

const player = document.getElementById("player");

const currentStationText =
document.getElementById("currentStation");

const reloadBtn = document.getElementById("reloadBtn");
const downloadBtn = document.getElementById("downloadBtn");

const streamContainer =
document.getElementById("streamContainer");

const streamSelect =
document.getElementById("streamSelect");

const resultTrack =
document.getElementById("resultTrack");

const resultSite =
document.getElementById("resultSite");

const resultOpenStreamLink =
document.getElementById("resultOpenStreamLink");

let currentPlaylist = "radio";
let currentStation = null;
let currentElement = null;

let stations = [];

let playlistInterval = null;
let scheduleInterval = null;
let scheduleAppInterval = null;
let hls = null;
let currentScheduleRequest = 0;

/* MENU */

menuBtn.onclick = () => {
sidebar.classList.add("active");
overlay.classList.add("active");
};

overlay.onclick = closeMenu;

function closeMenu() {
sidebar.classList.remove("active");
overlay.classList.remove("active");
}

/* PLAYLIST */

playlistSelect.onchange = (e) => {
currentPlaylist = e.target.value;
fetchPlaylist(currentPlaylist);
};

/* SEARCH */

stationSearch.oninput = () => {


const search =
    stationSearch.value.toLowerCase();

document
    .querySelectorAll(".station-item")
    .forEach(item => {

        item.style.display =
            item.textContent
                .toLowerCase()
                .includes(search)
            ? ""
            : "none";
    });


};

/* FETCH JSON */

async function fetchPlaylist(name) {

    try {

        const response =
            await fetch(`${name}.json`);

        if (!response.ok) {
            throw new Error();
        }

        stations = await response.json();

        display(stations);

    } catch (err) {

        alert("Błąd ładowania playlisty");

        console.error(err);
    }
}

/* DISPLAY */

function display(list) {


container.innerHTML = "";

list.forEach(station => {

    const div =
        document.createElement("div");

    div.className = "station-item";

    div.textContent =
        station.name;

    div.onclick = () =>
        play(station, div);

    container.appendChild(div);
});


}

/* PLAY */

function play(station, element) {


currentStation = station;
currentElement = element;

document
    .querySelectorAll(".station-item")
    .forEach(item =>
        item.classList.remove("active")
    );

element.classList.add("active");

currentStationText.textContent =
    "Teraz grasz: " + station.name;

createStreamOptions(station);

const firstStream =
    streamSelect.value ||
    station.stream;

loadStream(firstStream);

updateStationLinks(station);

startMetadata(station);

if (scheduleInterval) {
    clearInterval(scheduleInterval);
}

if (scheduleAppInterval) {
    clearInterval(scheduleAppInterval);
}

loadSchedule(station.schedule);

scheduleInterval = setInterval(() => {
    loadSchedule(station.schedule);
}, 60000);

runScheduleApp(station.schedule_app);

scheduleAppInterval = setInterval(() => {
    runScheduleApp(station.schedule_app);
}, 60000);

player.style.display = "block";

closeMenu();


}

/* STREAM OPTIONS */

function createStreamOptions(station) {


streamSelect.innerHTML = "";

if (
    station.streams &&
    Object.keys(station.streams).length
) {

    Object.entries(station.streams)
        .forEach(([type, url]) => {

            const option =
                document.createElement("option");

            option.value = url;

            option.textContent =
                type.toUpperCase();

            streamSelect.appendChild(option);
        });

    streamContainer.style.display =
        "block";

} else {

    streamContainer.style.display =
        "none";
}


}

streamSelect.onchange = () => {


if (!currentStation) return;

loadStream(streamSelect.value);

updateDirectLink(station.open_stream_link);


};

/* LOAD STREAM */

function loadStream(url) {


if (hls) {

    hls.destroy();

    hls = null;
}

if (
    url.includes(".m3u8") &&
    window.Hls &&
    Hls.isSupported()
) {

    hls = new Hls();

    hls.loadSource(url);

    hls.attachMedia(player);

} else {

    player.src = url;
}

player.play().catch(() => {});


}

/* LINKS */

function updateStationLinks(station) {


if (station.site) {

    resultSite.innerHTML =
        `<a href="${station.site}" target="_blank">
            Przejdź na witrynę
        </a>`;

} else {

    resultSite.innerHTML = "";
}

updateDirectLink(
    station.open_stream_link
);


}

function updateDirectLink(url) {


if (!url) {

    resultOpenStreamLink.innerHTML =
        "";

    return;
}

resultOpenStreamLink.innerHTML =
    `<a href="${url}" target="_blank">
        Bezpośredni link do strumienia
    </a>`;


}

/* NOW PLAYING */

function startMetadata(station) {


if (playlistInterval) {

    clearInterval(
        playlistInterval
    );
}

const updateTrack = () => {

    if (
        !station.playlist ||
        !station.playlist.function
    ) {

        resultTrack.textContent = "";

        return;
    }

    const fn =
        station.playlist.function;

    const arg =
        station.playlist.argument;

    if (
        typeof window[fn] ===
        "function"
    ) {

        window[fn](arg);
    }
};

updateTrack();

playlistInterval =
    setInterval(
        updateTrack,
        20000
    );


}


async function loadSchedule(schedule) {

    if (!schedule) return;

    const requestId = ++currentScheduleRequest;

    const url =
        `https://current-program.krdrtradio.workers.dev/?si=${schedule.site}&st=${schedule.station}`;

    try {

        const res = await fetch(url);

        if (!res.ok) {
            throw new Error("API error");
        }

        const data = await res.json();

        // ignoruj stare odpowiedzi
        if (requestId !== currentScheduleRequest) {
            return;
        }

        const container =
            document.getElementById("resultCurrentProgram");

        if (!container) return;

        if (data.success) {

            container.innerHTML =
                `<small>Na antenie:</small><br>${data.name}${data.host ? "<br><small>" + data.host + "</small>": ""}`;

        } else {

            container.innerHTML = "";
        }

    } catch (e) {

        console.error("Schedule error:", e);
    }
}

function runScheduleApp(schedule_app) {

    if (!schedule_app) return;

    const fn = schedule_app.function;
    const args = schedule_app.argument;

    if (typeof window[fn] === "function") {
        window[fn](...args);
    }
}

/* RELOAD */

reloadBtn.onclick = () => {


if (
    currentStation &&
    currentElement
) {

    play(
        currentStation,
        currentElement
    );
}


};

/* DOWNLOAD */

downloadBtn.onclick = async () => {

    const res = await fetch(`${currentPlaylist}.json`);

    if (!res.ok) return;

    const stations = await res.json();

    if (!stations.length) return;

    let m3u = "#EXTM3U\n\n";

    stations.forEach(station => {
        m3u += `#EXTINF:-1,${station.name}\n`;
        m3u += `${station.stream}\n\n`;
    });

    const blob = new Blob([m3u], {
        type: "audio/x-mpegurl"
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentPlaylist}.m3u`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
};

/* URL PARAMETER */

const params =
new URLSearchParams(
window.location.search
);

const playlistParam =
params.get("r");

if (playlistParam) {


currentPlaylist =
    playlistParam;

playlistSelect.value =
    playlistParam;


}

/* START */

fetchPlaylist(
currentPlaylist
);
