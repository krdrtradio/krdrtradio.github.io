let hls; // Globalna instancja, aby móc ją poprawnie niszczyć
function AudioPlayer(url) {
    const audio = document.getElementById('player');
    const isM3U8 = url.toLowerCase().includes('.m3u8');
    // 1. Sprzątanie po poprzednim strumieniu
    if (hls) {
        hls.destroy();
        hls = null;
    }
    if (isM3U8 && Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(audio);
        hls.on(Hls.Events.MANIFEST_PARSED, () => audio.play());
        // Obsługa błędów sieciowych (częste w radio online)
        hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        hls.recoverMediaError();
                        break;
                    default:
                        AudioPlayer(url);
                        break;
                }
            }
        });
    } else if (audio.canPlayType('application/vnd.apple.mpegurl') || !isM3U8) {
        // Safari lub zwykłe MP3
        audio.src = url;
        audio.play().catch(() => console.log("Wymagana interakcja"));
    }
}

function ReloadAudio() {
    const audio = document.getElementById('player');
    // Pobieramy aktualny URL (z HLS lub bezpośrednio z audio.src)
    const currentUrl = hls ? hls.url : audio.src;
    if (currentUrl) {
        console.log("Przeładowuję strumień...");
        AudioPlayer(currentUrl);
    }
}
