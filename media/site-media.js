function parseDateRangeAdvanced(year, month, day) {
    // 🔒 brak danych → brak filtrowania
    if (!year && !month && !day) return null;
    let after = null;
    let before = null;
    let mode = '';
    const pad = (n) => String(n).padStart(2, '0');
    // =====================================================
    // 🔹 1. FORMAT: pełne daty (YYYY-MM-DD → YYYY-MM-DD)
    // =====================================================
    if (typeof year === 'string' && year.length === 10 && typeof month === 'string' && month.length === 10) {
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
    if (!y1) return null;
    let m1, m2;
    if (!month) {
        m1 = 1;
        m2 = 12;
    } else {
        m1 = m[0] || 1;
        m2 = m[1] || m1;
    }
    let d1 = d[0] || 1;
    let d2 = d[1];
    if (!d2) {
        d2 = new Date(y2, m2, 0).getDate();
    }
    after = `${y1}-${pad(m1)}-${pad(d1)}T00:00:00Z`;
    before = `${y2}-${pad(m2)}-${pad(d2)}T23:59:59Z`;
    // =====================================================
    // 🔹 TRYB
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
    const monthName = (y, m) => new Date(y, m - 1).toLocaleDateString('pl-PL', {
        month: 'long'
    });
    // =====================================================
    // 🔹 ZAKRES LAT
    // =====================================================
    if (mode === 'year-range') {
        return `Lata: <b>${y1}-${y2}</b>`;
    }
    // =====================================================
    // 🔹 ROK
    // =====================================================
    if (mode === 'year') {
        return `Rok: <b>${y1}</b>`;
    }
    // =====================================================
    // 🔹 MIESIĄC
    // =====================================================
    if (mode === 'month') {
        return `Miesiąc: <b>${monthName(y1, m1)} ${y1}</b>`;
    }
    // =====================================================
    // 🔹 DZIEŃ
    // =====================================================
    if (mode === 'day') {
        return `Dzień: <b>${formatPL(after)}</b>`;
    }
    // =====================================================
    // 🔹 ZAKRES DNI
    // =====================================================
    if (mode === 'day-range') {
        return `Dni: <b>${d1}-${d2} ${monthName(y1, m1)} ${y1}</b>`;
    }
    // =====================================================
    // 🔹 ZAKRES OGÓLNY
    // =====================================================
    const beforeDate = new Date(before);
    beforeDate.setHours(0, 0, 0, 0);
    return `Od <b>${formatPL(after)}</b> do <b>${formatPL(beforeDate - 1)}</b>`;
}

function RVUsers(authorIDs) {
    const excluded = new Set(String(authorIDs || '').split(',').map(Number).filter(Boolean));
    return Array.from({
        length: 70
    }, (_, i) => i + 1).filter(id => !excluded.has(id)).join(',');
}
const parseBoolean = (value, defaultValue = true) => {
    if (value === true || value === 1 || String(value).toLowerCase() === 'true' || String(value) === '1') {
        return true;
    }
    if (value === false || value === 0 || String(value).toLowerCase() === 'false' || String(value) === '0') {
        return false;
    }
    return defaultValue;
};
async function WPMediaList(mainUrl, siteKey, parent = null, parent_ex = null, slug = null, mediaType = null, mimeType = null, search = null, searchMatch = 0, authorID = null, authorExID = null, year = null, month = null, day = null, is_author = true, append = false) {
    const container = document.getElementById('article-list');
    const containerS = document.getElementById('article-s-result');
    const containerSl = document.getElementById('article-sl-result');
    const containerP = document.getElementById('article-p-result');
    const containerMeT = document.getElementById('article-met-result');
    const containerMiT = document.getElementById('article-mit-result');
    const containerA = document.getElementById('article-a-result');
    const containerD = document.getElementById('article-d-result');
    const button = document.getElementById('load-more-btn');
    const proxyBase = 'https://cors.krdrtradio.workers.dev/?url=';
    const perPage = 10;
    if (!append) {
        window.currentPage = 1;
    } else {
        window.currentPage++;
    }
    try {
        if (button) {
            button.innerText = "Ładowanie...";
            button.disabled = true;
        }
        // =====================================================
        // 🔹 PARAMETRY
        // =====================================================
        const params = new URLSearchParams({
            per_page: perPage,
            page: window.currentPage,
            _embed: true
        });
        // =====================================================
        // 🔹 PARENT
        // =====================================================
        if (parent) {
            params.append('parent', parent);
        }
        if (parent_ex) {
            params.append('parent_exclude', parent_ex);
        }
        // =====================================================
        // 🔹 SLUG
        // =====================================================
        if (slug) {
            params.append('slug', slug);
        }
        // =====================================================
        // 🔹 MEDIA TYPE
        // =====================================================
        if (mediaType) {
            params.append('media_type', mediaType);
        }
        // =====================================================
        // 🔹 MIME TYPE
        // =====================================================
        if (mimeType) {
            params.append('mime_type', mimeType);
        }
        // =====================================================
        // 🔹 SEARCH
        // =====================================================
        if (search) {
            // Podstawowy parametr szukanej frazy
            params.append('search', search);
            // Mapowanie wszystkich możliwych wariantów (aliasów) na konkretne akcje
            const strategyMap = {
                // CONTENT (1)
                '1': {
                    key: 'search_columns',
                    value: 'post_content'
                },
                'content': {
                    key: 'search_columns',
                    value: 'post_content'
                },
                'post_content': {
                    key: 'search_columns',
                    value: 'post_content'
                },
                // EXCERPT (2)
                '2': {
                    key: 'search_columns',
                    value: 'post_excerpt'
                },
                'excerpt': {
                    key: 'search_columns',
                    value: 'post_excerpt'
                },
                'post_excerpt': {
                    key: 'search_columns',
                    value: 'post_excerpt'
                },
                // TITLE (3)
                '3': {
                    key: 'search_columns',
                    value: 'post_title'
                },
                'title': {
                    key: 'search_columns',
                    value: 'post_title'
                },
                'post_title': {
                    key: 'search_columns',
                    value: 'post_title'
                },
                // EXACT (4)
                '4': {
                    key: 'search_semantics',
                    value: 'exact'
                },
                'exact': {
                    key: 'search_semantics',
                    value: 'exact'
                },
                'post_exact': {
                    key: 'search_semantics',
                    value: 'exact'
                }
            };
            // Pobranie strategii na podstawie przekazanej wartości searchMatch
            // (Konwersja na String zabezpiecza sytuację, gdy searchMatch jest przekazany jako liczba)
            const strategy = strategyMap[String(searchMatch).toLowerCase()];
            // Jeśli strategia istnieje w mapie, dopisujemy odpowiedni parametr URL
            if (strategy) {
                params.append(strategy.key, strategy.value);
            }
            // Dla wartości 0, 'normal', 'default' lub niezdefiniowanych – nic nie robimy (zostaje samo ?search=...)
        }
        // =====================================================
        // 🔹 AUTORZY
        // =====================================================
        if (siteKey === 'radiolodz') {
            // -------------------------------------------------
            // RADIO ŁÓDŹ
            // -------------------------------------------------
            if (authorID) {
                params.append('ppma_author', authorID);
            }
            if (authorExID) {
                const excludedAuthors = String(authorExID).split(',').map(id => id.trim()).filter(Boolean);
                if (excludedAuthors.length > 0) {
                    params.append('ppma_author_exclude', excludedAuthors.join(','));
                }
            }
        } else if (siteKey === 'radiovictoria') {
            // -------------------------------------------------
            // RADIO VICTORIA
            // -------------------------------------------------
            // a=... → zwykłe wykluczenie wszystkich pozostałych
            if (authorID) {
                let excludedAuthors = RVUsers(authorID);
                // a_ex=... → dodatkowi autorzy do wykluczenia
                if (authorExID !== null && authorExID !== undefined && String(authorExID).trim() !== '') {
                    const extraExcludedAuthors = String(authorExID).split(',').map(id => id.trim()).filter(Boolean);
                    if (extraExcludedAuthors.length > 0) {
                        excludedAuthors += ',' + extraExcludedAuthors.join(',');
                    }
                }
                params.append('author_exclude', excludedAuthors);
            }
            // a_ex=... bez a=...
            else if (authorExID !== null && authorExID !== undefined && String(authorExID).trim() !== '') {
                const excludedAuthors = String(authorExID).split(',').map(id => id.trim()).filter(Boolean);
                if (excludedAuthors.length > 0) {
                    params.append('author_exclude', excludedAuthors.join(','));
                }
            }
        } else {
            // -------------------------------------------------
            // STANDARDOWY WORDPRESS
            // -------------------------------------------------
            if (authorID) {
                params.append('author', authorID);
            }
            if (authorExID) {
                const excludedAuthors = String(authorExID).split(',').map(id => id.trim()).filter(Boolean);
                if (excludedAuthors.length > 0) {
                    params.append('author_exclude', excludedAuthors.join(','));
                }
            }
        }
        // =====================================================
        // 🔹 DATA RANGE
        // =====================================================
        let range = null;
        if (year || month || day) {
            range = parseDateRangeAdvanced(year, month, day);
        }
        if (range && range.after && range.before) {
            params.append('after', range.after);
            params.append('before', range.before);
        }
        const dateText = range ? formatDateText(range) : '';
        // =====================================================
        // 🔹 ENDPOINT
        // =====================================================
        const url = `${mainUrl}/wp-json/wp/v2/media?${params.toString()}`;
        const response = await fetch(proxyBase + encodeURIComponent(url));
        if (!response.ok) {
            throw new Error("Błąd API");
        }
        const posts = await response.json();
        if (!Array.isArray(posts) || posts.length === 0) {
            if (!append) {
                container.innerHTML = "Brak wyników.";
            }
            if (button) {
                button.style.display = 'none';
            }
            return;
        }
        // =====================================================
        // 🔹 ZMIENNE INFORMACYJNE
        // =====================================================
        let containerAcon = '';
        let containerDesccon = '';
        // =====================================================
        // 🔹 AUTOR
        // =====================================================
        let authorHTML = 'Redakcja';
        if (siteKey === 'radiolodz') {
            // -------------------------------------------------
            // RADIO ŁÓDŹ
            // -------------------------------------------------
            if (posts.authors && Array.isArray(posts.authors) && posts.authors.length > 0) {
                authorHTML = posts.authors.map(a => {
                    const authorId = a.term_id ?? a.id;
                    const authorName = a.display_name ?? a.name ?? 'Autor';
                    return `<a href="https://krdrtradio.github.io/media/article-list?si=${encodeURIComponent(siteKey)}&a=${encodeURIComponent(authorId)}">${escapeHTML(authorName)}</a>`;
                }).join(', ');
            }
        } else {
            // -------------------------------------------------
            // STANDARDOWY WORDPRESS
            // -------------------------------------------------
            const author = posts._embedded?.author?.[0];
            if (author) {
                const link = `https://krdrtradio.github.io/media/article-list?si=${encodeURIComponent(siteKey)}&a=${encodeURIComponent(author.id)}`;
                authorHTML = `<a href="${link}">${escapeHTML(author.name)}</a>`;
            }
        }
        if (authorID) {
            const ids = String(authorID).split(',');
            try {
                // -------------------------------------------------
                // SINGLE
                // -------------------------------------------------
                if (ids.length === 1) {
                    containerAcon = 'Autor redakcji';
                } else {
                    // -------------------------------------------------
                    // MULTI
                    // -------------------------------------------------
                    containerAcon = 'Autorzy redakcji';
                }
            } catch (e) {
                console.warn('Błąd pobierania autorów', e);
            }
        }
        // =====================================================
        // 🔹 ESCAPE HTML
        // =====================================================
        const escapeHTML = (str) => str ? String(str).replace(/[&<>"']/g,
            (m) => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            })[m]) : "";
        // =====================================================
        // 🔹 NAGŁÓWKI
        // =====================================================
        if (containerS) {
            containerS.innerHTML = search ? `Wyniki dla: <b>${escapeHTML(search)}</b>` : '';
        }
        if (containerSl) {
            containerSl.innerHTML = slug ? `Identyfikator (slug): <b>${escapeHTML(slug)}</b>` : '';
        }
        if (containerP) {
            containerP.innerHTML = parent ? `Identyfikator nadrzędny: <b>${escapeHTML(parent)}</b>` : '';
        }
        if (containerMeT) {
            containerMeT.innerHTML = mediaType ? `Typ nośnika: <b>${escapeHTML(mediaType)}</b>` : '';
        }
        if (containerMiT) {
            containerMiT.innerHTML = mimeType ? `Typ MIME: <b>${escapeHTML(mimeType)}</b>` : '';
        }
        if (containerA) {
            containerA.innerHTML = containerAcon;
        }
        if (containerD) {
            containerD.innerHTML = dateText;
        }
        // =====================================================
        // 🔹 TYTUŁ STRONY
        // =====================================================
        function stripHTML(html) {
            if (!html) return '';
            return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        }
        const searchTitle = search ? 'Wyniki wyszukiwania: ' + search : '';
        const slugTitle = slug ? 'Identyfikator (slug):  ' + slug : '';
        const parentTitle = parent ? 'Identyfikator nadrzędny: ' + parent : '';
        const mediaTypeTitle = mediaType ? 'Typ nośnika: ' + mediaType : '';
        const mimeTypeTitle = mimeType ? 'Typ MIME: ' + mimeType : '';
        const docTitle = [
            searchTitle,
            slugTitle,
            parentTitle,
            mediaTypeTitle,
            mimeTypeTitle,
            stripHTML(containerAcon),
            stripHTML(dateText)
        ].filter(Boolean).join(' | ') || 'Artykuły';
        document.title = docTitle + ' | krdrtradio.github.io';
        // =====================================================
        // 🔹 GENEROWANIE HTML
        // =====================================================
        const postsHTML = posts.map(post => {
            const title = post.title.rendered.replace(/<[^>]+>/g, '');
            // -------------------------------------------------
            // AUTOR
            // -------------------------------------------------
            let authorHTML = 'Redakcja';
            if (siteKey === 'radiolodz') {
                // POSTY
                if (post.authors && post.authors.length > 0) {
                    authorHTML = post.authors.map(a => `<a href="https://krdrtradio.github.io/media/article-list?si=${siteKey}&a=${a.term_id}">${a.display_name}</a>`).join(', ');
                }
            } else {
                // NORMALNY WORDPRESS
                if (post._embedded?.author?.[0]) {
                    const author = post._embedded.author[0];
                    const link = `https://krdrtradio.github.io/media/article-list?si=${siteKey}&a=${author.id}`;
                    authorHTML = `<a href="${link}">${author.name}</a>`;
                }
            }
            let linkpost_url = '';
            let linkpost = null;
            if (post._embedded?.['wp:attached-to']?.[0]) {
                linkpost = post._embedded['wp:attached-to'][0];
                if (linkpost.type === 'post') {
                    linkpost_url = `https://krdrtradio.github.io/media/article?id=${encodeURIComponent(linkpost.slug)}&si=${encodeURIComponent(siteKey)}`;
                } else if (linkpost.type === 'page') {
                    linkpost_url = `https://krdrtradio.github.io/media/article?id=${encodeURIComponent(linkpost.slug)}&si=${encodeURIComponent(siteKey)}&tp=page`;
                } 
            }
            // -------------------------------------------------
            // DATA
            // -------------------------------------------------
            const postDate = new Date(post.date).toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
            });
            return `
            <article class="article_post">
                <div class="article_content">
                    <div class="article_title">
                        <a href="${post.guid.rendered}" target="_blank">${title || '{Brak tytułu}'}</a>
                    </div>
                    <div class="article_info">${is_author ? `<i class="fa-solid fa-user"></i> ${authorHTML} | `: ''}${postDate}</div>
                    ${linkpost_url ? `<div class="article_info_title"><i class="fa-solid fa-share"></i> <a href="${linkpost_url}" target="_blank">${linkpost.title.rendered}</a></div>` : ""}
                </div>
            </article>
         `;
        }).join('');
        // =====================================================
        // 🔹 WSTAWIENIE WYNIKÓW
        // =====================================================
        if (append) {
            container.querySelector('.articles')?.insertAdjacentHTML('beforeend', postsHTML);
        } else {
            container.innerHTML = `<div class="articles">${postsHTML}</div>`;
        }
        // =====================================================
        // 🔹 LOAD MORE
        // =====================================================
        if (button) {
            button.innerText = "Wczytaj więcej";
            button.disabled = false;
            button.style.display = posts.length < perPage ? 'none' : 'block';
            button.onclick = () => WPMediaList(mainUrl, siteKey, parent, parent_ex, slug, mediaType, mimeType, search, searchMatch, authorID, authorExID, year, month, day, is_author, true);
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = 'Błąd ładowania artykułów.';
        if (button) {
            button.style.display = 'none';
        }
    }
}
