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
    const res = await fetch("json/sets.json");
    sets = await res.json();

    buildList();
    renderArtist(0);
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

    document.querySelectorAll(".station-item")
        .forEach(el => el.classList.remove("active"));

    document.querySelectorAll(".station-item")[i]
        .classList.add("active");
}

/* RENDER DJ */
function renderArtist(i) {
    const dj = sets[i];

    document.getElementById("currentStation").textContent = dj.name;

    const container = document.getElementById("tracksContainer");
    container.innerHTML = "";
    
const artist = sets[i];

const links = document.getElementById("artistLinks");
links.innerHTML = "";

[
    ["youtube", "YouTube"],
    ["mixcloud", "Mixcloud"],
    ["soundcloud", "SoundCloud"],
    ["podcasts", "Podcasty"]
].forEach(([key, label]) => {

    if (artist[key]) {

        const a = document.createElement("a");

        a.href = artist[key];
        a.target = "_blank";
        a.rel = "noopener noreferrer";

        a.textContent = label;

        links.appendChild(a);
    }
});

    dj.tracks.forEach((t, idx) => {

        const div = document.createElement("div");
        div.className = "track-card";

        let html = `<div class="track-title">${t.name}</div>`;

        if (t.audio) {
            html += `
                <button onclick="playTrack('${t.track}', ${i}, ${idx})">
                    ▶ Play
                </button>
            `;
        } else {
            html += `
                <a class="link-btn" href="${t.track}" target="_blank">
                    Otwórz link
                </a>
            `;
        }

        div.innerHTML = html;
        container.appendChild(div);
    });
}

/* GLOBAL PLAYER */
function playTrack(src, djIndex, trackIndex) {

    const player = document.getElementById("globalPlayer");
    const playerText = document.getElementById("globalText");
    const mini = document.getElementById("miniPlayer");

    const dj = sets[djIndex];
    const track = dj.tracks[trackIndex];

    player.src = src;
    player.play();

    // ✔️ tutaj ustawiamy tytuł
    playerText.textContent = track.name;

    mini.style.display = "flex";

    currentIndex = djIndex;
    window.currentTrackIndex = trackIndex;
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
document.getElementById("setsSearch").addEventListener("input", function () {

    const q = this.value.toLowerCase();

    document.querySelectorAll(".station-item").forEach(el => {
        el.style.display =
            el.textContent.toLowerCase().includes(q)
                ? "flex"
                : "none";
    });
});

loadSets();
