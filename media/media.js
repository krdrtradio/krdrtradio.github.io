let PODCASTS = [];
let SITE_ID = null;

// =====================
// LOAD
// =====================

async function loadData(siteId) {
   const baseUrl = `https://krdrtradio.github.io/media/json/${siteId}`;
   SITE_ID = siteId;

   // Helper do bezpiecznego fetchowania
   const fetchJson = (suffix) =>
      fetch(`${baseUrl}_${suffix}.json`)
      .then(r => r.ok ? r.json() : null)
      .catch(() => null);

   try {
      const [podcasts,peoples] = await Promise.all([
         fetchJson("podcasts"),
         fetchJson("peoples")
      ]);

      // Przypisanie z fallbackiem na puste struktury
      PODCASTS = podcasts || {};
      PEOPLES = peoples || {};

      console.log("Dane załadowane pomyślnie");
   } catch (error) {
      console.error("Błąd podczas ładowania danych:", error);
   }
}

// =====================
// PODCAST LIST
// =====================
function renderPodcasts() {
   const container = document.getElementById("podcast_list");
   const filter = document.getElementById("categoryFilter").value;
   const search = document.getElementById("searchInput").value.toLowerCase(); // Pobieramy frazę
   const escapeHTML = (str) =>
      str ? String(str).replace(/[&<>"']/g, m => ({
         '&': '&amp;',
         '<': '&lt;',
         '>': '&gt;',
         '"': '&quot;',
         "'": '&#039;'
      } [m])) : "";

   container.innerHTML = "";

   PODCASTS
      .filter(p => {
         // 1. Podstawowe filtry (ukryte/prywatne/archiwalne)
         if (p.hide_in_podcast || p.private || p.archive) return false;

         // 2. Logika category_not_all: 
         // Jeśli flaga jest true, pokazuj TYLKO gdy wybrany jest filtr kategorii.
         // Jeśli flaga jest false/brak, pokazuj zawsze.
         if (p.category_not_all && filter === "") return false;

         // 3. Filtr konkretnej kategorii (jeśli wybrana)
         if (filter !== "" && !(p.category && p.category.includes(filter))) return false;

         // 4. Wyszukiwarka tekstowa
         const name = (p.name || "").toLowerCase();
         const host = (p.host || "").toLowerCase();
         return name.includes(search) || host.includes(search);
      })
      .sort((a, b) => {
         const sortA = Array.isArray(a.sorted) ? a.sorted : [a.sorted || ""];
         const sortB = Array.isArray(b.sorted) ? b.sorted : [b.sorted || ""];

         // 1. Porównaj pierwszy element tablicy (np. "0" vs "1")
         const res = sortA[0].toString().localeCompare(sortB[0].toString(), undefined, {
            numeric: true
         });

         // 2. Jeśli pierwsze elementy są identyczne, porównaj drugi element (np. "1" vs "7")
         if (res === 0 && (sortA[1] !== undefined || sortB[1] !== undefined)) {
            const res2 = (sortA[1] || "").toString().localeCompare((sortB[1] || "").toString(), undefined, {
               numeric: true
            });
            if (res2 !== 0) return res2;
         }

         // 3. Jeśli priorytety są identyczne, sortuj alfabetycznie po nazwie
         return res !== 0 ? res : a.name.localeCompare(b.name);
      })
      .forEach(p => {
         const el = document.createElement("div");
         el.className = "podcast_list_content";
         el.dataset.uid = p.id;

         const thumb = p.thumbnail_text;
         const style = thumb ? [
            thumb.background ? `background:${thumb.background}` : '',
            thumb.color ? `color:${thumb.color}` : ''
         ].filter(Boolean).join(';') : '';
         const name = (thumb && thumb.name) || p.name || "";
         const thumbnailDisplay = p.thumbnail_uri ?
            `<img decoding="async" src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent('https://' + p.thumbnail_uri)}&w=500&h=500&q=75&d=1" alt="${escapeHTML(p.name)}">` : "";
         const thumbnailText = thumb ? `<div class="podcast_list_box" style="${style}">${name}</div>` : thumbnailDisplay;
         const url = p.url_immediately || `podcast?uid=${p.id}&st=${SITE_ID}`;

         el.innerHTML = `
               <div class="podcast_list_cover">
                   <a href="${url}" target="_blank">${thumbnailText}</a>
               </div>
               <div class="podcast_list_info">
                   <div class="podcast_list_name">
                       <a href="${url}" target="_blank">${escapeHTML(p.name)}</a>
                   </div>
                   <div class="podcast_list_host">${p.only_the_schedule_hosts === true ? '' : escapeHTML(p.host) || ""}</div>
               </div>
           `;

         container.appendChild(el);
      });
}

// =====================
// PEOPLE LIST
// =====================
function renderPeoples() {
   const container = document.getElementById("people_list");
   const filter = document.getElementById("people_categoryFilter").value;
   const search = document.getElementById("people_searchInput").value.toLowerCase(); // Pobieramy frazę
   const escapeHTML = (str) =>
      str ? String(str).replace(/[&<>"']/g, m => ({
         '&': '&amp;',
         '<': '&lt;',
         '>': '&gt;',
         '"': '&quot;',
         "'": '&#039;'
      } [m])) : "";

   container.innerHTML = "";

   PEOPLES
      .filter(p => {
         // 1. Podstawowe filtry (ukryte/prywatne/archiwalne)
         if (p.hide_in_people || p.private) return false;

         // 2. Logika category_not_all: 
         // Jeśli flaga jest true, pokazuj TYLKO gdy wybrany jest filtr kategorii.
         // Jeśli flaga jest false/brak, pokazuj zawsze.
         if (p.local_not_all && filter === "") return false;

         // 3. Filtr konkretnej kategorii (jeśli wybrana)
         if (filter !== "" && !(p.local && p.local.includes(filter))) return false;

         // 4. Wyszukiwarka tekstowa
         const name = (p.name || "").toLowerCase();
         return name.includes(search);
      })
      .sort((a, b) => {
         const sortA = Array.isArray(a.sorted) ? a.sorted : [a.sorted || ""];
         const sortB = Array.isArray(b.sorted) ? b.sorted : [b.sorted || ""];

         // 1. Porównaj pierwszy element tablicy (np. "0" vs "1")
         const res = sortA[0].toString().localeCompare(sortB[0].toString(), undefined, {
            numeric: true
         });

         // 2. Jeśli pierwsze elementy są identyczne, porównaj drugi element (np. "1" vs "7")
         if (res === 0 && (sortA[1] !== undefined || sortB[1] !== undefined)) {
            const res2 = (sortA[1] || "").toString().localeCompare((sortB[1] || "").toString(), undefined, {
               numeric: true
            });
            if (res2 !== 0) return res2;
         }

         // 3. Jeśli priorytety są identyczne, sortuj alfabetycznie po nazwie
         return res !== 0 ? res : a.name.localeCompare(b.name);
      })
      .forEach(p => {
         const el = document.createElement("div");
         el.className = "people_list_content";
         el.dataset.uid = p.id;

         const thumb = p.thumbnail_text;
         const style = thumb ? [
            thumb.background ? `background:${thumb.background}` : '',
            thumb.color ? `color:${thumb.color}` : ''
         ].filter(Boolean).join(';') : '';
         const name = (thumb && thumb.name) || p.name || "";
         const thumbnailDisplay = p.thumbnail_uri ?
            `<img decoding="async" src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent('https://' + p.thumbnail_uri)}&w=500&h=500&q=75&d=1" alt="${escapeHTML(p.name)}">` : "";
         const thumbnailText = thumb ? `<div class="podcast_list_box" style="${style}">${name}</div>` : thumbnailDisplay;
         const url = `people?uid=${p.id}&st=${SITE_ID}`;

         el.innerHTML = `
               <div class="podcast_list_cover">
                   <a href="${url}" target="_blank">${thumbnailText}</a>
               </div>
               <div class="podcast_list_info">
                   <div class="podcast_list_name">
                       <a href="${url}" target="_blank">${escapeHTML(p.name)}</a>
                   </div>
               </div>
           `;

         container.appendChild(el);
      });
}

// =====================
// INIT
// =====================
function init() {
   renderPodcasts();
   renderPeoples();
   document.getElementById("categoryFilter").onchange = renderPodcasts;
   document.getElementById("categoryFilter").onchange = renderPeoples;
}
