(function () {
   "use strict";

   const params = new URLSearchParams(window.location.search);

   // Pobieranie parametrów z URL
   const site = params.get("si");
   const typename = params.get("tp");
   const typecat = params.get("tc") || "categories";
   const category = params.get("c") || "";
   const year = params.get("y") || "";
   const month = params.get("m") || "";
   const day = params.get("d") || "";

   // Mapa obsługiwanych serwisów
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

   // Lista dozwolonych typów (używamy Set dla lepszej wydajności)
   const allowedTypes = new Set([
      'posts', 'pages', 'media', 'menu-items', 'blocks', 'templates', 'template-parts',
      'global-styles', 'navigation', 'font-families', 'e-floating-buttons', 'elementor_library',
      'dedications', 'voiceline', 'radiochannel', 'shows', 'schedule', 'chart', 'members',
      'podcast', 'qtsponsor', 'event', 'types', 'statuses', 'taxonomies', 'categories',
      'tags', 'menus', 'wp_pattern_category', 'radio-genre', 'genre', 'schedulefilter',
      'chartcategory', 'podcastfilter', 'eventtype', 'users', 'comments', 'search',
      'block-renderer', 'block-types', 'settings', 'themes', 'plugins', 'sidebars',
      'widget-types', 'widgets', 'block-directory', 'pattern-directory', 'block-patterns',
      'menu-locations', 'font-collections', 'kadence_element', 'kadence_form', 'kb_icon',
      'kadence_lottie'
   ]);

   const container = document.getElementById("article-list");

   function showError(msg) {
      if (container) {
         container.innerHTML = `<div class="error-message">${msg}</div>`;
      }
      console.error(msg);
   }

   // --- Walidacja ---

   // 1. Sprawdzenie czy wymagane parametry w ogóle istnieją
   if (!site || !typename) {
      showError("Błąd: Brak wymaganych parametrów URL (si, tp).");
      return;
   }

   // 2. Sprawdzenie czy serwis znajduje się na mapie
   if (!siteMap[site]) {
      showError("Błąd: Nieobsługiwany identyfikator serwisu.");
      return;
   }

   // 3. Sprawdzenie czy typ jest dozwolony
   if (allowedTypes.has(typename)) {
      showError("Błąd: Nieprawidłowy typ zawartości (tp).");
      return;
   }

   // Pobranie URL po pomyślnej walidacji
   const {
      url: mainUrl
   } = siteMap[site];

   function init() {
      try {
         // Sprawdzenie czy zewnętrzna funkcja istnieje
         if (typeof window.WPCustomList === "function") {
            window.WPCustomList(
               mainUrl,
               site,
               typename,
               typecat,
               category,
               year,
               month,
               day
            );
         } else {
            throw new Error("Nie znaleziono funkcji WPCustomList. Upewnij się, że odpowiedni skrypt został załadowany.");
         }
      } catch (err) {
         showError("Błąd podczas inicjalizacji listy.");
         console.error("Szczegóły błędu:", err);
      }
   }

   // Uruchomienie po załadowaniu DOM
   if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", init);
   } else {
      init(); // Jeśli DOM jest już gotowy
   }
})();
