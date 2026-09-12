; /*SIMPLE AUDIO PLAYER*/
(() => {
    // https://stackoverflow.com/a/34487069/383904
    const AUD = new Audio(),
        BTNS = document.querySelectorAll("[data-audio]");

    function playPause() {
        const src = this.dataset.audio;
        if (AUD.src != src) AUD.src = src;
        AUD[AUD.paused ? "play" : "pause"]();
        BTNS.forEach(el => el.classList.remove("pause"));
        this.classList.toggle("pause", !AUD.paused);
    }
    AUD.addEventListener("ended", playPause);
    BTNS.forEach(el => el.addEventListener("click", playPause));
})();
