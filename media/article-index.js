(function () {
   const params = new URLSearchParams(window.location.search);
   const id = params.get('id');
   const site = params.get('si');
   const type = params.get('tp') || "post";

   const siteMap = {
      "radiorsc": {
         "url": "https://radiorsc.pl"
      },
      "radiovictoria": {
         "url": "https://radiovictoria.pl"
      },
      "radiokolor": {
         "url": "https://radiokolor.pl"
      },
      "sosw": {
         "url": "https://soswskierniewice.pl"
      },
      "ckis": {
         "url": "https://cekis.pl"
      },
      "radiolodz": {
         "url": "https://radiolodz.pl"
      },
      "elradio": {
         "url": "https://elradio.pl"
      },
      "radiomaryja": {
         "url": "https://radiomaryja.pl"
      },
   };

   if (!id || !site || !siteMap[site]) {
      document.getElementById('article-post').innerHTML = "Błąd: Nieprawidłowe parametry URL.";
      return;
   }

   const {
      url: mainUrl
   } = siteMap[site];

   // Funkcja uruchamiająca odpowiedni moduł
   function inicjuj() {
      try {
         if (type === 'post') {
            if (site === 'radiorsc' && typeof WPArticlePostRSC === 'function') {
               WPArticlePostRSC(id);
            } else if (site === 'radiolodz' && typeof WPArticlePostRLodz === 'function') {
               WPArticlePostRLodz(id);
            } else if (typeof WPArticlePost === 'function') {
               WPArticlePost(id, mainUrl);
            }
         } else if (type === 'page' && typeof WPArticlePage === 'function') {
            WPArticlePage(id, mainUrl);
         } else {
            throw new Error("Nie znaleziono funkcji ładującej.");
         }
      } catch (e) {
         console.error(e);
         document.getElementById('article-post').innerHTML = "Błąd podczas ładowania modułu.";
      }
   }

   // Czekamy na pełne załadowanie DOM i skryptów zewnętrznych
   window.addEventListener('load', inicjuj);
})();
