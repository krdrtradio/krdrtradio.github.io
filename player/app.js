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

let currentPlaylist = "Radio";
let currentStation = null;
let currentElement = null;

let playlistInterval = null;
let hls = null;

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

    const stations =
        await response.json();

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

updateDirectLink(streamSelect.value);


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
    streamSelect.value ||
    station.stream
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
        !station.metadata ||
        !station.metadata.function
    ) {

        resultTrack.textContent = "";

        return;
    }

    const fn =
        station.metadata.function;

    const arg =
        station.metadata.argument;

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

downloadBtn.onclick = () => {


const fileName =
    `${currentPlaylist}.json`;

const link =
    document.createElement("a");

link.href = fileName;

link.download = fileName;

document.body.appendChild(link);

link.click();

document.body.removeChild(link);


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
