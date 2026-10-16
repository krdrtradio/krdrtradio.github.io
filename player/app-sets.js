let sets = [];
let currentIndex = 0;
let currentTracks = [];
let currentTrackIndex = -1;
let requestId = 0;
const favKey = "fav_djs";
/* MENU */
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
if (menuBtn && sidebar && overlay) {
    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("active");
        overlay.classList.toggle("active");
    });
    overlay.addEventListener("click", () => {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
    });
}
/* LOAD JSON */
async function loadSets() {
    try {
        const res = await fetch("https://sets.krdrtradio.workers.dev/allsets");
        if (!res.ok) {
            throw new Error("HTTP " + res.status);
        }
        sets = await res.json();
        buildList();
        if (sets.length > 0) {
            setActive(0);
            await renderArtist(0);
        }
    } catch (error) {
        console.error("Błąd ładowania DJ-ów:", error);
    }
}
/* BUILD LIST */
function buildList() {
    const container = document.getElementById("set-container");
    if (!container) {
        console.error('Brak elementu #set-container w HTML');
        return;
    }
    container.innerHTML = "";
    let favs = [];
    try {
        favs = JSON.parse(localStorage.getItem(favKey) || "[]");
    } catch {
        favs = [];
    }
    sets.forEach((dj, i) => {
        const div = document.createElement("div");
        div.className = "station-item";
        div.dataset.index = i;
        const name = document.createElement("span");
        name.textContent = dj.name;
        const fav = document.createElement("span");
        fav.className = "fav";
        fav.textContent = "⭐";
        fav.style.opacity = favs.includes(dj.name) ? "1" : "0.3";
        div.append(name, fav);
        div.addEventListener("click", (e) => {
            if (e.target.closest(".fav")) {
                toggleFav(dj.name);
                return;
            }
            setActive(i);
            renderArtist(i);
        });
        container.appendChild(div);
    })
    setActive(currentIndex);
}
/* FAVORITES */
function toggleFav(name) {
    let favs = [];
    try {
        favs = JSON.parse(localStorage.getItem(favKey) || "[]");
    } catch {
        favs = [];
    }
    if (favs.includes(name)) {
        favs = favs.filter(f => f !== name);
    } else {
        favs.push(name);
    }
    localStorage.setItem(favKey, JSON.stringify(favs));
    buildList();
}
/* ACTIVE DJ */
function setActive(i) {
    currentIndex = i;
    document.querySelectorAll(".station-item").forEach(el => {
        el.classList.toggle("active", Number(el.dataset.index) === i);
    });
}
/* RENDER DJ */
async function renderArtist(i) {
    const dj = sets[i];
    if (!dj) return;
    currentIndex = i;
    const thisRequest = ++requestId;
    const stationEl = document.getElementById("currentStation");
    const container = document.getElementById("tracksContainer");
    const links = document.getElementById("artistLinks");
    if (stationEl) stationEl.textContent = dj.name;
    if (container) container.textContent = "Ładowanie setów...";
    if (links) links.innerHTML = "";
    try {
        const url = "https://sets.krdrtradio.workers.dev/?m=" + encodeURIComponent(dj.name);
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error("HTTP " + res.status);
        }
        const artist = await res.json();
        // Nie nadpisuj widoku, jeśli użytkownik wybrał
        // innego DJ-a podczas pobierania danych.
        if (thisRequest !== requestId) return;
        const tracks = Array.isArray(artist.station) ? artist.station : [];
        currentTracks = tracks;
        currentTrackIndex = -1;
        /* ARTIST LINKS */
        const linkLabels = [
            ["youtube", "YouTube"],
            ["mixcloud", "Mixcloud"],
            ["soundcloud", "SoundCloud"],
            ["podcasts", "Podcasty"],
            ["sets", "Sety"]
        ];
        if (links) {
            links.innerHTML = "";
            linkLabels.forEach(([key, label]) => {
                if (!artist[key]) return;
                const a = document.createElement("a");
                a.href = artist[key];
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.textContent = label;
                links.appendChild(a);
            });
        }
        /* TRACK LIST */
        if (!container) return;
        container.innerHTML = "";
        if (tracks.length === 0) {
            container.textContent = "Brak dostępnych setów.";
            return;
        }
        tracks.forEach((track, idx) => {
            const div = document.createElement("div");
            div.className = "track-card";
            const title = document.createElement("div");
            title.className = "track-title";
            title.textContent = track.name || "Nieznany set";
            div.appendChild(title);
            if (track.audio && track.track) {
                const button = document.createElement("button");
                button.type = "button";
                button.textContent = "▶ Play";
                button.addEventListener("click", () => {
                    const src = "https://cors.krdrtradio.workers.dev/?url=" + encodeURIComponent(track.track);
                    playTrack(src, i, idx);
                });
                div.appendChild(button);
            } else if (track.track) {
                const a = document.createElement("a");
                a.className = "link-btn";
                a.href = track.track;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.textContent = "Otwórz link";
                div.appendChild(a);
            }
            container.appendChild(div);
        });
    } catch (error) {
        if (thisRequest !== requestId) return;
        console.error("Błąd renderArtist:", error);
        if (container) {
            container.textContent = "Nie udało się pobrać setów.";
        }
    }
}
/* GLOBAL PLAYER */
async function playTrack(src, djIndex, trackIndex) {
    const player = document.getElementById("globalPlayer");
    const playerText = document.getElementById("globalText");
    const mini = document.getElementById("miniPlayer");
    if (!player) {
        console.error('Brak elementu audio #globalPlayer');
        return;
    }
    // Nie odtwarzaj utworu z listy innego DJ-a.
    if (djIndex !== currentIndex) return;
    const track = currentTracks[trackIndex];
    if (!track) {
        console.error("Nie znaleziono setu:", trackIndex);
        return;
    }
    player.src = src;
    if (playerText) {
        playerText.textContent = track.name || "Nieznany set";
    }
    if (mini) {
        mini.style.display = "flex";
    }
    currentTrackIndex = trackIndex;
    window.currentTrackIndex = trackIndex;
    try {
        await player.play();
    } catch (error) {
        console.error("Błąd odtwarzania:", error);
    }
}
/* AUTO NEXT */
const globalPlayer = document.getElementById("globalPlayer");
if (globalPlayer) {
    globalPlayer.addEventListener("ended", () => {
        const next = currentTrackIndex + 1;
        if (next < currentTracks.length) {
            const track = currentTracks[next];
            if (track.audio && track.track) {
                const src = "https://cors.krdrtradio.workers.dev/?url=" + encodeURIComponent(track.track);
                playTrack(src, currentIndex, next);
            }
        }
    });
}
/* SHUFFLE */
function shuffleSets() {
    if (sets.length < 2) return;
    const currentDJ = sets[currentIndex];
    // Tasuj listę bez zmiany zawartości tablicy sets
    // w trakcie aktywnego odtwarzania.
    const shuffled = [...sets];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    sets = shuffled;
    const newIndex = sets.findIndex(dj => dj.name === currentDJ?.name);
    currentIndex = newIndex >= 0 ? newIndex : 0;
    buildList();
    setActive(currentIndex);
    renderArtist(currentIndex);
}
/* SEARCH */
const setsSearch = document.getElementById("setsSearch");
if (setsSearch) {
    setsSearch.addEventListener("input", function() {
        const q = this.value.toLowerCase();
        document.querySelectorAll(".station-item").forEach(el => {
            el.style.display = el.textContent.toLowerCase().includes(q) ? "flex" : "none";
        });
    });
}
/* START */
loadSets();
