let table;

function preload() {
  // put preload code here
  let table = loadTaste("dataset.csv", "csv", "header");
}

function setup() {
  console.log(table);

  let outerPadding = 20;
  let padding = 10;
  let itemSize = 30;

  // calcolo il numero di colonne
  let cols = floor((windowWidth - outerPadding * 2) / (itemSize + padding))

  let row = table.getRowCount() / cols;
  let totalWeight = outerPadding *2 + rows * itemSize + (rows -1) * padding;
  console.log("cols:", cols, "rows:", rows);

  //creo il canvas
  createCanvas(windowWidth, totalHeight);
  background ("coral");
  console.log("cols:", cols, "rows:", rows);

  console.log("colonne", cols)
  createCanvas(windowWidth, windowHeight);
  // put setup code here
  const message =
    "This is a template repository\nfor the course Laboratorio di Computergrafica\nCommunication Design, Politecnico di Milano";
  textAlign(CENTER, CENTER);
  textSize(16);
  text(message, width / 2, height / 2);
}

function draw() {
  // put drawing code here
}
