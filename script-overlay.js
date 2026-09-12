    // 1. Funkcja otwierająca nakładkę i generująca jej zawartość HTML
    function overlaysettings_on() {
      const overlay = document.getElementById("overlay");
      
      // Pokazujemy nakładkę
      overlay.style.display = "block";
      
      // Dynamicznie wstrzykujemy kod HTML wnętrza nakładki
      overlay.innerHTML = `
        <div class="overlay-content">
          <a href="#" class="close-btn" onclick="overlaysettings_off(event)">×</a>
          
          <label for="font-select">Wybierz czcionkę:</label>
          <select id="font-select">
            <option value="">Domyślny</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
            <option value="'Courier New', monospace">Courier New</option>
            <option value="'Georgia', serif">Georgia</option>
          </select>
          
          <br>
          <a href="#" class="save-btn" onclick="saveFontAndClose(event)">Zapisz i zamknij</a>
        </div>
      `;

      // Synchronizacja: Jeśli czcionka była już wcześniej zapisana, 
      // ustawiamy listę rozwijaną na ten właśnie wybór
      const savedFont = localStorage.getItem("userFont");
      if (savedFont) {
        document.getElementById("font-select").value = savedFont;
      }
    }

    // 2. Funkcja ukrywająca nakładkę
    function overlaysettings_off(event) {
      if (event) event.preventDefault(); // Zapobiega skakaniu strony przez "#"
      
      const overlay = document.getElementById("overlay");
      overlay.style.display = "none";
      overlay.innerHTML = ""; // Czyścimy zawartość, aby nie powielać elementów w pamięci DOM
    }

    // 3. Funkcja zapisująca wybór w localStorage i aplikująca zmianę
    function saveFontAndClose(event) {
      if (event) event.preventDefault();

      // Pobieramy wybraną czcionkę z selecta
      const selectedFont = document.getElementById("font-select").value;

      // Zapisujemy w pamięci przeglądarki [1, 2]
      localStorage.setItem("userFont", selectedFont);

      // Zmieniamy czcionkę dla całego dokumentu na żywo
      document.body.style.fontFamily = selectedFont;

      // Zamykamy okno nakładki
      overlaysettings_off();
    }

    // 4. Automatyczne wczytywanie czcionki przy każdym uruchomieniu strony
    document.addEventListener("DOMContentLoaded", () => {
      const savedFont = localStorage.getItem("userFont");
      if (savedFont) {
        // Jeśli znaleziono zapisaną czcionkę, od razu ją stosujemy
        document.body.style.fontFamily = savedFont;
      }
    });
