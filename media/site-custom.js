async function WPCustom(
   mainUrl,
   siteKey,
   typeName,
   typeCat,
   is_categories = true,
   is_image = true,
   append = false
) {

   const container = document.getElementById('custom-article-list');
   const button = document.getElementById('load-more-btn-custom');
   const perPage = 10;

   if (!append) {
      window.currentPageC = 1;
   } else {
      window.currentPageC++;
   }

   const postsUrl =
      `${mainUrl}/wp-json/wp/v2/${typeName}?per_page=${perPage}&page=${window.currentPageC}&_embed=true`;

   const proxyUrl = 'https://cors.krdrtradio.workers.dev/?url=';

   try {

      if (button) {
         button.innerText = "Ładowanie...";
         button.disabled = true;
      }

      const response = await fetch(
         proxyUrl + encodeURIComponent(postsUrl)
      );

      if (!response.ok) {
         throw new Error("Błąd odpowiedzi sieci");
      }

      const posts = await response.json();

      if (!Array.isArray(posts) || posts.length === 0) {

         if (!append) {
            container.innerHTML = "Brak aktualności.";
         }

         if (button) {
            button.style.display = 'none';
         }

         return;
      }

      const articlesHtml = posts.map(post => {

         const terms =
            post._embedded?.['wp:term']?.[0] || [];

         const catsHtml =
            terms.length > 0 ?
            terms.map(t =>
               `<a href="articlecustom-list?si=${siteKey}&tp=${typeName}&tc=${typeCat}&c=${t.id}">
                            ${t.name}
                        </a>`
            ).join(' • ') :
            `<a href="${mainUrl}">Aktualności</a>`;

         const featuredMedia =
            post._embedded?.['wp:featuredmedia']?.[0];

         const imgUrl =
            featuredMedia?.media_details?.sizes?.medium?.source_url ||
            featuredMedia?.source_url;

         const imageDisplay =
            is_image && imgUrl ?
            `<img src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent(imgUrl)}&w=500&h=500&q=75&d=1" width="150" height="150" style="object-fit:cover;" alt="">` : '';

         const postDate = new Date(post.date)
            .toLocaleDateString('pl-PL', {
               day: 'numeric',
               month: 'long',
               year: 'numeric'
            });

         return `
                <article class="article_post">
                    <div class="article_cover">
                        ${imageDisplay}
                    </div>
                    <div class="article_content">
                        ${
                            is_categories
                                ? `<div class="article_category">
                                        ${catsHtml}
                                   </div>`
                                : ''
                        }
                        <div class="article_title">
                            <a href="articlecustom?id=${post.slug}&si=${siteKey}&tp=${typeName}&tc=${typeCat}" target="_blank">
                                ${post.title.rendered || 'Brak tytułu'}
                            </a>
                        </div>
                        <div class="article_info">
                            ${postDate}
                        </div>
                    </div>
                </article>
            `;

      }).join('');

      if (append) {

         const wrapper =
            container.querySelector('.articles') ||
            container;

         wrapper.insertAdjacentHTML(
            'beforeend',
            articlesHtml
         );

      } else {

         container.innerHTML =
            `<div class="articles">${articlesHtml}</div>`;
      }

      if (button) {

         button.innerText = "Wczytaj więcej";
         button.disabled = false;

         button.style.display =
            posts.length < perPage ?
            'none' :
            'block';

         button.onclick = () =>
            WPCustom(
               mainUrl,
               siteKey,
               typeName,
               typeCat,
               is_categories,
               is_image,
               true
            );
      }

   } catch (error) {

      console.error("Błąd WP API:", error);

      if (!append) {
         container.innerHTML =
            'Nie udało się pobrać artykułów.';
      }

      if (button) {
         button.style.display = 'none';
      }
   }
}

function parseDateRangeAdvanced(year, month, day) {

   // 🔒 brak danych → brak filtrowania
   if (!year && !month && !day) return null;

   let after = null;
   let before = null;
   let mode = '';

   // 🔧 helper
   const pad = (n) => String(n).padStart(2, '0');

   // =====================================================
   // 🔹 1. FORMAT: pełne daty (YYYY-MM-DD → YYYY-MM-DD)
   // =====================================================
   if (
      typeof year === 'string' && year.length === 10 &&
      typeof month === 'string' && month.length === 10
   ) {
      after = `${year}T00:00:00Z`;
      before = `${month}T23:59:59Z`;
      mode = 'range';
      return {
         after,
         before,
         mode
      };
   }

   // =====================================================
   // 🔹 2. FORMAT: pojedyncza data YYYY-MM-DD
   // =====================================================
   if (typeof year === 'string' && year.length === 10 && !month) {
      after = `${year}T00:00:00Z`;
      before = `${year}T23:59:59Z`;
      mode = 'day';
      return {
         after,
         before,
         mode
      };
   }

   // =====================================================
   // 🔹 3. FORMAT: YYYY-MM (miesiąc)
   // =====================================================
   if (typeof year === 'string' && year.length === 7 && !month) {
      const [y, m] = year.split('-');

      const lastDay = new Date(y, m, 0).getDate();

      after = `${y}-${m}-01T00:00:00Z`;
      before = `${y}-${m}-${lastDay}T23:59:59Z`;

      mode = 'month';
      return {
         after,
         before,
         mode,
         y1: y,
         m1: m
      };
   }

   // =====================================================
   // 🔹 4. STANDARD (rok / miesiąc / dzień / zakresy)
   // =====================================================

   const y = year ? String(year).split('-') : [];
   const m = month ? String(month).split('-') : [];
   const d = day ? String(day).split('-') : [];

   const y1 = y[0];
   const y2 = y[1] || y1;

   if (!y1) return null; // 🔒 bez roku nie robimy nic

   let m1, m2;

   if (!month) {
      m1 = 1;
      m2 = 12; // 🔥 cały rok
   } else {
      m1 = m[0] || 1;
      m2 = m[1] || m1;
   }

   let d1 = d[0] || 1;
   let d2 = d[1];

   // 🔥 KLUCZOWE: poprawne końce zakresów
   if (!d2) {
      d2 = new Date(y2, m2, 0).getDate();
   }

   after = `${y1}-${pad(m1)}-${pad(d1)}T00:00:00Z`;
   before = `${y2}-${pad(m2)}-${pad(d2)}T23:59:59Z`;

   // =====================================================
   // 🔹 TRYB (do UI)
   // =====================================================

   if (year && !month && !day) {
      mode = String(year).includes('-') ? 'year-range' : 'year';
   } else if (year && month && !day && !String(month).includes('-')) {
      mode = 'month';
   } else if (year && month && day && !String(day).includes('-')) {
      mode = 'day';
   } else if (year && month && String(day).includes('-') && !String(month).includes('-') && !String(year).includes('-')) {
      mode = 'day-range';
   } else {
      mode = 'range';
   }

   return {
      after,
      before,
      mode,
      y1,
      y2,
      m1,
      m2,
      d1,
      d2
   };
}

function formatDateText(range) {
   if (!range) return '';

   const {
      mode,
      y1,
      y2,
      after,
      before,
      m1,
      d1,
      d2
   } = range;

   const formatPL = (date) => {
      const d = new Date(date);
      return isNaN(d) ? '' : d.toLocaleDateString('pl-PL');
   };

   const monthName = (y, m) =>
      new Date(y, m - 1).toLocaleDateString('pl-PL', {
         month: 'long'
      });

   // Nowy blok dla zakresu lat
   if (mode === 'year-range') {
      return `Lata: <b>${y1}-${y2}</b>`;
   }

   // 🔹 ROK
   if (mode === 'year') {
      return `Rok: <b>${y1}</b>`;
   }

   // 🔹 MIESIĄC
   if (mode === 'month') {
      return `Miesiąc: <b>${monthName(y1, m1)} ${y1}</b>`;
   }

   // 🔹 DZIEŃ
   if (mode === 'day') {
      return `Dzień: <b>${formatPL(after)}</b>`;
   }

   // 🔹 zakres dni
   if (mode === 'day-range') {
      return `Dni: <b>${d1}-${d2} ${monthName(y1, m1)} ${y1}</b>`;
   }

   // 🔹 zakres ogólny
   const beforeDate = new Date(before);
   beforeDate.setHours(0, 0, 0, 0);

   return `Od <b>${formatPL(after)}</b> do <b>${formatPL(beforeDate - 1)}</b>`;
}

async function WPCustomList(
   mainUrl,
   siteKey,
   typeName,
   typeCat,
   categoryID = null,
   year = null,
   month = null,
   day = null,
   is_categories = true,
   is_image = true,
   append = false
) {

   const container = document.getElementById('article-list');
   const containerC = document.getElementById('article-c-result');
   const containerD = document.getElementById('article-d-result');
   const containerDesc = document.getElementById('article-desc-result');

   const button = document.getElementById('load-more-btn');

   const proxyBase =
      'https://cors.krdrtradio.workers.dev/?url=';

   const perPage = 10;

   try {

      if (button) {

         button.innerText = 'Ładowanie...';
         button.disabled = true;
      }

      let finalCategoryIds = categoryID;

      if (categoryID) {

         const ids = String(categoryID).split(',');

         finalCategoryIds = ids.join(',');
      }

      const params = new URLSearchParams({
         per_page: perPage,
         page: window.currentPage || 1,
         _embed: true
      });

      if (categoryID) {
         params.append(typeCat, finalCategoryIds);
      }

      // =====================================================
      // zakres dat
      // =====================================================

      let range = null;

      if (year || month || day) {
         range = parseDateRangeAdvanced(
            year,
            month,
            day
         );
      }

      if (range?.after && range?.before) {

         params.append('after', range.after);
         params.append('before', range.before);
      }

      const dateText = range ?
         formatDateText(range) :
         '';

      // =====================================================
      // URL
      // =====================================================

      const url =
         `${mainUrl}/wp-json/wp/v2/${typeName}?${params.toString()}`;

      const response = await fetch(
         proxyBase + encodeURIComponent(url)
      );

      if (!response.ok) {
         throw new Error('Błąd API');
      }

      const posts = await response.json();

      if (!Array.isArray(posts) || posts.length === 0) {

         if (!append) {
            container.innerHTML = 'Brak wyników.';
         }

         if (button) {
            button.style.display = 'none';
         }

         return;
      }

      // =====================================================
      // kategorie
      // =====================================================

      let categoryName = '';
      let categoryLink = '';
      let categoryDesc = '';
      let containerCcon = '';

      if (categoryID) {

         const ids = String(categoryID).split(',');

         // SINGLE

         if (ids.length === 1) {

            const catUrl =
               `${mainUrl}/wp-json/wp/v2/${typeCat}/${ids[0]}?_embed=true`;

            const res = await fetch(
               proxyBase + encodeURIComponent(catUrl)
            );

            const data = await res.json();

            categoryName = data.name || '';
            categoryLink = data.link || '#';
            categoryDesc = data.description || '';

            containerCcon =
               `Kategoria: <b><a href="${categoryLink}">${categoryName}</a></b>`;

         } else {

            // MULTI

            const catUrl =
               `${mainUrl}/wp-json/wp/v2/${typeCat}?include=${ids.join(',')}`;

            const res = await fetch(
               proxyBase + encodeURIComponent(catUrl)
            );

            const data = await res.json();

            const names = data.map(c =>
               `<b><a href="${c.link}">${c.name}</a></b>`
            );

            containerCcon =
               `Kategorie: ${names.join(', ')}`;
         }
      }

      // =====================================================
      // escape html
      // =====================================================

      const escapeHTML = (str) =>

         str ?
         String(str).replace(
            /[&<>"']/g,
            (m) => ({
               '&': '&amp;',
               '<': '&lt;',
               '>': '&gt;',
               '"': '&quot;',
               "'": '&#039;'
            } [m])
         ) :
         '';

      // =====================================================
      // nagłówki
      // =====================================================

      if (containerC) {
         containerC.innerHTML = containerCcon;
      }

      if (containerD) {
         containerD.innerHTML = dateText;
      }

      if (containerDesc) {
         containerDesc.innerHTML = categoryDesc;
      }

      // =====================================================
      // tytuł strony
      // =====================================================

      const stripHTML = (html) => {

         if (!html) return '';

         return html
            .replace(/<[^>]*>/g, '')
            .replace(/ /g, ' ')
            .trim();
      };

      const docTitle = [

            stripHTML(containerCcon),
            stripHTML(dateText)

         ]
         .filter(Boolean)
         .join(' | ') || 'Artykuły';

      document.title =
         `${docTitle} | KrdrtRadio`;

      // =====================================================
      // HTML postów
      // =====================================================

      const postsHTML = posts.map(post => {

         const title =
            post.title?.rendered
            ?.replace(/<[^>]+>/g, '') ||
            '{Brak tytułu}';

         // kategorie

         const terms =
            post._embedded?.['wp:term']?.[0] || [];

         const catsHTML = terms
            .map(t => `<a href="articlecustom-list?si=${siteKey}&tp=${typeName}&tc=${typeCat}&c=${t.id}">${t.name}</a>`)
            .join(' • ');

         // obrazek

         const featuredMedia =
            post._embedded?.['wp:featuredmedia']?.[0];

         const imgUrl =
            featuredMedia?.source_url || '';

         const imageHTML =
            (is_image && imgUrl) ?
            `<img src="https://image.krdrtradio.workers.dev/?url=${encodeURIComponent(imgUrl)}&w=500&h=500&q=75&d=1" width="150" height="150" style="object-fit:cover;" loading="lazy">` : '';

         // data

         const postDate =
            new Date(post.date)
            .toLocaleDateString(
               'pl-PL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
               }
            );

         // link

         const postLink = `articlecustom?id=${post.slug}&si=${siteKey}&tp=${typeName}&tc=${typeCat}` || post.link || '#';

         return `
            <article class="article_post">
               <div class="article_cover">
                  ${imageHTML}
               </div>
               <div class="article_content">
                  ${
                     is_categories
                     ? `<div class="article_category">${catsHTML}</div>`
                     : ''
                  }
                  <div class="article_title">
                     <a href="${postLink}" target="_blank">
                        ${title}
                     </a>
                  </div>
                  <div class="article_info">
                     ${postDate}
                  </div>
               </div>
            </article>
         `;
      }).join('');

      // =====================================================
      // append
      // =====================================================

      if (append) {

         container
            .querySelector('.articles')
            ?.insertAdjacentHTML(
               'beforeend',
               postsHTML
            );

      } else {

         container.innerHTML =
            `<div class="articles">${postsHTML}</div>`;
      }

      // =====================================================
      // button
      // =====================================================

      if (button) {

         button.innerText = 'Wczytaj więcej';

         button.disabled = false;

         button.style.display =
            posts.length < perPage ?
            'none' :
            'block';

         button.onclick = () => {

            window.currentPage =
               (window.currentPage || 1) + 1;

            WPCustomList(
               mainUrl,
               siteKey,
               typeName,
               typeCat,
               categoryID,
               year,
               month,
               day,
               is_categories,
               is_image,
               true
            );
         };
      }

   } catch (error) {

      console.error(error);

      container.innerHTML =
         'Błąd ładowania artykułów.';

      if (button) {
         button.style.display = 'none';
      }
   }
}

async function WPCustomPost(
   slug,
   mainUrl,
   typeName,
   typeCat,
   is_categories = true,
   is_image = true
) {

   const container = document.getElementById('article-post');

   // Mapowanie URL na klucz strony (używane w linkach do list)
   const siteKeys = {
      'https://radiorsc.pl': 'radiorsc',
      'https://radiovictoria.pl': 'radiovictoria',
      'https://radiokolor.pl': 'radiokolor',
      'https://soswskierniewice.pl': 'sosw',
      'https://cekis.pl': 'ckis',
      'https://radiolodz.pl': 'radiolodz',
      'https://elradio.pl': 'elradio',
      'https://radiomaryja.pl': 'radiomaryja'
   };
   const currentSiteKey = siteKeys[mainUrl] || 'default';

   // URL WP API
   const postsUrl = slug.startsWith('post-') ?
      `${mainUrl}/wp-json/wp/v2/${typeName}/${slug.slice(5)}?_embed=true` :
      `${mainUrl}/wp-json/wp/v2/${typeName}?slug=${slug}&per_page=1&_embed=true`;

   const proxyUrl =
      'https://cors.krdrtradio.workers.dev/?url=' +
      encodeURIComponent(postsUrl);

   try {

      const response = await fetch(proxyUrl);
      let posts = await response.json();

      if (!Array.isArray(posts)) {
         posts = [posts];
      }

      if (!posts.length || !posts[0].id) {
         container.innerHTML = 'Brak dostępnych postów.';
         return;
      }

      const post = posts[0];

      // title strony
      const doc = new DOMParser().parseFromString(
         post.title.rendered,
         'text/html'
      );

      document.title =
         `${doc.body.textContent} | KrdrtRadio`;

      const htmlContent = posts.map(post => {

         const embed = post._embedded || {};

         // Kategorie
         let categoriesDisplay = '';

         if (
            is_categories &&
            embed['wp:term'] &&
            embed['wp:term'][0]
         ) {

            const catsHtml = embed['wp:term'][0]
               .map(cat =>
                  `<a href="articlecustom-list?si=${currentSiteKey}&tp=${typeName}&tc=${typeCat}&c=${cat.id}" target="_blank">${cat.name}</a>`
               )
               .join(' • ');

            categoriesDisplay = `
                    <div class="article_category_posts">
                        ${catsHtml || 'Aktualności'}
                    </div>
                `;
         }

         // Obrazek
         let imageDisplay = '';

         if (
            is_image &&
            embed['wp:featuredmedia']
         ) {

            const media = embed['wp:featuredmedia'][0];

            const imgUrl =
               media.media_details?.sizes?.large?.source_url ||
               media.source_url;

            if (imgUrl) {

               const proxiedImg =
                  'https://image.krdrtradio.workers.dev/?url=' +
                  encodeURIComponent(imgUrl) +
                  '&w=1000&h=1000&q=75&d=1';

               imageDisplay = `
                        <div class="wp-site-blocks">
                            <div class="post-thumbnail">
                                <img src="${proxiedImg}" alt="${media.alt_text || ''}">
                            </div>
                        </div>
                    `;
            }
         }

         // Data
         const postDate = new Date(post.date).toLocaleDateString(
            'pl-PL', {
               day: 'numeric',
               month: 'long',
               year: 'numeric',
               hour: 'numeric',
               minute: 'numeric'
            }
         );

         // Content
         let content = post.content.rendered;

         content = content.replace(
            new RegExp(mainUrl, 'g'),
            'https://cors.krdrtradio.workers.dev/?url=' + mainUrl
         );

         content = content.replace(
            /href="https:\/\/cors\.krdrtradio\.workers\.dev\/\?url=/g,
            'href="'
         );

         return `
                <div class="articles_posts">
                    <article id="post-${post.id}">
                        <header class="article_headers_posts">
                            ${categoriesDisplay}
                            <div class="article_title_posts">
                                <a href="${post.link}" target="_blank">
                                    ${post.title.rendered || 'Brak tytułu'}
                                </a>
                            </div>
                            <div class="article_postedon_posts">
                                ${postDate}
                            </div>
                        </header>
                        ${imageDisplay}
                        <div class="article_singlecontent_posts">
                            ${content}
                        </div>
                    </article>
                </div>
            `;
      });

      container.innerHTML = htmlContent.join('');

   } catch (error) {

      console.error('Błąd WP API:', error);

      container.innerHTML =
         'Błąd podczas ładowania postów.';
   }
}
