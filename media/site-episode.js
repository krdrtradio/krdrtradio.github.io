// <div id="episode-list">Ładowanie odcinków...</div>
let nextEpisodesUrl = null;
let grupaZprLastId = null;
let eurozetOffset = 0;
let agoraOffset = 0;
let wpCurrentPage = 1;

function resetPodcastPagination() {
   grupaZprLastId = null;
   wpCurrentPage = 1;
   agoraOffset = 0;
   eurozetOffset = 0;
   nextEpisodesUrl = null;
}

function normalizePodcast(podcastA) {
   if (typeof podcastA === 'string') {
      const name = podcastA.split("(")[0].trim();
      const args = podcastA
         .match(/\((.*?)\)/)?.[1]
         ?.split(",")
         .map(v => v.replace(/['"]/g, '').trim()) || [];
      const base = { provider: name };
      switch (name) {
         case 'SpreakerPodcast':
            return {
               ...base,
               showId: args[0]
            };
         case 'GrupaZPRPodcast':
            return {
               ...base,
               podcastUid: args[0],
               siteUid: args[1]
            };
         case 'EurozetPodcast':
            return {
               ...base,
               showId: args[0],
               mainUrl: args[1],
               stationId: args[2]
            };
         case 'WPPodcast':
            return {
               ...base,
               categoryId: args[0],
               mainUrl: args[1]
            };
         case 'AgoraPodcast':
            return {
               ...base,
               brandId: args[0],
               seriesId: args[1],
               mainUrl: args[2]
            };
         case 'WPPodcastRK':
            return {
               ...base,
               SearchId: args[0]
            };
         case 'WPPodcastRVA':
            return {
               ...base,
               programId: args[0]
            };
         default:
            return base;
      }
   }
   return podcastA;
}          
          
function startPodcastEngine(podcastA) {
   podcastB = normalizePodcast(podcastA);
   if (podcastB.provider === 'SpreakerPodcast') {
      window.loadMoreHandler = () =>
         SpreakerPodcast(podcastB.showId, true);
   }
   else if (podcastB.provider === 'GrupaZPRPodcast') {
      window.loadMoreHandler = () =>
         GrupaZPRPodcast(
            podcastB.podcastUid,
            podcastB.siteUid,
            true
         );
   }
   else if (podcastB.provider === 'EurozetPodcast') {
      window.loadMoreHandler = () =>
         EurozetPodcast(
            podcastB.showId,
            podcastB.mainUrl,
            podcastB.stationId,
            true
         );
   }
   else if (podcastB.provider === 'WPPodcast') {
      window.loadMoreHandler = () =>
         WPPodcast(
            podcastB.categoryId,
            podcastB.mainUrl,
            true
         );
   }
   else if (podcastB.provider === 'AgoraPodcast') {
      window.loadMoreHandler = () =>
         AgoraPodcast(
            podcastB.brandId,
            podcastB.seriesId,
            podcastB.mainUrl,
            true
         );
   }
   else if (podcastB.provider === 'WPPodcastRK') {
      window.loadMoreHandler = () =>
         WPPodcastRK(podcastB.SearchId, true);
   }
   else if (podcastB.provider === 'WPPodcastRVG') {
      window.loadMoreHandler = () =>
         WPPodcastRVG(true);
   }
   else if (podcastB.provider === 'WPPodcastRVR') {
      window.loadMoreHandler = () =>
         WPPodcastRVR(true);
   }
   else if (podcastB.provider === 'WPPodcastRVA') {
      window.loadMoreHandler = () =>
         WPPodcastRVA(podcastB.programId, true);
   }
}

function bindLoadMoreButton() {
   const btn = document.getElementById('load-more-btn');
   if (!btn) return;
   btn.onclick = () => {
      if (window.loadMoreHandler) {
         window.loadMoreHandler();
      }
   };
}

function SpreakerPodcast(showId, append = false) {
   const apiUrl = nextEpisodesUrl || 
      `https://api.spreaker.com/v2/shows/${showId}/episodes?limit=100`;
   const container = document.getElementById('episode-list');
   const button = document.getElementById('load-more-btn');
   if (button) {
      button.innerText = "Ładowanie...";
      button.disabled = true;
   }
   fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
         const episodes = data.response.items;
         // URL do kolejnej strony
         nextEpisodesUrl = data.response.next_url || null;
         if (!episodes || episodes.length === 0) {
            if (!append) {
               container.innerHTML = "Brak dostępnych odcinków.";
            }
            button.style.display = 'none';
            return;
         }
         const htmlContent = episodes.map(episode => `<li class="podcast_list_episode_title"><a href="${episode.site_url}" target="_blank">${episode.title}</a> <a href="#" onclick="AudioPlayerEpisode('${episode.playback_url}'); return false;">▶</a></li>`).join('');
         // Pierwsze ładowanie
         if (!append) {
            container.innerHTML = `
               <ul class="podcast_list_episode_content">
                  ${htmlContent}
               </ul>
            `;
         } else {
            // Dopisywanie kolejnych odcinków
            container.querySelector('.podcast_list_episode_content')
               .insertAdjacentHTML('beforeend', htmlContent);
         }
         // Pokazuj przycisk tylko gdy istnieje kolejna strona
         if (nextEpisodesUrl) {
            button.style.display = 'block';
            button.innerText = "Załaduj więcej";
            button.disabled = false;
         } else {
            button.style.display = 'none';
         }
      })
      .catch(error => {
         console.error("Błąd Spreaker API:", error);
         if (!append) {
            container.innerHTML = "Błąd podczas ładowania podcastu.";
         }
         button.style.display = 'none';
      });
}

function GrupaZPRPodcast(podcastUid, siteUid, append = false) {
const apiUrl = grupaZprLastId
   ? `https://front-api.grupazprmedia.pl/media/v1/podcast_series_mobile_app/${podcastUid}/?site_uid=${siteUid}&last_id=${grupaZprLastId}`
   : `https://front-api.grupazprmedia.pl/media/v1/podcast_series_mobile_app/${podcastUid}/?site_uid=${siteUid}&page=0`;
   const proxyUrl =
      'https://cors.krdrtradio.workers.dev/?url=' +
      encodeURIComponent(apiUrl);
   const container = document.getElementById('episode-list');
   const button = document.getElementById('load-more-btn');
   if (button) {
      button.innerText = "Ładowanie...";
      button.disabled = true;
   }
   fetch(proxyUrl)
      .then(response => {
         if (!response.ok) {
            throw new Error(`Błąd sieci: ${response.status}`);
         }
         const contentType = response.headers.get("content-type");
         if (!contentType ||
             !contentType.includes("application/json")) {
            throw new TypeError(
               "Otrzymano format inny niż JSON!"
            );
         }
         return response.json();
      })
      .then(data => {
         const episodes = data.episodes || [];
         // może być 0
         const lastId = data.last_id;
         if (episodes.length === 0) {
            if (!append) {
               container.innerHTML =
                  "Brak dostępnych odcinków.";
            }
            button.style.display = 'none';
            return;
         }
         const htmlContent = episodes.map(episode => `<li class="podcast_list_episode_title">${episode.title} <a href="#" onclick="AudioPlayerEpisode('${episode.playback_url}');return false;">▶</a></li>
         `).join('');
         // Pierwsze ładowanie
         if (!append) {
            container.innerHTML = `<ul class="podcast_list_episode_content">${htmlContent}</ul>`;
         } else {
            container
               .querySelector('.podcast_list_episode_content')
               .insertAdjacentHTML('beforeend', htmlContent);
         }
         // Pagination
         if (lastId) {
            grupaZprLastId = lastId;
            button.style.display = 'block';
            button.innerText = "Załaduj więcej";
            button.disabled = false;
         } else {
            button.style.display = 'none';
         }
      })
      .catch(error => {
         console.error("Błąd:", error);
         if (!append) {
            container.innerHTML =
               "Błąd podczas ładowania podcastu.";
         }
         button.style.display = 'none';
      });
}

function EurozetPodcast(showId, mainUrl, stationId, append = false) {
   const apiUrl =
      `https://player.radiozet.pl/api/podcasts/getPodcastListByProgram/(node)/${showId}/(station)/${stationId}/(offset)/${eurozetOffset}`;
   const container = document.getElementById('episode-list');
   const button = document.getElementById('load-more-btn');
   if (button) {
      button.innerText = "Ładowanie...";
      button.disabled = true;
   }
   fetch(apiUrl)
      .then(response => {
         if (!response.ok) {
            throw new Error(`Błąd sieci: ${response.status}`);
         }
         return response.json();
      })
      .then(data => {
         // Odcinki
         const episodes = data.data || [];
         if (episodes.length === 0) {
            if (!append) {
               container.innerHTML = "Brak dostępnych odcinków.";
            }
            button.style.display = 'none';
            return;
         }
         const htmlContent = episodes.map(episode => `<li class="podcast_list_episode_title"><a href="${mainUrl}${episode.url}" target="_blank">${episode.title}</a> <a href="#" onclick="AudioPlayerEpisode('${episode.player.stream}');return false;">▶</a></li>`).join('');
         // Pierwsze ładowanie
         if (!append) {
            container.innerHTML = `<ul class="podcast_list_episode_content">${htmlContent}</ul>`;
         } else {
            // Dopisywanie kolejnych elementów
            container
               .querySelector('.podcast_list_episode_content')
               .insertAdjacentHTML('beforeend', htmlContent);
         }
         // Jeśli liczba wyników > 0,
         // zakładamy że może istnieć kolejna strona
         if (episodes.length >= 250) {
            eurozetOffset++;
            button.style.display = 'block';
            button.innerText = "Załaduj więcej";
            button.disabled = false;
         } else {
            button.style.display = 'none';
         }
      })
      .catch(error => {
         console.error("Błąd:", error);
         if (!append) {
            container.innerHTML =
               "Błąd podczas ładowania podcastu.";
         }
         button.style.display = 'none';
      });
}
// Wywołanie z Twoim ID
// EurozetPodcast(12345, "https://player.radiozet.pl/", "radiozet");

async function WPPodcast(categoryId, mainUrl, append = false) {
   const container = document.getElementById('episode-list');
   const button = document.getElementById('load-more-btn');
   const apiUrl =
      `${mainUrl}/wp-json/wp/v2/posts?categories=${categoryId}&page=${wpCurrentPage}&per_page=100`;
   const proxyUrl =
      'https://cors.krdrtradio.workers.dev/?url=' +
      encodeURIComponent(apiUrl);
   if (button) {
      button.innerText = "Ładowanie...";
      button.disabled = true;
   }
   try {
      const response = await fetch(proxyUrl);
      if (!response.ok) {
         throw new Error(`HTTP ${response.status}`);
      }
      const posts = await response.json();
      // Liczba wszystkich stron
      const totalPages =
         parseInt(response.headers.get('X-WP-TotalPages')) || 1;
      // Brak wyników
      if (!posts || posts.length === 0) {
         if (!append) {
            container.innerHTML = "Brak dostępnych odcinków.";
         }
         button.style.display = 'none';
         return;
      }
      // HTML wpisów
      const htmlContent = posts.map(post => `
         <li id="post-${post.id}"class="podcast_list_episode_title"><a href="${post.link}" target="_blank">${post.title.rendered}</a><span class="audio-placeholder"></span></li>`).join('');
      // Pierwsze ładowanie
      if (!append) {
         container.innerHTML = `<ul class="podcast_list_episode_content">${htmlContent}</ul>`;
      } else {
         // Dopisywanie kolejnych wpisów
         container
            .querySelector('.podcast_list_episode_content')
            .insertAdjacentHTML('beforeend', htmlContent);
      }
      // Dociąganie audio dla nowych wpisów
      posts.forEach(post => {
         loadAudioForPost(post.id, mainUrl);
      });
      // Pagination
      if (wpCurrentPage < totalPages) {
         wpCurrentPage++;
         button.style.display = 'block';
         button.innerText = "Załaduj więcej";
         button.disabled = false;
      } else {
         button.style.display = 'none';
      }
   } catch (error) {
      console.error("Błąd WP API:", error);
      if (!append) {
         container.innerHTML =
            "Błąd podczas ładowania podcastu.";
      }
      button.style.display = 'none';
   }
}
// Przykład użycia (podaj ID kategorii z Twojego WordPressa)
// WPPodcast(5,"https://radiorsc.pl");

function AgoraPodcast(brandId, seriesId, mainUrl, append = false) {
   const apiUrl =
      `https://podcasts.radioagora.pl/api/getPodcasts?brand_id=${brandId}&limit=100&offset=${agoraOffset}&series_id=${seriesId}`;
   const container = document.getElementById('episode-list');
   const button = document.getElementById('load-more-btn');
   if (button) {
      button.innerText = "Ładowanie...";
      button.disabled = true;
   }
   fetch(apiUrl)
      .then(response => {
         if (!response.ok) {
            throw new Error(`Błąd sieci: ${response.status}`);
         }
         return response.json();
      })
      .then(data => {
         const episodes = data.records || [];
         // Brak wyników
         if (episodes.length === 0) {
            if (!append) {
               container.innerHTML = "Brak dostępnych odcinków.";
            }
            button.style.display = 'none';
            return;
         }
         const htmlContent = episodes.map(episode => `<li class="podcast_list_episode_title"><a href="${mainUrl}/podcast/${episode.podcast_seo_url}/${episode.podcast_id}" target="_blank">${episode.podcast_name}</a> <a href="#" onclick="GetAndPlayAgora(${brandId}, ${episode.podcast_id});return false;">▶</a></li>`).join('');
         // Pierwsze ładowanie
         if (!append) {
            container.innerHTML = `<ul class="podcast_list_episode_content">${htmlContent}</ul>`;
         } else {
            // Dopisywanie kolejnych elementów
            container
               .querySelector('.podcast_list_episode_content')
               .insertAdjacentHTML('beforeend', htmlContent);
         }
         // Pagination
         // Jeśli coś przyszło, zwiększamy offset
         if (episodes.length > 0) {
            agoraOffset += 100;
            button.style.display = 'block';
            button.innerText = "Załaduj więcej";
            button.disabled = false;
         } else {
            button.style.display = 'none';
         }
         // Opcjonalnie:
         // jeśli ostatnia strona ma mniej niż 100 elementów
         if (episodes.length < 100) {
            button.style.display = 'none';
         }
      })
      .catch(error => {
         console.error("Błąd API:", error);
         if (!append) {
            container.innerHTML =
               "Błąd podczas ładowania podcastu.";
         }
         button.style.display = 'none';
      });
}

// Funkcja pomocnicza pobierająca konkretny strumień przed odtworzeniem
function GetAndPlayAgora(brandId, podcastId) {
   const detailUrl = `https://podcasts.radioagora.pl/api/universalApigetPodcastAll?brand_id=${brandId}&podcast_id=${podcastId}`;

   fetch(detailUrl)
      .then(res => res.json())
      .then(data => {
         // Zakładając, że URL strumienia jest w data.podcast_info.player.stream lub podobnej strukturze
         const streamUrl = data.url;
         if (streamUrl) {
            AudioPlayerEpisode(streamUrl);
         } else {
            alert("Nie znaleziono źródła dźwięku.");
         }
      });
}

function WPPodcastRK(SearchId, append = false) {
    const container = document.getElementById('episode-list');
    const button = document.getElementById('load-more-btn');
    const parser = new DOMParser();

    if (!append) wpCurrentPage = 1;

    const apiUrl = `https://radiokolor.pl/wp-json/wp/v2/podcast?search=${SearchId}&page=${wpCurrentPage}&per_page=100`;
    const proxyUrl = 'https://cors.krdrtradio.workers.dev/?url=' + encodeURIComponent(apiUrl);

   if (button) {
      button.innerText = "Ładowanie...";
      button.disabled = true;
   }

    fetch(proxyUrl)
        .then(response => {
            if (!response.ok) throw new Error('Błąd sieci');
            return response.json();
        })
        .then(posts => {
            if (posts.length === 0) {
                if (!append) container.innerHTML = "Brak dostępnych odcinków.";
                document.getElementById('load-more-btn').style.display = 'none';
                return;
            }

            const htmlContent = posts.map(post => {
                const docAudio = parser.parseFromString(post.content.rendered, 'text/html');
                const audioTag = docAudio.querySelector('audio source') || docAudio.querySelector('audio');
                const audioUrl = audioTag ? audioTag.getAttribute('src') : '';

                return `<li class="podcast_list_episode_title"><a href="${post.link}" target="_blank">${post.title.rendered}</a> ${audioUrl ? `<a href="#" onclick="AudioPlayerEpisodeCORS('${audioUrl}'); return false;">▶</a>` : ''}</li>`;}).join('');

            if (!append) {
                container.innerHTML = `<ul class="podcast_list_episode_content">${htmlContent}</ul>`;
            } else {
                container.querySelector('.podcast_list_episode_content')
                         .insertAdjacentHTML('beforeend', htmlContent);
            }

            // Pagination
            wpCurrentPage++;
            document.getElementById('load-more-btn').style.display = (posts.length === 100) ? 'block' : 'none';
            if (posts.length === 100) {
               document.getElementById('load-more-btn').innerText = "Załaduj więcej";
               document.getElementById('load-more-btn').disabled = false;
            }
        })
        .catch(error => {
            console.error("Błąd WP API:", error);
            if (!append) container.innerHTML = "Błąd podczas ładowania postów.";
            document.getElementById('load-more-btn').style.display = 'none';
        });
}

function WPPodcastRVG(append = false) {
    const container = document.getElementById('episode-list');
    const button = document.getElementById('load-more-btn');
    const parser = new DOMParser();

    if (!append) wpCurrentPage = 1;

    const apiUrl = `https://radiovictoria.pl/wp-json/wp/v2/gosc?page=${wpCurrentPage}&per_page=100`;
    const proxyUrl = 'https://cors.krdrtradio.workers.dev/?url=' + encodeURIComponent(apiUrl);

   if (button) {
      button.innerText = "Ładowanie...";
      button.disabled = true;
   }

    fetch(proxyUrl)
        .then(response => {
            if (!response.ok) throw new Error('Błąd sieci');
            return response.json();
        })
        .then(posts => {
            if (posts.length === 0) {
                if (!append) container.innerHTML = "Brak dostępnych odcinków.";
                document.getElementById('load-more-btn').style.display = 'none';
                return;
            }

            const htmlContent = posts.map(post => {
                const docAudio = parser.parseFromString(post.content.rendered, 'text/html');
                const audioTag = docAudio.querySelector('audio source') || docAudio.querySelector('audio');
                const audioUrl = audioTag ? audioTag.getAttribute('src') : '';

                return `<li class="podcast_list_episode_title"><a href="${post.link}" target="_blank">${post.title.rendered}</a> ${audioUrl ? `<a href="#" onclick="AudioPlayerEpisodeCORS('${audioUrl}'); return false;">▶</a>` : ''}</li>`;}).join('');

            if (!append) {
                container.innerHTML = `<ul class="podcast_list_episode_content">${htmlContent}</ul>`;
            } else {
                container.querySelector('.podcast_list_episode_content')
                         .insertAdjacentHTML('beforeend', htmlContent);
            }

            // Pagination
            wpCurrentPage++;
            document.getElementById('load-more-btn').style.display = (posts.length === 100) ? 'block' : 'none';
            if (posts.length === 100) {
               document.getElementById('load-more-btn').innerText = "Załaduj więcej";
               document.getElementById('load-more-btn').disabled = false;
            }
        })
        .catch(error => {
            console.error("Błąd WP API:", error);
            if (!append) container.innerHTML = "Błąd podczas ładowania postów.";
            document.getElementById('load-more-btn').style.display = 'none';
        });
}

function WPPodcastRVR(append = false) {
    const container = document.getElementById('episode-list');
    const button = document.getElementById('load-more-btn');
    const parser = new DOMParser();

    if (!append) wpCurrentPage = 1;

    const apiUrl = `https://radiovictoria.pl/wp-json/wp/v2/reporter?page=${wpCurrentPage}&per_page=100`;
    const proxyUrl = 'https://cors.krdrtradio.workers.dev/?url=' + encodeURIComponent(apiUrl);

   if (button) {
      button.innerText = "Ładowanie...";
      button.disabled = true;
   }

    fetch(proxyUrl)
        .then(response => {
            if (!response.ok) throw new Error('Błąd sieci');
            return response.json();
        })
        .then(posts => {
            if (posts.length === 0) {
                if (!append) container.innerHTML = "Brak dostępnych odcinków.";
                document.getElementById('load-more-btn').style.display = 'none';
                return;
            }

            const htmlContent = posts.map(post => {
                const docAudio = parser.parseFromString(post.content.rendered, 'text/html');
                const audioTag = docAudio.querySelector('audio source') || docAudio.querySelector('audio');
                const audioUrl = audioTag ? audioTag.getAttribute('src') : '';

                return `<li class="podcast_list_episode_title"><a href="${post.link}" target="_blank">${post.title.rendered}</a> ${audioUrl ? `<a href="#" onclick="AudioPlayerEpisodeCORS('${audioUrl}'); return false;">▶</a>` : ''}</li>`;}).join('');

            if (!append) {
                container.innerHTML = `<ul class="podcast_list_episode_content">${htmlContent}</ul>`;
            } else {
                container.querySelector('.podcast_list_episode_content')
                         .insertAdjacentHTML('beforeend', htmlContent);
            }

            // Pagination
            wpCurrentPage++;
            document.getElementById('load-more-btn').style.display = (posts.length === 100) ? 'block' : 'none';
            if (posts.length === 100) {
               document.getElementById('load-more-btn').innerText = "Załaduj więcej";
               document.getElementById('load-more-btn').disabled = false;
            }
        })
        .catch(error => {
            console.error("Błąd WP API:", error);
            if (!append) container.innerHTML = "Błąd podczas ładowania postów.";
            document.getElementById('load-more-btn').style.display = 'none';
        });
}

function WPPodcastRVA(ProgramId, append = false) {
    const container = document.getElementById('episode-list');
    const button = document.getElementById('load-more-btn');
    const parser = new DOMParser();

    if (!append) wpCurrentPage = 1;

    const apiUrl = `https://radiovictoria.pl/wp-json/wp/v2/programy?audycje=${ProgramId}&page=${wpCurrentPage}&per_page=100`;
    const proxyUrl = 'https://cors.krdrtradio.workers.dev/?url=' + encodeURIComponent(apiUrl);

   if (button) {
      button.innerText = "Ładowanie...";
      button.disabled = true;
   }

    fetch(proxyUrl)
        .then(response => {
            if (!response.ok) throw new Error('Błąd sieci');
            return response.json();
        })
        .then(posts => {
            if (posts.length === 0) {
                if (!append) container.innerHTML = "Brak dostępnych odcinków.";
                document.getElementById('load-more-btn').style.display = 'none';
                return;
            }

            const htmlContent = posts.map(post => {
                const docAudio = parser.parseFromString(post.content.rendered, 'text/html');
                const audioTag = docAudio.querySelector('audio source') || docAudio.querySelector('audio');
                const audioUrl = audioTag ? audioTag.getAttribute('src') : '';

                return `<li class="podcast_list_episode_title"><a href="${post.link}" target="_blank">${post.title.rendered}</a> ${audioUrl ? `<a href="#" onclick="AudioPlayerEpisodeCORS('${audioUrl}'); return false;">▶</a>` : ''}</li>`;}).join('');

            if (!append) {
                container.innerHTML = `<ul class="podcast_list_episode_content">${htmlContent}</ul>`;
            } else {
                container.querySelector('.podcast_list_episode_content')
                         .insertAdjacentHTML('beforeend', htmlContent);
            }

            // Pagination
            wpCurrentPage++;
            document.getElementById('load-more-btn').style.display = (posts.length === 100) ? 'block' : 'none';
            if (posts.length === 100) {
               document.getElementById('load-more-btn').innerText = "Załaduj więcej";
               document.getElementById('load-more-btn').disabled = false;
            }
        })
        .catch(error => {
            console.error("Błąd WP API:", error);
            if (!append) container.innerHTML = "Błąd podczas ładowania postów.";
            document.getElementById('load-more-btn').style.display = 'none';
        });
}

async function loadAudioForPost(postId, mainUrl) {
   try {
      // 1. Najpierw pobieramy dane posta, aby sprawdzić treść (dla wideo/YouTube)
      const proxyUrl = 'https://cors.krdrtradio.workers.dev/?url=';
      const postRes = await fetch(proxyUrl + encodeURIComponent(`${mainUrl}/wp-json/wp/v2/posts/${postId}`));
      const postData = await postRes.json();
      const content = postData.content.rendered;
      const audioRs = proxyUrl + encodeURIComponent(`${mainUrl}/wp-json/wp/v2/media?parent=${postId}&mime_type=audio/mpeg,audio/wav,audio/x-ms-wma,audio/ogg,audio/mp4,audio/flac,audio/alac,audio/x-aiff,audio/aiff,audio/aac,audio/ac3,audio/x-caf,audio/x-aac,audio/vnd.dolby.dd-raw,application/octet-stream,audio/x-flac,audio/x-m4a,audio/x-mpeg-3,application/ogg,audio/x-wav,audio/wma`);

      // 2. Pobieramy media audio (Twoja obecna logika)
      const audioRes = await fetch(audioRs);
      const media = await audioRes.json();

      const li = document.getElementById(`post-${postId}`);
      const placeholder = li.querySelector('.audio-placeholder');

      let finalUrl = "";

      if (media && media.length > 0) {
         // Priorytet 1: Plik audio z mediów
         finalUrl = media[0].source_url;
      } else {
         // Priorytet 2: Szukamy wp-block-video (MP4/MOV)
         const videoMatch = content.match(/<video[^>]+src="([^"]+)"/i) || content.match(/<source[^>]+src="([^"]+)"/i);
         if (videoMatch) {
            finalUrl = videoMatch[1];
         } else {
            // Priorytet 3: Szukamy YouTube (ID z embed)
            const ytMatch = content.match(/youtube\.com\/embed\/([^"?\s]+)/i);
            if (ytMatch) {
               // UWAGA: Standardowy tag <audio> nie odtworzy YouTube. 
               // Link kieruje do filmu, by zachować ciągłość listy.
               placeholder.innerHTML = `<a href="https://www.youtube.com/watch?v=${ytMatch[1]}" target="_blank"><i class="fa-brands fa-youtube"></i></a>`;
               return;
            }
         }
      }

      if (finalUrl) {
         placeholder.innerHTML = `<a href="#" onclick="AudioPlayerEpisodeCORS('${finalUrl}'); return false;">▶</a>`;
      } else {
         placeholder.remove();
      }
   } catch (e) {
      console.error("Błąd przetwarzania ID " + postId, e);
   }
}

function AudioPlayerEpisode(url) {
   const audio = document.getElementById('player');
   audio.style.display = 'block'; // Pokaż player po kliknięciu
   document.scrollingElement.scrollTop = audio.offsetTop - 50;
   const isM3U8 = url.toLowerCase().includes('.m3u8');

   // 1. Czyszczenie poprzedniej instancji HLS
   if (hls) {
      hls.destroy();
      hls = null;
   }

   // 2. Obsługa strumienia M3U8 (HLS)
   if (isM3U8 && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => audio.play());

      hls.on(Hls.Events.ERROR, (event, data) => {
         if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
            else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
         }
      });
   }
   // 3. Obsługa Safari (natywne HLS) lub zwykłe MP3
   else {
      audio.src = url;
      audio.play().catch(e => console.error("Błąd autostartu:", e));
   }
}

function AudioPlayerEpisodeCORS(url) {
   const audio = document.getElementById('player');
   const urlCORS = 'https://cors.krdrtradio.workers.dev/?url=' + encodeURIComponent(url);
   audio.style.display = 'block'; // Pokaż player po kliknięciu
   document.scrollingElement.scrollTop = audio.offsetTop - 50;
   const isM3U8 = urlCORS.toLowerCase().includes('.m3u8');

   // 1. Czyszczenie poprzedniej instancji HLS
   if (hls) {
      hls.destroy();
      hls = null;
   }

   // 2. Obsługa strumienia M3U8 (HLS)
   if (isM3U8 && Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(urlCORS);
      hls.attachMedia(audio);
      hls.on(Hls.Events.MANIFEST_PARSED, () => audio.play());

      hls.on(Hls.Events.ERROR, (event, data) => {
         if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
            else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
         }
      });
   }
   // 3. Obsługa Safari (natywne HLS) lub zwykłe MP3
   else {
      audio.src = urlCORS;
      audio.play().catch(e => console.error("Błąd autostartu:", e));
   }
}
