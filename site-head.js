document.write('<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><link rel="icon" href="https://krdrtradio.github.io/favicon.png"><link rel="shortcut icon" href="https://krdrtradio.github.io/favicon.png"><link rel="apple-touch-icon" href="https://krdrtradio.github.io/favicon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css"><link rel="stylesheet" href="https://krdrtradio.github.io/style.css">');

async function hackBodyFont(
  fontName = 'Roboto',
  option = 1,
  customWeights = '',
  adobeId = ''
) {

  // Load custom font collection
  if (!document.getElementById('allfonts-css')) {
    const customLink = document.createElement('link');
    customLink.id = 'allfonts-css';
    customLink.rel = 'stylesheet';
    customLink.href = 'https://krdrtradio.github.io/fonts-hack/css/allfonts.css';
    document.head.appendChild(customLink);
  }

  // Fonts already available locally/custom CSS
  const customFonts = [
    'Averta',
    'Cookie',
    'DIN Pro Cond',
    'DIN Pro',
    'Konstytucyja',
    'Product Sans',
    'Proxima Nova Condensed',
    'Proxima Nova Extra Condensed',
    'Aptos',
    'Aptos Narrow',
    'Elementarz Caps',
    'Elementarz Pro',
    'Pixel Grid Circle M',
    'Pixel Grid Circle S',
    'Pixel Grid Circle XL',
    'Pixel Grid Square M',
    'Pixel Grid Square S',
    'Pixel Grid Square XL',
    'Sofia Pro',
    'SF Pro Display',
    'Univia Pro'
  ];

  // System fonts
  const systemFonts = [
    'Arial',
    'Arial Narrow',
    'Arial Black',
    'Calibri',
    'Calibri Light',
    'Comic Sans MS',
    'Courier New',
    'Georgia',
    'Impact',
    'Microsoft Sans Serif',
    'Tahoma',
    'Times New Roman',
    'Trebuchet MS',
    'Verdana',
    'Segoe UI'
  ];

  const isSystem = systemFonts.includes(fontName);
  const isCustom = customFonts.includes(fontName);
  const isAdobe = adobeId !== '';

  let link = document.getElementById('font-hack-link');

  // Remove old external font link if unnecessary
  if (isSystem || isCustom) {
    if (link) link.remove();
  } else {

    if (!link) {
      link = document.createElement('link');
      link.id = 'font-hack-link';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    if (isAdobe) {

      // Adobe Fonts
      link.href = `https://use.typekit.net/${adobeId}.css`;

    } else {

      // Google Fonts
      const weightMap = {
        0: 'ital,wght@0,100..900;1,100..900',
        1: 'wght@400;600;700',
        2: 'wght@400;700',
        3: `wght@${customWeights}`,
        4: `ital,wght@${customWeights}`
      };

      const selectedWeights = weightMap[option] || weightMap[1];
      const formattedFont = fontName.replace(/ /g, '+');

      link.href =
        `https://fonts.googleapis.com/css2?family=${formattedFont}:${selectedWeights}&display=swap`;
    }
  }

  // Apply font globally
  let style = document.getElementById('body-font-style');

  if (!style) {
    style = document.createElement('style');
    style.id = 'body-font-style';
    document.head.appendChild(style);
  }

  const fallback = isSystem ? '' : ', sans-serif';

  style.textContent = `
    body,
    body * {
      font-family: '${fontName}'${fallback} !important;
    }
  `;

  console.log(
    `Font set to: ${fontName} (${
      isAdobe
        ? 'Adobe'
        : isCustom
        ? 'Custom'
        : isSystem
        ? 'System'
        : 'Google'
    })`
  );
}

// Przykłady użycia:
// hackBodyFont('Montserrat', 0); // Pełny zakres wag + kursywa
// hackBodyFont('Open Sans', 3, '300;800'); // Własne wagi
// hackBodyFont('Google Sans', 1);

// Jak tego używać w Chrome?
// Otwórz dowolną stronę WWW (np. Google.pl, Wikipedia).
// Skasuj wszystko z paska adresu.
// Wpisz ręcznie słowo javascript: (Chrome często usuwa ten człon przy wklejaniu ze schowka dla bezpieczeństwa).
// Wklej resztę kodu zaraz po dwukropku i naciśnij Enter.
// javascript:(function(){async function hackBodyFont(e="Roboto",t=1,o="",i=""){if(!document.getElementById("allfonts-css")){let a=document.createElement("link");a.id="allfonts-css",a.rel="stylesheet",a.href="https://krdrtradio.github.io/fonts-hack/css/allfonts.css",document.head.appendChild(a)}let l=["Arial","Arial Narrow","Arial Black","Calibri","Calibri Light","Comic Sans MS","Courier New","Georgia","Impact","Microsoft Sans Serif","Tahoma","Times New Roman","Trebuchet MS","Verdana","Segoe UI"].includes(e),r=["Averta","Cookie","DIN Pro Cond","DIN Pro","Konstytucyja","Product Sans","Proxima Nova Condensed","Proxima Nova Extra Condensed","Aptos","Aptos Narrow","Elementarz Caps","Elementarz Pro","Pixel Grid Circle M","Pixel Grid Circle S","Pixel Grid Circle XL","Pixel Grid Square M","Pixel Grid Square S","Pixel Grid Square XL","Sofia Pro","SF Pro Display","Univia Pro"].includes(e),s=""!==i,n=document.getElementById("font-hack-link");if(l||r)n&&n.remove();else if(n||((n=document.createElement("link")).id="font-hack-link",n.rel="stylesheet",document.head.appendChild(n)),s)n.href=`https://use.typekit.net/${i}.css`;else{let d={0:"ital,wght@0,100..900;1,100..900",1:"wght@400;600;700",2:"wght@400;700",3:`wght@${o}`,4:`ital,wght@${o}`},c=d[t]||d[1],h=e.replace(/ /g,"+");n.href=`https://fonts.googleapis.com/css2?family=${h}:${c}&display=swap`}let f=document.getElementById("body-font-style");f||((f=document.createElement("style")).id="body-font-style",document.head.appendChild(f)),f.textContent=`body,body *{font-family:'${e}'${l?"":",sans-serif"}!important;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}`,console.log(`Font set to: ${e} (${s?"Adobe":r?"Custom":l?"System":"Google"})`)}let font=prompt("Font Name","Product Sans");font&&hackBodyFont(font)})();
// Jak to dodać w Chrome, Firefox lub Vivaldi?
// 1. Naciśnij Ctrl + D (lub Cmd + D na Macu), aby dodać dowolną stronę do zakładek.
// 2. Kliknij Więcej... lub Edytuj (zależnie od przeglądarki).
// 3. W polu Nazwa wpisz np. Hack Font.
// 4. W polu Adres URL (lub Lokalizacja) wklej powyższy długi kod zaczynający się od javascript:.
// 5. Zapisz.
// hackBodyFont('Roboto',1); / hackBodyFont('Open Sans',1); / hackBodyFont('TwojaNazwa',1,'','ID_PROJEKTU');
