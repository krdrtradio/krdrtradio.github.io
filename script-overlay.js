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
            <option value="">Domyślna czcionka</option>
            <option value="'Aptos', sans-serif">Aptos</option>
            <option value="'Aptos Narrow', sans-serif">Aptos Narrow</option>
            <option value="'Comic Sans MS', cursive, sans-serif">Comic Sans MS</option>
            <option value="'Courier New', Courier, monospace">Courier New</option>
            <option value="'Domine', serif">Domine</option>
            <option value="'Dosis', sans-serif">Dosis</option>
            <option value="'Google Sans Flex', sans-serif">Google Sans Flex</option>
            <option value="'Kumbh Sans', sans-serif">Kumbh Sans</option>
            <option value="'Inter', sans-serif">Inter</option>
            <option value="'Lato', sans-serif">Lato</option>
            <option value="'Mali', cursive">Mali</option>
            <option value="'Montserrat', sans-serif">Montserrat</option>
            <option value="'Open Sans', sans-serif">Open Sans</option>
            <option value="'Playpen Sans', cursive">Playpen Sans</option>
            <option value="'Playwrite HR Lijeva', cursive">Playwrite HR Lijeva</option>
            <option value="'Poppins', sans-serif">Poppins</option>
            <option value="'Quicksand', sans-serif">Quicksand</option>
            <option value="'Raleway', sans-serif">Raleway</option>
            <option value="'Roboto', sans-serif">Roboto</option>
            <option value="'Roboto Slab', serif">Roboto Slab</option>
            <option value="'Rubik', sans-serif">Rubik</option>
            <option value="'SN Pro', sans-serif">SN Pro</option>
            <option value="'Sofia Pro', sans-serif">Sofia Pro</option>
            <option value="'Source Sans 3', sans-serif">Source Sans 3</option>
            <option value="'Times New Roman', Times, serif">Times New Roman</option>
            <option value="'Titillium Web', sans-serif">Titillium Web</option>
            <option value="'VT323', monospace">VT323</option>
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
