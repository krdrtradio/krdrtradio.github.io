const params = new URLSearchParams(window.location.search);
const site = params.get("si");
const contents = document.getElementById("program_contents");
const API_URL = `https://minischedule.krdrtradio.workers.dev/?si=${encodeURIComponent(site || "")}`;
const escapeHTML = (str) => {
    return str ? String(str).replace(/[&<>"']/g, (m) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    } [m])) : "";
};
const renderPrograms = (programs) => {
    if (!Array.isArray(programs) || programs.length === 0) {
        contents.innerHTML = `
            <div class="radioSchedule">
                <div class="rS__program">
                    <div class="rS__content">
                        <div class="rS__title">Brak danych ramówki</div>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    contents.innerHTML = `
        <div class="radioSchedule">
            ${programs.map((program) => {
                const thumb = program.thumb;
                const style = thumb ? `background:${thumb.background || ""};color:${thumb.color || ""}` : "";
                let thumbnailText = "";
                if (program.thumbnail_uri) {
                    thumbnailText = `<div class="rS__image"><img src="${escapeHTML(program.thumbnail_uri)}" alt="${escapeHTML(program.name)}" loading="lazy"></div>`;
                } else if (thumb) {
                    thumbnailText = `<divclass ="rS__image"><div class="rS__namebox" style="${escapeHTML(style)}">${escapeHTML(thumb.name || program.name)}</div></div>`;
                }
                const hosts = Array.isArray(program.host) ? program.host.map(t => `<div class="rS__host">${escapeHTML(t)}</div>`).join('') : typeof program.host === 'string' && program.host.trim() !== '' ? `<div class="rS__host">${escapeHTML(program.host)}</div>` : '';
                return `<div class="rS__program">${thumbnailText} <div class="rS__content"><div class="rS__date">${escapeHTML(program.date)}</div><div class="rS__title">${escapeHTML(program.name)}</div>${hosts}</div></div>`;
            }).join("")}
        </div>
    `;
};
const loadPrograms = async () => {
    try {
        contents.innerHTML = `
            <div class="radioSchedule">
                <div class="rS__program">
                    <div class="rS__content">
                        <div class="rS__title">Ładowanie ramówki...</div>
                    </div>
                </div>
            </div>
        `;
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const programs = await response.json();
        renderPrograms(programs);
    } catch (error) {
        console.error("Błąd pobierania ramówki:", error);
        contents.innerHTML = `
            <div class="radioSchedule">
                <div class="rS__program">
                    <div class="rS__content">
                        <div class="rS__title">
                            Nie udało się pobrać ramówki.
                        </div>
                        <div class="rS__host">
                            Spróbuj ponownie później.
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};
loadPrograms();
