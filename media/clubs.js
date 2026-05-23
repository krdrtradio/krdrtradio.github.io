const jsonUrl = 'https://krdrtradio.github.io/media/json/clubs.json';
let allClubs = [];
async function loadClubs() {
   try {
      const response = await fetch(jsonUrl);
      const data = await response.json();
      allClubs = data.clubs;
      createCategories(allClubs);
      renderList(allClubs);
      // FILTR KATEGORII
      document
         .getElementById('categoryFilter')
         .addEventListener('change', filterClubs);
      // WYSZUKIWARKA
      document
         .getElementById('searchInputC')
         .addEventListener('input', filterClubs);
   } catch (error) {
      console.error('Błąd ładowania JSON:', error);
   }
}

function filterClubs() {
   const category =
      document.getElementById('categoryFilter').value;
   const search =
      document.getElementById('searchInputC')
      .value
      .toLowerCase();
   const filtered = allClubs.filter(club => {
      const matchCategory =
         category === 'all' ||
         club.category === category;
      const matchSearch =
         club.name.toLowerCase().includes(search) ||
         club.category.toLowerCase().includes(search);
      return matchCategory && matchSearch;
   });
   renderList(filtered);
}

function createCategories(clubs) {
   const select = document.getElementById('categoryFilter');
   const categories = [
      ...new Set(clubs.map(club => club.category))
   ];
   categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      select.appendChild(option);
   });
}

function renderList(clubs) {
   const list = document.getElementById('clubList');
   list.innerHTML = '';
   clubs.forEach(club => {
      const item = document.createElement('div');
      item.className = 'item';
      let button = '';
      // audio=true → odtwarzaj w playerze
      if (club.audio === true) {
         button = `<button onclick="playAudio('${club.value}', '${club.name}')">▶ Odtwórz</button>`;
      }
      // audio=false → otwórz link
      if (club.audio === false) {
         button = `<a href="${club.value}" target="_blank"><button>Otwórz w przeglądarce</button></a>`;
      }
      item.innerHTML = `<div class="title">${club.name} | <span class="category">${club.category}</span></div>${button}`;

      list.appendChild(item);
   });
}

function playAudio(url, title) {

   const player = document.getElementById('mainPlayer');
   const source = document.getElementById('mainSource');
   const settitle = document.getElementById('set-title');

   source.src = url;

   // tytuł seta
   settitle.textContent = title;

   // pokaż player
   player.style.display = 'block';

   player.load();
   player.play();

   // scroll do playera
   window.scrollTo({
      top: player.offsetTop - 50,
      behavior: 'smooth'
   });
}
loadClubs();
