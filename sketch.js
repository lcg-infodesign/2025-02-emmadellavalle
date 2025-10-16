let table = null;        // variabile che conterrà la tabella CSV caricata
let statusEl;            // elemento HTML dove mostreremo messaggi di stato
let hexData = [];        // array che conterrà i dati di ogni esagono

function setup() {
  // Trova l'elemento di testo con id "status" e mostra un messaggio iniziale
  statusEl = document.getElementById("status");
  statusEl.textContent = "Loading dataset...";

  // Tenta di caricare il dataset da due percorsi diversi
  loadTableWithFallback(
    ["assets/dataset.csv", "dataset.csv"],
    (tbl, usedPath) => {
      // Se il caricamento va a buon fine:
      table = tbl;
      statusEl.textContent = `Dataset caricato da: ${usedPath}. Righe: ${table.getRowCount()}, Colonne: ${table.getColumnCount()}`;
      createHexData(); // prepara i dati geometrici degli esagoni
      frameRate(30);   // imposta una frequenza di aggiornamento di 30 fps
    },
    (errPath) => {
      // Se il caricamento fallisce:
      statusEl.textContent = `Errore: impossibile caricare il dataset. Ho provato: ${errPath.join(", ")}`;
      console.error("loadTable fallback failed for paths:", errPath);

      // Mostra un messaggio di errore nel canvas
      createCanvas(600, 200).parent('canvas-holder');
      background(15);
      fill(255);
      noStroke();
      textSize(14);
      textAlign(LEFT, TOP);
      text("Errore: dataset non trovato.\nControlla che il CSV si trovi in 'assets/dataset.csv' oppure in 'dataset.csv'\nEsegui Live Server o altro server locale.", 16, 16);
    }
  );
}

// Funzione che prova a caricare il dataset da più percorsi (fallback)
function loadTableWithFallback(paths, successCallback, errorCallback) {
  function tryOne(index) {
    if (index >= paths.length) return errorCallback(paths); // se finiti tutti i percorsi → errore
    const p = paths[index];
    loadTable(
      p,
      "csv",
      "header",
      (tbl) => successCallback(tbl, p),  // caricamento riuscito
      (err) => {
        console.warn("Failed to load", p, err);
        tryOne(index + 1); // passa al prossimo percorso
      }
    );
  }
  tryOne(0);
}

// Funzione che genera i dati di posizione e dimensione per ogni esagono
function createHexData() {
  hexData = []; // svuota il vecchio array di esagoni
  let outerPadding = 5;  // margine superiore e inferiore
  let padding = 10;      // spazio tra esagoni
  let itemSize = 40;     // dimensione base di un esagono

  // Calcolo quante colonne di esagoni possono entrare nella larghezza della finestra
  let cols = max(1, floor((windowWidth - outerPadding * 2) / (itemSize + padding)));
  let colCount = 0;
  let rowCount = 0;

  // Prendo la prima colonna del dataset e ne calcolo i valori minimi e massimi
  let columnName = table.columns[0];
  let raw = table.getColumn(columnName);
  let nums = raw.map(v => parseFloat(v)).filter(v => !isNaN(v));
  let minValue = nums.length > 0 ? Math.min(...nums) : 0;
  let maxValue = nums.length > 0 ? Math.max(...nums) : 1;
  if (minValue === maxValue) { minValue -= 1; maxValue += 1; }

  // Calcolo la larghezza effettiva del layout e centro gli esagoni orizzontalmente
  let totalHexWidth = cols * itemSize + (cols - 1) * padding;
  let offsetX = (windowWidth - totalHexWidth) / 2;

  // Creo un oggetto per ogni riga del dataset
  for (let rowNumber = 0; rowNumber < table.getRowCount(); rowNumber++) {
    let valStr = table.getString(rowNumber, 0);  // leggo il valore della cella
    let myValue = parseFloat(valStr);
    if (isNaN(myValue)) myValue = minValue;      // gestisco eventuali valori non numerici

    // Scala il valore per definire la dimensione dell'esagono
    let scaled = map(myValue, minValue, maxValue, 6, itemSize * 0.9);

    // Calcolo la posizione x e y, centrando orizzontalmente
    let xPos = offsetX + colCount * (itemSize + padding);
    let yPos = outerPadding + rowCount * (itemSize + padding);

    // Genero un seme numerico per colore e rotazione unici
    let seed = hashString(valStr + "_" + rowNumber);

    // Aggiungo i dati di questo esagono all'array
    hexData.push({
      x: xPos + itemSize / 2,
      y: yPos + itemSize / 2,
      baseY: yPos + itemSize / 2,
      radius: scaled / 2,
      seed
    });

    // Passo alla colonna successiva o vado a nuova riga
    colCount++;
    if (colCount == cols) { colCount = 0; rowCount++; }
  }

  // Calcolo l'altezza totale del canvas e lo creo
  let totalHeight = outerPadding * 2 + (rowCount + 1) * itemSize + rowCount * padding;
  createCanvas(windowWidth, totalHeight).parent('canvas-holder');
}

// Funzione che disegna gli esagoni e gestisce l'animazione
function draw() {
  if (!table) return; // se il dataset non è ancora caricato, non disegno

  background("#0d0f12");  // sfondo scuro
  noFill();
  strokeWeight(2);         // spessore del bordo per dare più risalto
  colorMode(HSB, 360, 100, 100); // uso la modalità colore HSB (tinta, saturazione, luminosità)

  // Disegno ogni esagono dell'array
  hexData.forEach((hex, index) => {
    let rng = mulberry32(hex.seed);           // generatore pseudo-casuale
    let hue = (hex.seed * 37) % 360;          // colore base in base al seme

    // ✨ COLORI PIÙ VIVIDI E LUMINOSI
    // saturazione e luminosità aumentate per colori più accesi
    let t = frameCount * 0.04 + index * 0.6;  // tempo per animazione
    let brightness = 80 + sin(t) * 15;        // varia tra 65 e 95 → sempre luminoso
    let saturation = 85 + sin(t + 2) * 10;    // varia tra 75 e 95 → molto saturo
    stroke(hue, saturation, brightness);      // applico il colore al bordo

    push(); // salvo stato grafico

    // 🌊 Oscillazione verticale dolce
    let floatOffset = sin(frameCount * 0.05 + index * 0.3) * 4;
    translate(hex.x, hex.baseY + floatOffset);

    // 🔁 Rotazione leggera e continua
    let angle = rng() * TWO_PI + sin(frameCount * 0.05 + index) * 0.25;
    rotate(angle);

    // Disegno l'esagono
    drawHex(0, 0, hex.radius);
    pop(); // ripristino stato grafico
  });

  // Aggiorno il messaggio fisso sotto il canvas
  let columnName = table.columns[0];
  statusEl.textContent = `Disegnati ${table.getRowCount()} esagoni - ${columnName}.`;
}

// Funzione che disegna un singolo esagono centrato in (x, y)
function drawHex(x, y, radius) {
  beginShape();
  for (let i = 0; i < 6; i++) {
    let a = i * TWO_PI / 6;
    vertex(x + cos(a) * radius, y + sin(a) * radius);
  }
  endShape(CLOSE);
}

// Generatore pseudo-casuale con seme (per rendere i colori coerenti)
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Funzione che genera un hash numerico da una stringa (per ogni riga del CSV)
function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0; // forza h a 32 bit
  }
  return Math.abs(h);
}

// Quando la finestra cambia dimensione, ricreo il layout centrato
function windowResized() {
  if (table) createHexData();
}
