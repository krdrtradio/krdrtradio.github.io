(function() {
    "use strict";
    const params = new URLSearchParams(window.location.search);
    const site = params.get("si");
    const parent = params.get("p") || "";
    const parent_ex = params.get("p_ex") || "";
    const slug = params.get("slug") || "";
    const mediaType = params.get("media_t") || "";
    const mimeType = params.get("mime_t") || "";
    const search = params.get("s") || "";
    const search_m = params.get("s_m") || "0";
    const author = params.get("a") || "";
    const author_ex = params.get("a_ex") || "";
    const year = params.get("y") || "";
    const month = params.get("m") || "";
    const day = params.get("d") || "";
    const siteMap = {
        radiorsc: {
            url: "https://radiorsc.pl"
        },
        radiovictoria: {
            url: "https://radiovictoria.pl"
        },
        radiokolor: {
            url: "https://radiokolor.pl"
        },
        sosw: {
            url: "https://soswskierniewice.pl"
        },
        ckis: {
            url: "https://cekis.pl"
        },
        radiolodz: {
            url: "https://radiolodz.pl"
        },
        elradio: {
            url: "https://elradio.pl"
        },
        radiomaryja: {
            url: "https://radiomaryja.pl"
        }
    };
    const container = document.getElementById("article-list");

    function showError(msg) {
        if (container) container.innerHTML = msg;
    }
    // Walidacja site
    if (!site || !siteMap[site]) {
        showError("Błąd: Nieprawidłowe parametry URL.");
        return;
    }
    const {
        url: mainUrl
    } = siteMap[site];

    function init() {
        try {
            if (typeof window.WPMediaList === "function") {
                window.WPMediaList(mainUrl, site, parent, parent_ex, slug, mediaType, mimeType, search, search_m, author, author_ex, year, month, day);
            } else {
                throw new Error("Nie znaleziono funkcji WPMediaList.");
            }
        } catch (err) {
            console.error(err);
            showError("Błąd podczas ładowania modułu.");
        }
    }
    window.addEventListener("DOMContentLoaded", init);
})();
