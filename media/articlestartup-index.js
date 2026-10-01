(function() {
    "use strict";
    const params = new URLSearchParams(window.location.search);
    const main = params.get("main");
    const container = document.getElementById("article-list");

    function showError(msg) {
        if (container) container.innerHTML = msg;
    }

    function init() {
        try {
            if (typeof window.WPArticleStartup === "function") {
                window.WPArticleStartup(main);
            } else {
                throw new Error("Nie znaleziono funkcji WPArticleStartup.");
            }
        } catch (err) {
            console.error(err);
            showError("Błąd podczas ładowania modułu.");
        }
    }
    window.addEventListener("DOMContentLoaded", init);
})();
