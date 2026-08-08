/ Struktura wszystkich 244 kategorii przesłanych przez użytkownika
const categoriesStructure = {
    "Jedzenie i Kuchnia": ["Owoce", "Warzywa", "Nabiał (sery, mleko)", "Mięsa i wędliny", "Ryby i owoce morza", "Pieczywo i wypieki", "Słodycze i desery", "Napoje bezalkoholowe", "Alkohole", "Przyprawy i zioła", "Potrawy mączne (pierogi, makarony)", "Zupy", "Fast food i przekąski", "Kasze, ryże i strączkowe", "Sosy i dipy", "Grzyby jadalne", "Dania kuchni polskiej", "Potrawy kuchni świata (np. pizza, sushi)", "Sprzęt AGD (lodówka, mikser)", "Przybory kuchenne (nóż, tarka)", "Naczynia (talerz, szklanka)", "Smaki i zapachy", "Czynności kuchenne (siekane, smażenie)", "Składniki ciast (mąka, proszek)"],
    "Geografia i Natura": ["Państwa", "Stolice świata", "Miasta w Polsce", "Miasta na świecie", "Rzeki", "Jeziora i stawy", "Morza i oceany", "Góry i pasma górskie", "Szczyty górskie", "Pustynie i stepy", "Wyspy i archipelagi", "Półwyspy i przylądki", "Kontynenty i regiony", "Województwa lub stany", "Jaskinie i groty", "Wulkany", "Parki narodowe", "Zjawiska pogodowe (deszcz, tornado)", "Chmury i mgły", "Minerały i kamienie szlachetne", "Skały i gleby", "Katastrofy naturalne", "Pojęcia geograficzne (równik, skala)", "Kierunki świata i wiatry"],
    "Przyroda, Flora i Fauna": ["Ssaki lądowe", "Ptaki", "Ryby", "Owady i pajęczaki", "Gady (węże, jaszczurki)", "Płazy (żaby, traszki)", "Stworzenia morskie (ośmiornice, meduzy)", "Rasa psa", "Rasa kota", "Zwierzęta domowe i hodowlane", "Zwierzęta egzotyczne", "Zwierzęta prehistoryczne (dinozaury)", "Drzewa liściaste", "Drzewa iglaste", "Kwiaty ogrodowe", "Kwiaty doniczkowe", "Chwasty i rośliny polne", "Krzewy i krzewinki", "Części roślin (liść, korzeń)", "Środowiska życia (tundra, dżungla)", "Zwierzęta nocne", "Pasożyty", "Zwierzęta chronione", "Odgłosy zwierząt (mruczenie, szczekanie)"],
    "Transport i Pojazdy": ["Marki samochodów osobowych", "Modele samochodów", "Części samochodowe (silnik, wycieraczka)", "Motocykle i skuterki", "Pojazdy jednośladowe (rower, hulajnoga)", "Ciężarówki i TIR-y", "Maszyny rolnicze (traktor, kombajn)", "Maszyny budowlane (koparka, dźwig)", "Pojazdy uprzywilejowane (karetka, radiowóz)", "Pojazdy szynowe (pociąg, tramwaj)", "Samoloty i lotnictwo", "Helikoptery i drony", "Statki kosmiczne i rakiety", "Statki i duże jednostki wodne", "Łodzie i sporty wodne (kajak, jacht)", "Elementy drogi (rondo, skrzyżowanie)", "Znaki drogowe", "Rodzaje paliw i napędów", "Wyposażenie pojazdu (gaśnica, apteczka)", "Płyny eksploatacyjne (olej, płyn do szyb)"],
    "Człowiek, Ciało i Zdrowie": ["Anatomia (organy wewnętrzne)", "Kości i stawy", "Części twarzy", "Części ciała (zewnętrzne)", "Zawody i profesje", "Stopnie wojskowe i służbowe", "Specjalizacje medyczne (lekarze)", "Choroby i dolegliwości", "Uczucia i emocje", "Cechy charakteru (pozytywne)", "Cechy charakteru (negatywne)", "Wygląd zewnętrzny (np. piegi, łysina)", "Członkowie rodziny i pokrewieństwo", "Etapy życia człowieka (niemowlę, starzec)", "Zmysły i odruchy", "Leki i materiały medyczne", "Badania medyczne (RTG, USG)", "Fryzury i zarost", "Typy osobowości i temperamenty", "Czynności życiowe (sen, oddychanie)"],
    "Dom, Garderoba i Codzienność": ["Meble pokojowe", "Odzież wierzchnia (kurtki, płaszcze)", "Obuwie (buty)", "Bielizna", "Nakrycia głowy (czapki, kapelusze)", "Biżuteria i dodatki", "Kosmetyki do makijażu", "Kosmetyki do higieny (szampon, mydło)", "Środki czystości (proszek, płyn)", "Narzędzia warsztatowe (młotek, śrubokręt)", "Tekstylia domowe (zasłony, dywany)", "Pomieszczenia w domu", "Elementy budynku (okno, dach)", "Artykuły biurowe i papiernicze", "Zabawki dziecięce", "Materiały i tkaniny (bawełna, jedwab)", "Oświetlenie (lampa, żyrandol)", "Prace domowe (odkurzanie, pranie)", "Rzeczy noszone w kieszeni/torebce", "Pamiątki i bibeloty"],
    "Technologia i Nauka": ["Języki programowania", "Sprzęt komputerowy (hardware)", "Akcesoria komputerowe (mysz, pendrive)", "Oprogramowanie i aplikacje", "Portale społecznościowe i strony www", "Pojęcia internetowe (Wi-Fi, URL)", "Elektronika użytkowa (smartfon, TV)", "Pierwiastki chemiczne", "Dziedziny nauki (biologia, fizyka)", "Przyrządy naukowe (mikroskop, lupa)", "Jednostki miar i wag (metr, kilogram)", "Pojęcia matematyczne (ułamek, trójkąt)", "Ciała niebieskie (planety, gwiazdy)", "Pojęcia fizyczne (grawitacja, tarcie)", "Wynalazki przełomowe", "Formy energii i elektrownie", "Metale i stopy (stal, miedź)", "Tworzywa sztuczne i materiały budowlane", "Skróty technologiczne (USB, HDMI)", "Znaki i symbole matematyczne/logiczne"],
    "Kultura, Rozrywka i Sztuka": ["Instrumenty muzyczne", "Gatunki muzyczne", "Gatunki filmowe", "Zawody filmowe i teatralne (aktor, reżyser)", "Tańce narodowe i towarzyskie", "Gatunki literackie (kryminał, poezja)", "Elementy książki (rozdział, okładka)", "Style architektoniczne (gotyk, barok)", "Dziedziny sztuki (malarstwo, rzeźba)", "Przybory malarskie (pędzel, sztaluga)", "Gry planszowe i karciane", "Gry komputerowe i wideo", "Instrumenty perkusyjne", "Muzea i instytucje kultury", "Instrumenty dęte", "Elementy scenografii i teatru", "Magazyny i czasopisma", "Postacie fikcyjne z bajek i komiksów", "Formy dziennikarskie (wywiad, reportaż)", "Nagrody kulturalne (Oscar, Nobel)"],
    "Sport i Rekreacja": ["Dyscypliny sportowe (ogólne)", "Sporty zimowe", "Sporty wodne", "Sporty walki", "Gry zespołowe", "Lekkoatletyka (dyscypliny)", "Sprzęt sportowy (piłka, rakieta)", "Stroje sportowe (kaski, ochraniacze)", "Pozycje i role w sporcie (bramkarz, sędzia)", "Obiekty sportowe (stadion, basen)", "Hobby i czas wolny (wędkarstwo, majsterkowanie)", "Atrakcje wesołego miasteczka", "Turystyka (namiot, plecak, kemping)", "Gry podwórkowe (berek, chowanego)", "Ćwiczenia fizyczne (pompki, przysiady)", "Konkursy i trofea (medal, puchar)", "Terminy sportowe (faul, aut, spalony)", "Sporty ekstremalne", "Gry zręcznościowe (bilard, rzutki)", "Sztuczki i akrobacje"],
    "Miasto, Społeczeństwo i Państwo": ["Budynki użyteczności publicznej (szkoła, sąd)", "Sklepy i punkty usługowe (fryzjer, piekarnia)", "Zabytki i obiekty turystyczne", "Elementy architektury miejskiej (most, rondo)", "Meble miejskie (ławka, latarnia, śmietnik)", "Dokumenty osobiste (dowód, paszport)", "Waluty świata", "Języki świata", "Służby mundurowe i ratunkowe", "Religie i wyznania", "Święta i uroczystości (Boże Narodzenie, ślub)", "Przedmioty kultu religijnego", "Podatki i pojęcia finansowe", "Przestępstwa i wykroczenia", "Instytucje państwowe (ZUS, urząd)", "Typy szkół i edukacja", "Przedmioty szkolne", "Narody i narodowości", "Imiona męskie", "Imiona żeńskie"],
    "Historia, Czas i Mitologia": ["Epoki historyczne (średniowiecze, antyk)", "Bogowie greccy i rzymscy", "Stwory mitologiczne (smok, jednorożec)", "Broń biała i historyczna (miecz, łuk)", "Elementy zbroi rycerskiej", "Jednostki czasu (sekunda, wiek)", "Miesiące", "Dni tygodnia", "Znaki zodiaku", "Tytuły szlacheckie i władcy (król, hrabia)", "Dawne zawody (kowal, rymarz)", "Skamieliny i archeologia", "Ważne wydarzenia historyczne (wojna, bitwa)", "Formy rządów (demokracja, monarchia)", "Symbole narodowe (flaga, godło)", "Wynalazki starożytne"],
    "Kolory, Abstrakcje i Przymiotniki": ["Kolory podstawowe i pochodne", "Odcienie kolorów (np. fuksja, seledyn)", "Kształty geometryczne", "Wzory i tekstury (paski, kratka, kropki)", "Przymiotniki opisujące wielkość", "Przymiotniki opisujące temperaturę", "Przymiotniki opisujące stan skupienia", "Stanowiska i role w pracy (kierownik, dyrektor)", "Dźwięki i odgłosy otoczenia (huk, szelest)", "Systemy liczbowe i cyfry", "Synonimy słowa \"fajny/ładny\"", "Przemnożenia i wielokrotności (para, tuzin)", "Kierunki i pozycje przestrzenne (wewnątrz, pod)", "Przymiotniki opisujące wiek i zużycie", "Zjawiska optyczne (tęcza, cień)", "Abstrakcyjne wartości (miłość, wolność)"],
    "Kategorie Specjalne i Popkulturowe": ["Słowa 3-literowe", "Słowa kończące się na \"-cja\"", "Coś, co jest okrągłe", "Coś, co jest zielone", "Coś, co można otworzyć", "Coś, co łatwo zgubić", "Rzeczy, które śmierdzą", "Rzeczy, które są gorące", "Marki luksusowe (odzież, zegarki)", "Superbohaterowie i złoczyńcy", "Słynne logo / marki (ogólne)", "Rzeczy, które potrafią latać"]
};
// Przykładowa baza haseł z hasłami wielowyrazowymi
let database = [{
    word: "AMERYKA PÓŁNOCNA",
    category: "Kontynenty i regiony"
}, {
    word: "OWOCE MORZA",
    category: "Ryby i owoce morza"
}, {
    word: "PIZZA MARGHERITA",
    category: "Potrawy kuchni świata (np. pizza, sushi)"
}, {
    word: "MORZE BAŁTYCKIE",
    category: "Morza i oceany"
}, {
    word: "BOŻE NARODZENIE",
    category: "Święta i uroczystości (Boże Narodzenie, ślub)"
}];
const gallowsStages = ["  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========", "  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========", "  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========", "  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========", "  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========", "  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========", "  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n========="];
const alphabet = "AĄBCĆDEĘFGHIJKLŁMNŃOÓPRSŚTUWYZŹŻ";
let selectedWordObj = null;
let guessedLetters = [];
let mistakes = 0;
let score = 0;
const maxMistakes = 6;
const gallowsEl = document.getElementById("gallows");
const wordDisplayEl = document.getElementById("word-display");
const alphabetEl = document.getElementById("alphabet");
const messageEl = document.getElementById("message");
const resetBtn = document.getElementById("reset-btn");
const categoryDisplayEl = document.getElementById("category-display");
const scoreDisplayEl = document.getElementById("score-display");

function playSound(type) {
    const ctx = new(window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'correct') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'win') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    }
}

function populateCategorySelect() {
    const selectEl = document.getElementById("new-category");
    if (!selectEl) return;
    selectEl.innerHTML = "";
    for (const [groupName, subCategories] of Object.entries(categoriesStructure)) {
        const optGroup = document.createElement("optgroup");
        optGroup.label = groupName;
        subCategories.forEach(subCat => {
            const option = document.createElement("option");
            option.value = subCat;
            option.textContent = subCat;
            optGroup.appendChild(option);
        });
        selectEl.appendChild(optGroup);
    }
}

function initGame() {
    mistakes = 0;
    guessedLetters = [];
    messageEl.textContent = "";
    resetBtn.style.display = "none";
    if (database.length === 0) {
        wordDisplayEl.textContent = "BRAK SŁÓW";
        categoryDisplayEl.textContent = "-";
        return;
    }
    selectedWordObj = database[Math.floor(Math.random() * database.length)];
    categoryDisplayEl.textContent = selectedWordObj.category;
    scoreDisplayEl.textContent = score;
    updateDisplay();
    generateKeyboard();
}
// KLUCZOWA ZMIANA: Obsługa spacji w wyświetlaniu hasła
function updateDisplay() {
    gallowsEl.textContent = gallowsStages[mistakes];
    const displayWord = selectedWordObj.word.split("").map(letter => {
        if (letter === " ") {
            return "\u00A0\u00A0"; // Twarda spacja (odstęp między wyrazami)
        }
        return guessedLetters.includes(letter) ? letter : "_";
    }).join(" ");
    wordDisplayEl.textContent = displayWord;
    checkGameStatus();
}

function generateKeyboard() {
    alphabetEl.innerHTML = "";
    alphabet.split("").forEach(letter => {
        const button = document.createElement("button");
        button.textContent = letter;
        button.classList.add("btn", "letter-btn");
        button.setAttribute("data-letter", letter);
        button.addEventListener("click", () => handleGuess(letter));
        alphabetEl.appendChild(button);
    });
}

function handleGuess(letter) {
    guessedLetters.push(letter);
    const button = document.querySelector(`button[data-letter='${letter}']`);
    if (button) button.disabled = true;
    if (selectedWordObj.word.includes(letter)) {
        playSound('correct');
    } else {
        mistakes++;
        playSound('wrong');
    }
    updateDisplay();
}
// KLUCZOWA ZMIANA: Ignorowanie spacji podczas weryfikacji wygranej
function checkGameStatus() {
    // Sprawdzamy czy gracz odgadł wszystkie litery (pomijając spacje w haśle)
    const allLettersGuessed = selectedWordObj.word.split("").filter(letter => letter !== " ").every(letter => guessedLetters.includes(letter));
    if (selectedWordObj && allLettersGuessed) {
        messageEl.textContent = "Gratulacje! Wygrałeś! 🎉";
        messageEl.style.color = "#2ecc71";
        score += 10;
        scoreDisplayEl.textContent = score;
        playSound('win');
        disableAllButtons();
        resetBtn.style.display = "block";
    } else if (mistakes >= maxMistakes) {
        messageEl.textContent = `Przegrana! Hasło: ${selectedWordObj.word}`;
        messageEl.style.color = "#e74c3c";
        score = Math.max(0, score - 5);
        scoreDisplayEl.textContent = score;
        disableAllButtons();
        resetBtn.style.display = "block";
    }
}

function disableAllButtons() {
    document.querySelectorAll(".letter-btn").forEach(btn => btn.disabled = true);
}

function openModal() {
    document.getElementById("edit-modal").style.display = "flex";
    renderDatabaseList();
}

function closeModal() {
    document.getElementById("edit-modal").style.display = "none";
    initGame();
}

function renderDatabaseList() {
    const listContainer = document.getElementById("words-in-database");
    if (!listContainer) return;
    listContainer.innerHTML = "";
    database.forEach((item, index) => {
        const div = document.createElement("div");
        div.classList.add("word-item");
        div.innerHTML = `<span><strong>${item.word}</strong> (${item.category})</span> <button class="remove-btn" onclick="removeWord(${index})">Usuń</button>`;
        listContainer.appendChild(div);
    });
}

function addNewWord() {
    const wordInput = document.getElementById("new-word");
    const categoryInput = document.getElementById("new-category");
    // Zezwalamy na spacje wewnątrz słowa (.trim() usuwa tylko spacje na początku i końcu)
    const wordText = wordInput.value.trim().toUpperCase();
    const categoryText = categoryInput.value;
    if (wordText.length < 2) {
        alert("Słowo musi mieć przynajmniej 2 litery!");
        return;
    }
    database.push({
        word: wordText,
        category: categoryText
    });
    wordInput.value = "";
    renderDatabaseList();
}

function removeWord(index) {
    database.splice(index, 1);
    renderDatabaseList();
}
populateCategorySelect();
initGame();
