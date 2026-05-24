let playlistInterval = null;
let hls = null;
let currentStation = null;
let currentElement = null;

const stations = [{
      name: "Eska 2",
      url: "https://waw.ic.smcdn.pl/1380-1.aac",
      weight: 45
   },
   {
      name: "Vox FM",
      url: "https://waw.ic.smcdn.pl/3990-1.aac",
      weight: 6
   },
   {
      name: "Radio Fest",
      url: "https://play.radiofest.pl:8443/fest",
      weight: 6
   },
   {
      name: "Vibe FM",
      url: "https://waw.ic.smcdn.pl/6490-1.aac",
      weight: 25
   },
   {
      name: "Open FM - 90s Hits",
      url: "https://getradio.reconv.pl/openfm?s=90s-hits",
      weight: 16
   },
   {
      name: "PR Jedynka",
      url: "https://stream11.polskieradio.pl/pr1/pr1.sdp/playlist.m3u8",
      weight: 1
   },
   {
      name: "PR Trójka",
      url: "https://stream13.polskieradio.pl/pr3/pr3.sdp/playlist.m3u8",
      weight: 1
   }
];

const player = document.getElementById("player");
const currentStationText = document.getElementById("currentStation");
const resultTrack = document.getElementById("resultTrack");
const resultTrackA = document.getElementById("resultTrackA");
const resultSite = document.getElementById("resultSite");
const resultSiteA = document.getElementById("resultSiteA");
const resultOpenStreamLink = document.getElementById("resultOpenStreamLink");
const reloadBtn = document.getElementById("reloadBtn");
const reloadBtnA = document.getElementById("reloadBtnA");
const downloadBtn = document.getElementById("downloadBtn");

function getRandomStation() {
   const totalWeight = stations.reduce((sum, station) => {
      return sum + station.weight;
   }, 0);
   let random = Math.random() * totalWeight;
   for (const station of stations) {
      random -= station.weight;
      if (random <= 0) {
         return station;
      }
   }
   return stations[0];
}

function openStreamLink(url) {
   resultOpenStreamLink.innerHTML = '<a href="' + url + '" target="_blank">' +
      'Otwórz stream' +
      '</a>';
}

function siteRadio(streamUrl) {
   fetch("https://krdrtradio.github.io/player/json/site.json")
      .then(res => res.json())
      .then(json => {
         const item = json.site.find(x => x.stream === streamUrl);
         if (item && item.value) {
            resultSiteA.innerHTML =
               `<a href="${item.value}" target="_blank">Przejdź na witrynę</a>`;
         } else {
            resultSiteA.innerHTML = "";
         }
      })
      .catch(err => {
         console.error("Błąd:", err);
         resultSiteA.innerHTML = "";
      });
}

function playlistNowPlaying(streamUrl) {
   if (playlistInterval) {
      clearInterval(playlistInterval);
   }
   const updateTrack = () => {
      fetch("https://krdrtradio.github.io/player/json/playlist.json")
         .then(res => res.json())
         .then(json => {
            const item = json.playlist.find(x => x.stream === streamUrl);
            if (item && item.value) {
               const match = item.value.match(/^(\w+)\((.*)\)$/);
               if (match) {
                  const functionName = match[1];
                  const argument = match[2].replace(/['"]/g, "");
                  if (typeof window[functionName] === "function") {
                     window[functionName](argument);
                  }

               } else {
                  resultTrackA.innerText = item.value;
               }
            } else {
               resultTrackA.innerText = "";
            }
         })
         .catch(err => {
            console.error("Błąd pobierania metadanych:", err);
            resultTrackA.innerText = "";
         });
   };
   updateTrack();
   playlistInterval = setInterval(updateTrack, 20000);
}

function play(st, el = null) {
   currentStation = st;
   currentElement = el;
   const sm = st.url.startsWith("http://") ?
      "https://cors.krdrtradio.workers.dev/?url=" +
      encodeURIComponent(st.url) :
      st.url;
   currentStationText.textContent = st.name;
   resultTrack.innerHTML =
      "<strong>Aktualna stacja:</strong><br>" +
      st.name;
   resultSite.innerHTML =
      "<strong>Stream:</strong><br>" +
      st.url;
   if (hls) {
      hls.destroy();
      hls = null;
   }
   if (sm.includes(".m3u8") && window.Hls && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(sm);
      hls.attachMedia(player);
   } else {
      player.src = sm;
   }
   siteRadio(st.url);
   openStreamLink(st.url);
   playlistNowPlaying(st.url);
   player.style.display = "block";
   player.play().catch(() => {});
}

function playRandomStation() {
   const station = getRandomStation();
   play(station);
}

reloadBtn.onclick = () => {
   playRandomStation();
};

reloadBtnA.onclick = () => {
   if (currentStation) {
      play(currentStation, currentElement);
   }
};

downloadBtn.onclick = () => {
   const currentUrl = player.src;
   if (!currentUrl) {
      alert("Najpierw uruchom stację.");
      return;
   }
   const a = document.createElement("a");
   a.href = currentUrl;
   a.download = "radio-stream.aac";
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
};

window.addEventListener("load", () => {
   playRandomStation();
});
