(function () {
   const params = new URLSearchParams(window.location.search);
   const id = params.get('id');
   const site = params.get('si');
   const typename = params.get('tp');
   const typecat = params.get('tc') || "categories";

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

   if (!id || !site || !siteMap[site] || !typename) {
      document.getElementById('article-post').innerHTML = "Błąd: Nieprawidłowe parametry URL.";
      return;
   }

   const {
      url: mainUrl
   } = siteMap[site];

   // Funkcja uruchamiająca odpowiedni moduł
   function inicjuj() {
      try {
         if (typeof WPCustomPost === 'function') {
            WPCustomPost(id, mainUrl, typename, typecat)
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
