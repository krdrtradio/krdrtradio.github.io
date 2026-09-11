(function () {
   "use strict";

   const params = new URLSearchParams(window.location.search);

   const site = params.get("si");
   const search = params.get("s") || "";
   const category = params.get("c") || "";
   const category_ex = params.get("c_ex") || "";
   const category_o = params.get("c_o") || "";
   const category_c = params.get("c_c") || "";
   const tag = params.get("t") || "";
   const tag_ex = params.get("t_ex") || "";
   const tag_o = params.get("t_o") || "";
   const author = params.get("a") || "";
   const author_ex = params.get("a_ex") || "";
   const year = params.get("y") || "";
   const month = params.get("m") || "";
   const day = params.get("d") || "";
   const type = params.get("tp") || "post";

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

   const container = document.getElementById("article-list");

   function showError(msg) {
      if (container) container.innerHTML = msg;
   }

   // Walidacja site
   if (!site || !siteMap[site]) {
      showError("Błąd: Nieprawidłowe parametry URL.");
      return;
   }

   const {
      url: mainUrl
   } = siteMap[site];

   function init() {
      try {
         if (typeof window.WPArticleList === "function") {
            window.WPArticleList(
               mainUrl,
               site,
               type,
               search,
               category,
               category_ex,
               category_o;
               category_c;
               tag,
               tag_ex,
               tag_o,
               author,
               author_ex,
               year,
               month,
               day
            );
         } else {
            throw new Error("Nie znaleziono funkcji WPArticleList.");
         }
      } catch (err) {
         console.error(err);
         showError("Błąd podczas ładowania modułu.");
      }
   }

   window.addEventListener("DOMContentLoaded", init);
})();
