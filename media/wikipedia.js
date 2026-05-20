      async function loadWikiPage() {
         const params = new URLSearchParams(window.location.search);
         // URL parameters
         const page = params.get('id');
         // Language
         const language = params.get('lang') || 'pl';
         // Wikimedia project
         const project = params.get('p') || 'wikipedia';
         // Supported projects:
         // wikipedia
         // wikibooks
         // wikiquote
         // wikiversity
         // wikisource
         // wikivoyage
         // wiktionary
         // commons
         // mediawiki
         // wikidata
         // meta
         // wikifunctions
         // species
         const container = document.getElementById('wiki-post');
         // No article selected
         if (!page) {
            container.innerHTML = `<p>Brak artykułu</p>`;
            return;
         }
         try {
            // Build API URL
            const apiUrl = `https://${language}.${project}.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=text&formatversion=2&format=json&origin=*`;
            // Fetch article
            const response = await fetch(apiUrl);
            const data = await response.json();
            // Article not found
            if (!data.parse) {
               container.innerHTML = `<p>Nie znaleziono artykułu</p>`;
               return;
            }
            // Clean HTML
            let cleanHtml = data.parse.text
               // Remove stylesheets
               .replace(/<link[^>]*stylesheet[^>]*>/gi, '')
               // Remove style tags
               .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
               // Remove anchor tags
               .replace(/<\/?a[^>]*>/gi, '')
               // Remove references
               .replace(/<sup[^>]*class="reference"[^>]*>[\s\S]*?<\/sup>/gi, '')
               // Remove infoboxes
               .replace(/<table[^>]*class="infobox[^"]*"[^>]*>[\s\S]*?<\/table>/gi, '')
               // Remove edit section links
               .replace(/<span[^>]*class="mw-editsection"[^>]*>[\s\S]*?<\/span>/gi, '')
               // Remove navigation boxes
               .replace(/<table[^>]*class="navbox[^"]*"[^>]*>[\s\S]*?<\/table>/gi, '');
            // Wikipedia article URL
            const articleUrl =
               `https://${language}.${project}.org/wiki/${encodeURIComponent(page)}`;
            // Render article
            container.innerHTML = `<h2><b><a href="${articleUrl}" target="_blank" style="text-decoration:none;color:inherit;">${data.parse.title}</a></b></h2>${cleanHtml}`;
            // Change page title
            document.title = `${data.parse.title} | KrdrtRadio`;
         }
         catch (error) {
            container.innerHTML = `<p>Błąd ładowania artykułu</p>`;
            console.error(error);
         }
      }
      // Load article
      loadWikiPage();
