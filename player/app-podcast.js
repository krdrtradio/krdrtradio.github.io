const params = new URLSearchParams(window.location.search);
const site = params.get("si");
const contents = document.getElementById("podcast_contents");
const API_URL = `https://podcasts.krdrtradio.workers.dev/?si=${encodeURIComponent(site || "")}`;
const escapeHTML = (str) => {
    return str ? String(str).replace(/[&<>"']/g, (m) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    } [m])) : "";
};
const renderPodcasts = (podcasts) => {
    if (!Array.isArray(podcasts) || podcasts.length === 0) {
        contents.innerHTML = `
            <div class="rS_podcasts_list">
                <div class="rS_podcasts_list_podcast">
                    <div class="rS_podcasts_list_content">
                        <div class="rS_podcasts_list_title">Brak danych podcastu</div>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    contents.innerHTML = `
        <div class="rS_podcasts_list">
            ${podcasts.map((podcast) => {
                const thumb = podcast.thumb;
                const style = thumb ? `background:${thumb.background || ""};color:${thumb.color || ""}` : "";
                let thumbnailText = "";
                if (podcast.thumbnail_uri) {
                    thumbnailText = `<div class="rS_podcasts_list_photo"><img src="${escapeHTML(podcast.thumbnail_uri)}" alt="${escapeHTML(podcast.name)}" loading="lazy"></div>`;
                } else if (podcast.thumbnail_uri === null && thumb.background === null && thumb.color === null && thumb.name === null) {
                    thumbnailText = "";
                } else if (thumb) {
                    thumbnailText = `<div class="rS_podcasts_list_photo"><div class="rS_podcasts_name_box" style="${escapeHTML(style)}">${escapeHTML(thumb.name || podcast.name)}</div></div>`;
                }
                return `<a href="${podcast.url}" target="_blank"><div class="rS_podcasts_list_podcast">${thumbnailText}<div class="rS_podcasts_list_content"><div class="rS_podcasts_list_title">${escapeHTML(podcast.name)}</div><div class="rS_podcasts_list_host">${escapeHTML(podcast.host)}</div></div></div></a>`;
            }).join("")}
        </div>
    `;
};
const loadpodcasts = async () => {
    try {
        contents.innerHTML = `
            <div class="rS_podcasts_list">
                <div class="rS_podcasts_list_podcast">
                    <div class="rS_podcasts_list_content">
                        <div class="rS_podcasts_list_title">Ładowanie podcastu...</div>
                    </div>
                </div>
            </div>
        `;
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const podcasts = await response.json();
        renderPodcasts(podcasts);
    } catch (error) {
        console.error("Błąd pobierania ramówki:", error);
        contents.innerHTML = `
            <div class="rS_podcasts_list">
                <div class="rS_podcasts_list_podcast">
                    <div class="rS_podcasts_list_content">
                        <div class="rS_podcasts_list_title">
                            Nie udało się pobrać podcastu.<br><small>Spróbuj ponownie później.</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
const start = () => {
    if (site === 'rockradio') {
        window.location.href = 'https://krdrtradio.github.io/player/podcast?si=kissfm';
        return;
    }
    loadpodcasts();
};
start();
