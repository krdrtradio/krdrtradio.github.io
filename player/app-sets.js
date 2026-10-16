let sets = [];
let currentIndex = 0;
const favKey = "fav_djs";
/* MENU */
document.getElementById("menuBtn").onclick = () => {
    document.getElementById("sidebar").classList.toggle("active");
    document.getElementById("overlay").classList.toggle("active");
};
document.getElementById("overlay").onclick = () => {
    document.getElementById("sidebar").classList.remove("active");
    document.getElementById("overlay").classList.remove("active");
};
/* LOAD JSON */
async function loadSets() {
    try {
        const res = await fetch("https://sets.krdrtradio.workers.dev/allsets");
        if (!res.ok) throw new Error("Nie udało się pobrać listy DJ-ów");
        sets = await res.json();
        buildList();
        if (sets.length > 0) {
            setActive(0);
            await renderArtist(0);
        }
    } catch (error) {
        console.error("Błąd ładowania:", error);
    }
}
/* BUILD LIST */
function buildList() {
    const container = document.getElementById("set-container");
    container.innerHTML = "";
    const favs = JSON.parse(localStorage.getItem(favKey) || "[]");
    sets.forEach((dj, i) => {
        const div = document.createElement("div");
        div.className = "station-item";
        div.innerHTML = `
            <span>${dj.name}</span>
            <span class="fav">⭐</span>
        `;
        if (favs.includes(dj.name)) {
            div.querySelector(".fav").style.opacity = 1;
        } else {
            div.querySelector(".fav").style.opacity = 0.3;
        }
        /* CLICK DJ */
        div.addEventListener("click", (e) => {
            if (e.target.classList.contains("fav")) {
                toggleFav(dj.name);
                return;
            }
            setActive(i);
            renderArtist(i);
        });
        container.appendChild(div);
    });
}
/* FAVORITES */
function toggleFav(name) {
    let favs = JSON.parse(localStorage.getItem(favKey) || "[]");
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
    document.querySelectorAll(".station-item").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".station-item")[i].classList.add("active");
}
/* RENDER DJ */
async function renderArtist(i) {
    const dj = sets[i];
    if (!dj) return;
    currentIndex = i;
    document.getElementById("currentStation").textContent = dj.name;
    const container = document.getElementById("tracksContainer");
    const links = document.getElementById("artistLinks");
    container.textContent = "Ładowanie setów...";
    links.innerHTML = "";
    try {
        const res = await fetch("https://sets.krdrtradio.workers.dev/?m=" + encodeURIComponent(dj.name));
        if (!res.ok) {
            throw new Error("HTTP " + res.status);
        }
        const artist = await res.json();
        const tracks = artist.station || [];
        // Linki DJ-a z odpowiedzi API
        const linkLabels = [
            ["youtube", "YouTube"],
            ["mixcloud", "Mixcloud"],
            ["soundcloud", "SoundCloud"],
            ["podcasts", "Podcasty"],
            ["sets", "Sety"]
        ];
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
        // Lista setów
        container.innerHTML = "";
        if (tracks.length === 0) {
            container.textContent = "Brak dostępnych setów.";
            return;
        }
        tracks.forEach((t, idx) => {
            const div = document.createElement("div");
            div.className = "track-card";
            const title = document.createElement("div");
            title.className = "track-title";
            title.textContent = t.name;
            div.appendChild(title);
            if (t.audio && t.track) {
                const button = document.createElement("button");
                button.textContent = "▶ Play";
                button.addEventListener("click", () => {
                    const src = "https://cors.krdrtradio.workers.dev/?url=" + encodeURIComponent(t.track);
                    playTrack(src, i, idx);
                });
                div.appendChild(button);
            } else if (t.track) {
                const a = document.createElement("a");
                a.className = "link-btn";
                a.href = t.track;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.textContent = "Otwórz link";
                div.appendChild(a);
            }
            container.appendChild(div);
        });
    } catch (error) {
        console.error("Błąd renderArtist:", error);
        container.textContent = "Nie udało się pobrać setów.";
    }
}
/* GLOBAL PLAYER */
function playTrack(src, djIndex, trackIndex) {
    const player = document.getElementById("globalPlayer");
    const playerText = document.getElementById("globalText");
    const mini = document.getElementById("miniPlayer");
    const track = currentTracks[trackIndex];
    if (!track) {
        console.error("Nie znaleziono utworu:", trackIndex);
        return;
    }
    player.src = src;
    playerText.textContent = track.name;
    mini.style.display = "flex";
    currentIndex = djIndex;
    window.currentTrackIndex = trackIndex;
    player.play().catch(error => {
        console.error("Błąd odtwarzania:", error);
    });
}
/* AUTO NEXT */
document.getElementById("globalPlayer").addEventListener("ended", () => {
    const dj = sets[currentIndex];
    const next = (window.currentTrackIndex ?? 0) + 1;
    if (dj.tracks[next]) {
        playTrack(dj.tracks[next].track, currentIndex, next);
    }
});
/* SHUFFLE */
function shuffleSets() {
    sets.sort(() => Math.random() - 0.5);
    buildList();
    renderArtist(0);
}
/* SEARCH */
document.getElementById("setsSearch").addEventListener("input", function() {
    const q = this.value.toLowerCase();
    document.querySelectorAll(".station-item").forEach(el => {
        el.style.display = el.textContent.toLowerCase().includes(q) ? "flex" : "none";
    });
});
loadSets();
