import { FOODS } from "./foods.js";
// Amounts are for one base portion. Nutrition values are estimates per 100 g.
export const EXTRA_FOODS = [
  ["mozzarella", "Mozzarella", 250, 18, 2, 19],
  ["mascarpone", "Mascarpone", 420, 4, 4, 42],
  ["emmentaler", "Emmentaler", 380, 28, 0, 29],
  ["spatzle", "Spätzle (frisch)", 160, 6, 30, 2],
  ["kalb", "Kalbsschnitzel", 110, 21, 0, 3],
  ["broesel", "Semmelbrösel", 350, 12, 70, 2],
  ["kokos", "Kokosmilch", 185, 2, 3, 19],
  ["bambus", "Bambussprossen", 27, 3, 3, 0],
  ["sellerie", "Sellerie", 42, 1.5, 7, 0.3],
  ["ricotta", "Ricotta", 174, 11, 3, 13],
  ["mais", "Mais (abgetropft)", 90, 3, 16, 1.5],
  ["sauerrahm", "Sauerrahm", 190, 3, 4, 18],
  ["cheddar", "Cheddar", 400, 25, 1, 33],
  ["brot", "Weizenbrot", 260, 9, 50, 3],
  ["schmand", "Schmand", 240, 3, 3, 24],
  ["lauch", "Lauch", 30, 2, 5, 0],
  ["feta", "Feta", 265, 14, 4, 21],
  ["gnocchi", "Gnocchi (frisch)", 150, 3, 31, 1],
  ["sahne", "Sahne", 292, 2, 3, 30],
  ["zucker", "Zucker", 400, 0, 100, 0],
  ["zwetschgen", "Zwetschgen", 46, 1, 10, 0],
  ["pecorino", "Pecorino", 390, 28, 0, 31],
  ["pinien", "Pinienkerne", 673, 14, 13, 68],
  ["hefe", "Frische Hefe", 105, 8, 18, 2],
  ["filo", "Filoteig", 300, 8, 56, 5],
  ["rotkohl", "Rotkohl", 31, 1, 6, 0],
  ["gurken", "Gewürzgurken", 15, 1, 2, 0],
  ["paneer", "Paneer", 300, 18, 3, 24],
  ["tahin", "Tahin (Sesam)", 595, 17, 21, 54],
  ["griess", "Weichweizengrieß", 350, 12, 70, 1],
  ["linsentrocken", "Rote Linsen (trocken)", 340, 25, 52, 2],
  ["erdnuss", "Erdnüsse", 567, 26, 16, 49],
  ["kuerbiskern", "Kürbiskerne", 559, 30, 11, 49],
  ["salat", "Blattsalat", 15, 1, 2, 0],
  ["bruehe", "Gemüsebrühe (zubereitet)", 5, 0.5, 0.5, 0.1],
  ["wasser", "Wasser", 0, 0, 0, 0],
  ["salbei", "Salbei", 50, 2, 8, 1],
  ["minze", "Minze", 44, 3, 5, 1],
  ["dill", "Dill", 43, 3, 7, 1],
  ["koriander", "Koriander (frisch)", 23, 2, 4, 0.5],
  ["vanille", "Vanillezucker", 400, 0, 100, 0],
  ["backpulver", "Backpulver", 100, 0, 25, 0],
  ["semmelknoedel", "Semmelknödel (fertig)", 180, 5, 34, 3],
  ["kartoffelknoedel", "Kartoffelklöße (fertig)", 150, 3, 32, 0.5],
  ["maultaschen", "Gemüse-Maultaschen", 170, 6, 25, 5],
  ["lasagneplatten", "Lasagneplatten (trocken)", 360, 12, 72, 1.5],
  ["cannelloni", "Cannelloni (trocken)", 360, 12, 72, 1.5],
  ["ravioli", "Spinat-Ricotta-Ravioli (frisch)", 220, 9, 30, 7],
].map(([id, name, kcal, p, c, f]) => ({
  id,
  name,
  kcal,
  p,
  c,
  f,
  defaultGrams: 100,
}));
const foods = [...FOODS, ...EXTRA_FOODS];
const ingredient = (id, grams, prep = "gegart") => {
  const f = foods.find((f) => String(f.id) === String(id));
  if (!f) throw new Error("Missing food " + id);
  return { ...f, grams, prep };
};
// [ingredient id, grams, preparation]; rice, pasta, flour and lentils refer to dry weight.
const amounts = {
  lasagne: [
    ["lasagneplatten", 80],
    [10, 120],
    [148, 180],
    [137, 100],
    [183, 10],
    [141, 10],
    ["mozzarella", 60],
    [129, 40],
  ],
  pomodoro: [
    [114, 100],
    [148, 200],
    [4, 10],
    [195, 5, "roh"],
  ],
  margherita: [
    [183, 125],
    ["hefe", 3],
    ["wasser", 75],
    [148, 100],
    ["mozzarella", 80],
    [4, 8],
    [195, 5, "roh"],
  ],
  pilzrisotto: [
    [2, 90],
    [128, 200],
    ["mascarpone", 40],
    [129, 40],
    ["bruehe", 350],
    [4, 8],
  ],
  kaesespaetzle: [
    ["spatzle", 250],
    ["emmentaler", 70],
    [129, 100],
    [141, 15],
  ],
  schnitzel: [
    ["kalb", 160],
    [9, 250],
    [183, 15],
    [8, 30],
    ["broesel", 30],
    [146, 20],
  ],
  redcurry: [
    [1, 160],
    [2, 70],
    ["kokos", 120],
    ["bambus", 100],
    [124, 100],
    [201, 4],
    [194, 5],
    [4, 5],
  ],
  dal: [
    ["linsentrocken", 90],
    ["kokos", 80],
    [2, 60],
    [194, 5],
    [203, 2],
    [205, 1],
    ["koriander", 5, "roh"],
  ],
  huehnersuppe: [
    [1, 150],
    [114, 70],
    [122, 100],
    ["sellerie", 60],
    ["bruehe", 500],
  ],
  cannelloni: [
    ["cannelloni", 90],
    [125, 180],
    ["ricotta", 100],
    [148, 180],
    ["mozzarella", 40],
    [4, 5],
  ],
  tacos: [
    [1, 160],
    [120, 100],
    ["mais", 70],
    ["salat", 40, "roh"],
    ["sauerrahm", 40],
    [200, 2],
    [4, 8],
  ],
  chili: [
    [155, 180],
    ["mais", 100],
    [148, 200],
    [124, 120],
    [129, 50],
    [200, 2],
    [202, 1],
    [4, 10],
  ],
  burger: [
    [10, 180],
    [121, 100],
    ["cheddar", 30],
    [126, 50, "roh"],
    ["salat", 30, "roh"],
    [4, 5],
  ],
  falafel: [
    [111, 220],
    [183, 15],
    [203, 2],
    [196, 5],
    ["brot", 80],
    [127, 100, "roh"],
    [138, 100, "roh"],
    ["minze", 3, "roh"],
    [4, 10],
  ],
  shakshuka: [
    [8, 120],
    [148, 200],
    [124, 150],
    [129, 50],
    [203, 2],
    [4, 10],
  ],
  gulasch: [[10, 0]],
  flammkuchen: [
    [183, 110],
    ["wasser", 60],
    ["schmand", 80],
    ["lauch", 100],
    [129, 60],
    [140, 30],
    [4, 5],
  ],
  tikkamasala: [
    [1, 160],
    [139, 80],
    [148, 180],
    [2, 75],
    ["sahne", 30],
    [194, 5],
    [201, 4],
    [4, 5],
  ],
  buddhabowl: [
    [115, 80],
    [125, 150],
    [8, 110],
    ["erdnuss", 20],
    ["koriander", 5, "roh"],
    [4, 8],
  ],
  kuerbissuppe: [
    [174, 350],
    ["kokos", 100],
    [194, 10],
    ["kuerbiskern", 20],
    ["bruehe", 250],
    [4, 5],
  ],
  ofengemuese: [
    [116, 200],
    [122, 150],
    [124, 100],
    [173, 100],
    ["feta", 90],
    [4, 12],
  ],
  haehnchenbrust: [
    [1, 180],
    [9, 300],
    [5, 120, "roh"],
    [199, 1],
    [4, 12],
    [196, 4, "roh"],
  ],
  gnocchi: [
    ["gnocchi", 280],
    [141, 25],
    ["salbei", 4],
  ],
  gratin: [
    [9, 350],
    ["sahne", 90],
    [137, 70],
    [140, 50],
    [141, 5],
  ],
  hackbraten: [
    [10, 180],
    [8, 30],
    ["broesel", 20],
    [129, 50],
    [166, 250],
    ["bruehe", 100],
    [206, 15],
    [4, 8],
  ],
  paella: [
    [2, 90],
    [1, 150],
    [175, 80],
    [176, 100],
    [124, 70],
    ["bruehe", 250],
    [200, 2],
    [4, 10],
  ],
  kaiserschmarrn: [
    [183, 80],
    [137, 130],
    [8, 110],
    [141, 15],
    ["zucker", 15],
    ["zwetschgen", 150],
  ],
  spinatknoedel: [
    [125, 180],
    ["brot", 120],
    [137, 70],
    [8, 55],
    [183, 15],
    [141, 25],
  ],
  fajitas: [
    [1, 170],
    [124, 180],
    [129, 60],
    [120, 100],
    ["sauerrahm", 40],
    [200, 2],
    [4, 10],
  ],
  kartoffelsuppe: [
    [9, 300],
    [122, 100],
    ["bruehe", 350],
    ["sahne", 40],
    [196, 5, "roh"],
    [4, 5],
  ],
  maultaschen: [
    ["maultaschen", 250],
    ["bruehe", 400],
    [122, 70],
    [196, 5, "roh"],
  ],
  kartoffelpuffer: [
    [9, 350],
    [8, 55],
    [183, 20],
    ["schmand", 70],
    [196, 5, "roh"],
    [146, 15],
  ],
  bolognese: [
    [114, 100],
    [10, 150],
    [148, 200],
    [122, 70],
    [129, 40],
    [4, 8],
  ],
  pesto: [
    [114, 100],
    [195, 25, "roh"],
    ["pinien", 20],
    ["pecorino", 25],
    [4, 20, "roh"],
  ],
  arrabbiata: [
    [114, 100],
    [148, 220],
    [202, 2],
    [192, 5],
    [4, 12],
  ],
  auberginenauflauf: [
    [131, 300],
    [148, 200],
    ["mozzarella", 90],
    ["pecorino", 20],
    [4, 20],
  ],
  ravioli: [
    ["ravioli", 250],
    [141, 20],
    ["salbei", 4],
  ],
  focaccia: [
    [183, 125],
    ["wasser", 90],
    ["hefe", 4],
    [4, 20],
    [199, 1],
  ],
  moussaka: [
    [131, 180],
    [9, 200],
    [10, 130],
    [148, 150],
    [137, 100],
    [183, 12],
    [141, 12],
    [4, 10],
  ],
  spanakopita: [
    ["filo", 100],
    [125, 250],
    ["feta", 100],
    [8, 55],
    ["dill", 5],
    [4, 15],
  ],
  gemista: [
    [124, 300],
    [2, 80],
    [148, 150],
    [129, 50],
    [196, 5],
    [4, 15],
  ],
  ratatouille: [
    [131, 150],
    [123, 150],
    [124, 100],
    [126, 200],
    [129, 60],
    [197, 1],
    [4, 15],
  ],
  zwiebelsuppe: [
    [129, 300],
    ["bruehe", 400],
    ["brot", 80],
    ["emmentaler", 50],
    [141, 15],
  ],
  quiche: [
    [183, 90],
    [141, 40],
    ["wasser", 20],
    [125, 200],
    [8, 110],
    ["sahne", 70],
  ],
  roesti: [
    [9, 350],
    [141, 20],
    [5, 150, "roh"],
    [196, 5, "roh"],
  ],
  semmelknoedel: [
    ["brot", 120],
    [137, 80],
    [8, 55],
    [128, 200],
    ["sahne", 70],
    [196, 5],
    [141, 10],
  ],
  rahmgeschnetzeltes: [
    ["rind", 170],
    [128, 150],
    ["sahne", 70],
    [2, 80],
    [129, 50],
    [207, 10],
    [4, 10],
  ],
  rinderrouladen: [
    ["rind", 180],
    [207, 15],
    ["gurken", 60],
    [129, 60],
    ["rotkohl", 200],
    ["kartoffelknoedel", 200],
    ["bruehe", 200],
    [4, 10],
  ],
  linsensuppe: [
    ["linsentrocken", 80],
    [9, 180],
    [122, 100],
    ["lauch", 70],
    ["sellerie", 50],
    ["bruehe", 400],
    [4, 8],
  ],
  tomatensuppe: [
    [148, 350],
    [129, 50],
    [192, 5],
    ["sahne", 60],
    [195, 5, "roh"],
    ["bruehe", 150],
    [4, 10],
  ],
  brokkolisuppe: [
    [3, 300],
    [9, 180],
    [129, 40],
    ["sahne", 60],
    ["bruehe", 300],
    [4, 5],
  ],
  minestrone: [
    [148, 180],
    [122, 70],
    ["sellerie", 50],
    [123, 100],
    [154, 100],
    [114, 60],
    ["bruehe", 350],
    [4, 10],
  ],
  chana: [
    [111, 200],
    [148, 180],
    [129, 50],
    [194, 10],
    [2, 70],
    [201, 3],
    [4, 10],
  ],
  palakpaneer: [
    ["paneer", 150],
    [125, 250],
    [129, 50],
    [194, 8],
    [203, 2],
    ["sahne", 30],
    [4, 10],
  ],
  aloogobi: [
    [130, 250],
    [9, 300],
    [126, 150],
    [194, 8],
    [205, 2],
    ["koriander", 5, "roh"],
    [4, 15],
  ],
  butterchicken: [
    [1, 170],
    [139, 70],
    [148, 180],
    [141, 20],
    ["sahne", 50],
    [2, 75],
    [201, 3],
  ],
  biryani: [
    [2, 90],
    [122, 100],
    [175, 80],
    [130, 150],
    [138, 100, "roh"],
    [201, 3],
    [4, 15],
  ],
  naan: [
    [183, 120],
    [138, 60],
    ["hefe", 3],
    ["wasser", 25],
    [141, 20],
    [192, 5],
  ],
  burrito: [
    [120, 100],
    [154, 150],
    [2, 50],
    ["mais", 70],
    ["cheddar", 40],
    [126, 80],
  ],
  quesadilla: [
    [120, 120],
    ["cheddar", 80],
    [124, 150],
    ["mais", 80],
    [4, 5],
  ],
  enchiladas: [
    [120, 100],
    [1, 160],
    [148, 180],
    ["cheddar", 50],
    [129, 50],
    [4, 8],
  ],
  maccheese: [
    [114, 100],
    ["cheddar", 75],
    [137, 150],
    [141, 15],
    [183, 10],
  ],
  ofenkartoffel: [
    [9, 400],
    [5, 200, "roh"],
    [196, 5, "roh"],
    [4, 8],
  ],
  couscous: [
    [119, 80],
    [122, 150],
    [124, 150],
    [111, 150],
    [4, 15],
  ],
  hummus: [
    [111, 200],
    ["tahin", 25],
    [192, 5],
    [4, 15],
    ["brot", 100],
    ["wasser", 40],
  ],
  menemen: [
    [8, 165],
    [126, 200],
    [124, 150],
    [129, 50],
    [4, 10],
  ],
  mercimek: [
    ["linsentrocken", 90],
    [122, 100],
    [9, 150],
    [129, 40],
    ["minze", 3],
    ["bruehe", 450],
    [4, 10],
  ],
  cilbir: [
    [8, 110],
    [139, 200, "roh"],
    [192, 5],
    [141, 20],
    [200, 2],
    ["brot", 100],
  ],
  pfannkuchen: [
    [183, 90],
    [137, 120],
    [8, 55],
    [5, 150, "roh"],
    ["zucker", 15],
    [146, 10],
  ],
  milchreis: [
    [2, 80],
    [137, 350],
    ["vanille", 8],
    ["zucker", 10],
    [204, 1],
  ],
  griesbrei: [
    ["griess", 65],
    [137, 350],
    [213, 150],
    ["vanille", 8],
    ["zucker", 10],
  ],
  waffeln: [
    [183, 90],
    [137, 100],
    [8, 55],
    [141, 25],
    ["zucker", 20],
    ["backpulver", 3],
    [215, 150],
    [5, 100, "roh"],
    ["vanille", 5],
  ],
};
EXTRA_FOODS.push({
  id: "rind",
  name: "Rindfleisch (roh)",
  kcal: 140,
  p: 22,
  c: 0,
  f: 6,
  defaultGrams: 170,
});
foods.push(EXTRA_FOODS.at(-1));
amounts.gulasch = [
  ["rind", 200],
  [129, 120],
  [206, 20],
  ["bruehe", 250],
  [200, 3],
  ["semmelknoedel", 200],
  [4, 10],
];
const methods = {
  lasagne:
    "Zwiebel würfeln und mit Rinderhack anbraten. Tomaten zugeben und 20 Minuten köcheln.|Butter schmelzen, Mehl einrühren, Milch nach und nach zugießen und kurz aufkochen.|Platten, Ragù und Béchamel in eine Form schichten, mit Mozzarella bedecken.|Bei 180 °C Ober-/Unterhitze etwa 35–40 Minuten backen, bis die Platten weich sind.",
  pomodoro:
    "Pasta in Salzwasser nach Packungsangabe garen.|Tomaten mit Olivenöl etwa 15 Minuten sanft köcheln, mit Salz und Pfeffer abschmecken.|Pasta unterheben und Basilikum erst beim Servieren darübergeben.",
  margherita:
    "Mehl, Hefe, Wasser, etwas Salz und Öl zu einem glatten Teig kneten. Abgedeckt mindestens 60 Minuten gehen lassen.|Ofen samt Blech auf 240 °C vorheizen. Teig dünn ausziehen.|Mit Tomaten und Mozzarella belegen und 10–15 Minuten backen. Basilikum danach auflegen.",
  pilzrisotto:
    "Brühe heiß halten. Zwiebel fein würfeln, Pilze in Scheiben schneiden.|Pilze im Öl anbraten und beiseitestellen. Zwiebel und Reis im Topf glasig anschwitzen.|Heiße Brühe kellenweise einrühren und etwa 20 Minuten garen. Pilze und Mascarpone unterheben.",
  kaesespaetzle:
    "Zwiebeln in Butter bei mittlerer Hitze goldbraun braten.|Frische Spätzle nach Packungsangabe erhitzen und abtropfen lassen.|Spätzle und geriebenen Emmentaler in der Pfanne mischen, bis der Käse schmilzt. Mit den gegarten Zwiebeln servieren.",
  schnitzel:
    "Kartoffeln gar kochen, abkühlen lassen, in Scheiben schneiden und in einem Teil des Öls knusprig braten.|Kalb dünn klopfen, salzen und nacheinander in Mehl, verquirltem Ei und Bröseln wenden.|Im übrigen heißen Öl von beiden Seiten goldbraun ausbacken und mit Kartoffeln servieren.",
  redcurry:
    "Reis nach Packungsangabe garen. Hähnchen und Paprika schneiden.|Ingwer und Currypulver kurz in Öl anschwitzen, Hähnchen zugeben und anbraten.|Kokosmilch, Paprika und Bambus zugeben und etwa 15 Minuten köcheln. Hähnchen vollständig durchgaren und mit Reis servieren.",
  dal: "Reis separat garen, trockene Linsen gründlich abspülen.|Ingwer und Gewürze in einem Topf mit etwas Wasser erwärmen.|Linsen, Kokosmilch und etwa die doppelte Linsenmenge Wasser zugeben, 20–25 Minuten weich kochen. Bei Bedarf Wasser ergänzen. Mit Reis und Koriander servieren.",
  huehnersuppe:
    "Möhren und Sellerie klein schneiden. Hähnchen mit Brühe aufkochen.|Bei kleiner Hitze etwa 25 Minuten garen, bis das Fleisch vollständig durch ist. Herausnehmen und zerteilen.|Gemüse und Nudeln in der Brühe nach Packungsangabe garen. Fleisch wieder zugeben.",
  cannelloni:
    "Spinat in der Pfanne zusammenfallen lassen, ausdrücken und mit Ricotta mischen.|Cannelloni mit der Masse füllen. Etwas Tomatensauce in eine Form geben und Cannelloni hineinlegen.|Mit übriger Sauce und Mozzarella bedecken. Bei 180 °C etwa 35–40 Minuten backen, bis die Pasta weich ist.",
  tacos:
    "Hähnchen in Streifen schneiden, mit Paprikapulver würzen und in Öl vollständig durchbraten.|Mais erwärmen, Salat waschen und schneiden. Tortillas nach Packungsangabe erwärmen.|Mit Hähnchen, Mais, Salat und Sauerrahm füllen.",
  chili:
    "Zwiebeln und Paprika würfeln und im Öl gründlich anschwitzen.|Tomaten, abgetropfte gekochte Bohnen, Mais und Gewürze zugeben.|Etwa 25 Minuten köcheln lassen, bis die Paprika weich ist. Mit Salz abschmecken.",
  burger:
    "Rinderhack zu dünnen Patties formen und in der heißen Pfanne beidseitig vollständig durchbraten.|Cheddar auf den heißen Patties schmelzen lassen und Brötchen kurz rösten.|Tomate und Salat waschen und die Burger damit zusammensetzen.",
  falafel:
    "Gekochte Kichererbsen abtropfen und gut trocknen. Mit Mehl, Kreuzkümmel und Petersilie grob pürieren.|Kleine flache Bällchen formen, mit Öl bestreichen und bei 200 °C etwa 25 Minuten backen, einmal wenden.|Joghurt mit Minze verrühren. Gurke schneiden und Brot erwärmen. Zusammen servieren.",
  shakshuka:
    "Zwiebeln und Paprika klein schneiden und im Öl weich dünsten.|Tomaten und Kreuzkümmel zugeben und 10 Minuten köcheln.|Mulden formen, Eier hineinschlagen und zugedeckt stocken lassen, bis das Eiweiß fest ist.",
  gulasch:
    "Rindfleisch würfeln und portionsweise in Öl kräftig anbraten.|Zwiebeln schneiden und im Bratensatz weich dünsten. Tomatenmark und Paprikapulver kurz mitrösten.|Fleisch und Brühe zugeben, zugedeckt 90–120 Minuten schmoren, bis das Fleisch weich ist. Bei Bedarf Wasser ergänzen.|Fertige Semmelknödel nach Packungsangabe garen und dazu servieren.",
  flammkuchen:
    "Mehl, Wasser, Öl und etwas Salz zu einem glatten Teig kneten und dünn ausrollen.|Lauch und Zwiebeln in einer Pfanne weich vorgaren.|Teig mit Schmand bestreichen, Gemüse und Käse darauf verteilen. Bei 230 °C etwa 12–15 Minuten knusprig backen.",
  tikkamasala:
    "Hähnchen würfeln, mit Joghurt und Currypulver mischen. Reis separat garen.|Ingwer in Öl anschwitzen, Hähnchen zugeben und anbraten.|Tomaten zugeben und 15–20 Minuten köcheln. Sahne einrühren. Fleisch vollständig durchgaren und mit Reis servieren.",
  buddhabowl:
    "Quinoa nach Packungsangabe garen. Eier 8–10 Minuten kochen.|Spinat in Öl dünsten, bis er zusammengefallen ist.|Quinoa, Spinat und geschälte Eier anrichten. Mit Erdnüssen und Koriander bestreuen.",
  kuerbissuppe:
    "Kürbis entkernen und würfeln, Ingwer klein schneiden.|Beides in Öl anschwitzen, Brühe zugeben und etwa 20 Minuten weich kochen.|Kokosmilch zugeben und pürieren. Kürbiskerne trocken rösten und beim Servieren darüberstreuen.",
  ofengemuese:
    "Ofen auf 200 °C vorheizen. Gemüse putzen und in gleichmäßige Stücke schneiden.|Mit Öl mischen und 30–35 Minuten backen, bis Süßkartoffel und Rote Bete weich sind.|Feta in den letzten 10 Minuten über das Gemüse bröseln.",
  haehnchenbrust:
    "Kartoffeln in Spalten schneiden, mit Öl und Rosmarin mischen und bei 200 °C etwa 30–35 Minuten backen.|Hähnchen in einer Pfanne rundherum anbraten und anschließend vollständig durchgaren.|Quark mit gehackter Petersilie, Salz und etwas Wasser cremig rühren. Zusammen servieren.",
  gnocchi:
    "Gnocchi nach Packungsangabe garen und abtropfen lassen.|Butter in einer Pfanne leicht bräunen. Salbei darin knusprig braten.|Gnocchi zugeben, vorsichtig schwenken und heiß servieren.",
  gratin:
    "Ofen auf 180 °C vorheizen. Kartoffeln schälen und sehr dünn schneiden.|Eine Form buttern. Kartoffeln einschichten und mit gewürzter Milch-Sahne-Mischung begießen.|Mit Gouda bestreuen und etwa 50 Minuten backen, bis die Kartoffeln weich sind.",
  hackbraten:
    "Zwiebel fein würfeln und im Öl weich dünsten. Mit Hack, Ei und Bröseln mischen.|Zu einem Laib formen und bei 180 °C etwa 50–60 Minuten vollständig durchbacken.|Brühe und Tomatenmark im Bratensatz kurz einkochen. Fertiges Kartoffelpüree nach Packungsangabe erwärmen und dazu servieren.",
  paella:
    "Hähnchen würfeln und in Öl anbraten. Paprika klein schneiden und mit Reis kurz anschwitzen.|Brühe und Paprikapulver zugeben und 10 Minuten sanft köcheln.|Erbsen und grüne Bohnen zugeben, weitere 15 Minuten garen, bis Reis und Bohnen gar und das Hähnchen durch sind. Bei Bedarf Wasser ergänzen.",
  kaiserschmarrn:
    "Zwetschgen entsteinen und mit etwas Wasser und einem Teil des Zuckers 10 Minuten zu Kompott kochen.|Eier trennen. Eigelb mit Milch und Mehl verrühren. Eiweiß steif schlagen und unterheben.|Butter in einer Pfanne schmelzen, Teig hineingeben und zugedeckt backen. Wenden, zerteilen und fertig braten. Mit Zucker und Kompott servieren.",
  spinatknoedel:
    "Spinat dünsten, ausdrücken und hacken. Brot würfeln und mit warmer Milch einweichen.|Mit Spinat, Ei und Mehl mischen. 15 Minuten ruhen lassen und Knödel formen.|In knapp siedendem Salzwasser etwa 15 Minuten gar ziehen lassen. Butter leicht bräunen und darübergeben.",
  fajitas:
    "Paprika und Zwiebeln in Streifen schneiden und im Öl weich braten.|Hähnchenstreifen mit Paprikapulver würzen, zugeben und vollständig durchbraten.|Tortillas erwärmen und mit dem gegarten Gemüse, Hähnchen und Sauerrahm füllen.",
  kartoffelsuppe:
    "Kartoffeln und Möhren schälen, klein schneiden und im Öl anschwitzen.|Brühe zugeben und etwa 20 Minuten weich kochen.|Suppe nach Wunsch teilweise pürieren, Sahne einrühren und Petersilie darübergeben.",
  maultaschen:
    "Möhren klein schneiden und etwa 10 Minuten in der Brühe garen.|Fertige Gemüse-Maultaschen in die heiße Brühe legen und nach Packungsangabe ziehen lassen.|Abschmecken und Petersilie beim Servieren darübergeben.",
  kartoffelpuffer:
    "Kartoffeln schälen, grob reiben und gut ausdrücken.|Mit Ei, Mehl und etwas Salz vermischen.|In heißem Öl flache Puffer von beiden Seiten jeweils etwa 4–5 Minuten goldbraun und gar braten. Mit Kräuterschmand servieren.",
  bolognese:
    "Zwiebel und Möhre fein würfeln und im Öl anschwitzen.|Hack zugeben und krümelig vollständig durchbraten. Tomaten zugießen und mindestens 25 Minuten köcheln.|Pasta nach Packungsangabe garen und mit der Sauce mischen.",
  pesto:
    "Pasta nach Packungsangabe garen, etwas Nudelwasser aufbewahren.|Pinienkerne trocken rösten und mit Basilikum, Öl und geriebenem Pecorino pürieren.|Pesto mit Pasta und etwas Nudelwasser mischen. Nicht erneut stark aufkochen.",
  arrabbiata:
    "Pasta in Salzwasser nach Packungsangabe garen.|Knoblauch klein schneiden und mit Chili in Öl gründlich anschwitzen.|Tomaten zugeben und etwa 15 Minuten köcheln lassen. Pasta unterheben.",
  auberginenauflauf:
    "Auberginen in Scheiben schneiden, mit Öl bestreichen und bei 200 °C etwa 20 Minuten vorgaren.|Mit Tomaten, Mozzarella und Pecorino in eine Form schichten.|Weitere 25 Minuten backen, bis die Auberginen weich und der Käse goldbraun sind.",
  ravioli:
    "Frische Ravioli nach Packungsangabe in Salzwasser garen.|Butter in einer Pfanne leicht bräunen und Salbei darin braten.|Ravioli abtropfen lassen und behutsam in der Salbeibutter schwenken.",
  focaccia:
    "Mehl, Hefe, Wasser, die Hälfte des Öls und etwas Salz verkneten. 60–90 Minuten abgedeckt gehen lassen.|Teig auf einem Blech ausziehen, mit den Fingern Mulden drücken und übriges Öl sowie Rosmarin darübergeben.|Bei 220 °C etwa 20–25 Minuten goldbraun backen.",
  moussaka:
    "Kartoffeln und Auberginen in dünne Scheiben schneiden, mit Öl bestreichen und bei 200 °C etwa 20 Minuten vorgaren.|Hack durchbraten, Tomaten zugeben und 15 Minuten köcheln.|Butter, Mehl und Milch zu einer Béchamel kochen. Gemüse und Hack schichten, Sauce darübergeben und bei 180 °C etwa 35 Minuten backen.",
  spanakopita:
    "Spinat dünsten, sehr gut ausdrücken und abkühlen lassen.|Mit Feta, Ei und Dill mischen. Filoblätter mit Öl bestreichen und eine Form damit auslegen.|Füllung hineingeben, Teig darüberklappen und bei 180 °C etwa 35 Minuten goldbraun backen.",
  gemista:
    "Reis 8 Minuten vorkochen. Zwiebeln in Öl gründlich dünsten und Tomaten zugeben.|Reis und Petersilie unterheben. Paprika entkernen und mit dem Tomatenreis füllen.|In einer Form mit etwas Wasser bei 190 °C etwa 40 Minuten garen, bis Paprika und Reis weich sind.",
  ratatouille:
    "Gemüse in gleichmäßige Stücke schneiden.|Zwiebeln im Öl weich dünsten. Auberginen, Paprika und Zucchini portionsweise anbraten.|Tomaten und Oregano zugeben und etwa 25 Minuten zugedeckt schmoren, bis alles weich ist.",
  zwiebelsuppe:
    "Zwiebeln in feine Streifen schneiden und in Butter langsam etwa 25 Minuten karamellisieren.|Brühe angießen und weitere 20 Minuten köcheln lassen.|Brot mit Emmentaler belegen und im Ofen überbacken. Auf die Suppe geben.",
  quiche:
    "Mehl, Butter, Wasser und etwas Salz zu einem Mürbeteig kneten und 20 Minuten kühlen.|Spinat dünsten und gut ausdrücken. Eier mit Sahne verquirlen und würzen.|Form mit Teig auslegen, Spinat und Guss hineingeben. Bei 180 °C etwa 35–40 Minuten backen, bis der Guss fest ist.",
  roesti:
    "Kartoffeln schälen, grob reiben und gut ausdrücken.|Butter erhitzen und Kartoffelraspel als flache Rösti langsam von beiden Seiten jeweils etwa 8 Minuten gar und knusprig braten.|Quark mit Petersilie, Salz und etwas Wasser verrühren und dazu servieren.",
  semmelknoedel:
    "Brot würfeln und in warmer Milch einweichen. Ei und Petersilie unterkneten und 15 Minuten ruhen lassen.|Knödel formen und in knapp siedendem Wasser etwa 15 Minuten gar ziehen lassen.|Pilze in Butter anbraten, Sahne zugeben und kurz einkochen. Mit den Knödeln servieren.",
  rahmgeschnetzeltes:
    "Reis nach Packungsangabe garen. Rindfleisch in dünne Streifen schneiden.|Fleisch portionsweise in Öl anbraten und herausnehmen. Zwiebeln und Pilze im Bratensatz vollständig garen.|Sahne und Senf zugeben, kurz einkochen. Fleisch wieder einlegen und fertig garen. Mit Reis servieren.",
  rinderrouladen:
    "Rindfleisch dünn klopfen, mit Senf bestreichen und mit Gurken- und Zwiebelstreifen füllen. Aufrollen und fixieren.|In Öl rundherum anbraten. Brühe zugeben und zugedeckt 90–120 Minuten weich schmoren.|Rotkohl fein schneiden und mit etwas Wasser zugedeckt etwa 35–45 Minuten weich dünsten. Fertige Kartoffelklöße nach Packungsangabe garen.",
  linsensuppe:
    "Trockene Linsen abspülen. Kartoffeln, Möhren, Lauch und Sellerie klein schneiden.|Gemüse in Öl anschwitzen, Linsen und Brühe zugeben.|Etwa 25 Minuten köcheln, bis Linsen und Kartoffeln weich sind. Bei Bedarf Wasser ergänzen.",
  tomatensuppe:
    "Zwiebeln und Knoblauch fein schneiden und in Öl vollständig weich dünsten.|Tomaten und Brühe zugeben und 20 Minuten köcheln.|Pürieren, Sahne einrühren und Basilikum beim Servieren zugeben.",
  brokkolisuppe:
    "Kartoffeln und Zwiebeln klein schneiden, Brokkoli in Röschen teilen.|Zwiebel im Öl weich dünsten, Kartoffeln und Brühe zugeben. 10 Minuten kochen.|Brokkoli zugeben und weitere 10 Minuten garen. Mit Sahne pürieren und abschmecken.",
  minestrone:
    "Möhren, Sellerie und Zucchini klein schneiden und im Öl anschwitzen.|Tomaten und Brühe zugeben und 15 Minuten köcheln.|Nudeln und gekochte Bohnen zugeben und nach Nudel-Packungsangabe fertig garen.",
  chana:
    "Reis nach Packungsangabe garen. Zwiebeln und Ingwer klein schneiden und im Öl gründlich dünsten.|Currypulver kurz mitrösten, Tomaten und gekochte Kichererbsen zugeben.|Etwa 20 Minuten köcheln lassen und mit dem Reis servieren.",
  palakpaneer:
    "Zwiebel und Ingwer fein schneiden und im Öl gründlich dünsten.|Spinat zugeben und zusammenfallen lassen. Mit Sahne und Kreuzkümmel pürieren.|Paneer würfeln und in der Sauce etwa 5 Minuten erwärmen.",
  aloogobi:
    "Kartoffeln würfeln und Blumenkohl in kleine Röschen teilen.|Ingwer im Öl anschwitzen. Gemüse, Kurkuma und Tomaten zugeben.|Etwas Wasser angießen und zugedeckt etwa 25 Minuten weich garen. Mit Koriander servieren.",
  butterchicken:
    "Hähnchen mit Joghurt und Currypulver mischen. Reis separat garen.|Hähnchen in Butter anbraten, Tomaten zugeben und 15–20 Minuten köcheln.|Sahne einrühren, Fleisch vollständig durchgaren und mit Reis servieren.",
  biryani:
    "Reis gründlich waschen. Möhren und Blumenkohl klein schneiden.|Gemüse mit Gewürzen in Öl anbraten. Reis, Erbsen und die auf der Reispackung angegebene Wassermenge zugeben.|Zugedeckt etwa 15–20 Minuten garen und kurz ruhen lassen. Mit Joghurt servieren.",
  naan: "Mehl, Hefe, Joghurt, Wasser und etwas Salz verkneten und 45–60 Minuten gehen lassen.|Knoblauch fein schneiden und in Butter vollständig garen.|Teig in Fladen teilen und in einer heißen Pfanne beidseitig je 2–3 Minuten backen. Mit der gegarten Knoblauchbutter bestreichen.",
  burrito:
    "Reis nach Packungsangabe garen. Gekochte Bohnen und Mais erwärmen.|Tomaten würfeln. Tortillas kurz erwärmen.|Mit Reis, Bohnen, Mais, Tomaten und Cheddar füllen, einschlagen und in einer Pfanne erwärmen, bis der Käse schmilzt.",
  quesadilla:
    "Paprika fein schneiden und im Öl vollständig weich braten.|Tortillas mit Paprika, Mais und Cheddar belegen und zusammenklappen.|In einer Pfanne von beiden Seiten rösten, bis der Käse schmilzt. In Stücke schneiden.",
  enchiladas:
    "Hähnchen und Zwiebel klein schneiden und in Öl vollständig durchbraten.|Tortillas damit füllen, aufrollen und in eine Form legen.|Mit Tomaten und Cheddar bedecken und bei 190 °C etwa 20 Minuten backen.",
  maccheese:
    "Pasta knapp bissfest kochen.|Butter schmelzen, Mehl einrühren, Milch nach und nach zugießen und aufkochen. Cheddar darin schmelzen.|Pasta mit Sauce mischen und bei 200 °C etwa 15 Minuten überbacken.",
  ofenkartoffel:
    "Kartoffeln waschen, einstechen, mit Öl bestreichen und bei 200 °C etwa 50–60 Minuten weich backen.|Quark mit gehackter Petersilie, Salz und etwas Wasser cremig rühren.|Kartoffeln aufschneiden und mit Kräuterquark füllen.",
  couscous:
    "Möhren und Paprika schneiden, mit Öl mischen und bei 200 °C etwa 25 Minuten weich rösten.|Couscous mit der auf der Packung angegebenen Menge kochendem Wasser übergießen und quellen lassen.|Gekochte Kichererbsen erwärmen und mit Couscous und Ofengemüse mischen.",
  hummus:
    "Knoblauch mit etwas Öl bei 180 °C etwa 15 Minuten weich rösten.|Gekochte Kichererbsen mit Tahin, geröstetem Knoblauch, Öl und Wasser cremig pürieren. Bei Bedarf mehr Wasser zugeben und salzen.|Fladenbrot erwärmen und mit dem Hummus servieren. Es wird kein Zitronensaft verwendet.",
  menemen:
    "Zwiebeln und Paprika klein schneiden und im Öl vollständig weich dünsten.|Tomaten klein schneiden und zugeben, etwa 10 Minuten schmoren.|Eier verquirlen und unterheben. Bei kleiner Hitze stocken lassen.",
  mercimek:
    "Trockene Linsen abspülen. Zwiebeln, Möhren und Kartoffeln klein schneiden.|Zwiebeln in Öl weich dünsten, übrige Zutaten und Brühe zugeben.|Etwa 25 Minuten weich kochen, pürieren und mit Minze abschmecken.",
  cilbir:
    "Knoblauch mit etwas Butter langsam vollständig weich rösten, abkühlen lassen und mit Joghurt verrühren.|Eier in knapp siedendem Wasser pochieren, bis das Eiweiß fest ist.|Übrige Butter schmelzen, Paprikapulver kurz einrühren. Eier auf dem Joghurt anrichten und mit Butter und warmem Brot servieren.",
  pfannkuchen:
    "Mehl, Milch und Ei glatt verrühren und 10 Minuten ruhen lassen.|In wenig Öl dünne Pfannkuchen von beiden Seiten goldbraun backen.|Quark mit Zucker und etwas Wasser cremig rühren und die Pfannkuchen damit füllen.",
  milchreis:
    "Reis mit Milch und Vanillezucker aufkochen.|Bei sehr kleiner Hitze unter regelmäßigem Rühren etwa 25–30 Minuten weich garen. Bei Bedarf Milch oder Wasser ergänzen.|Mit Zimt und Zucker servieren.",
  griesbrei:
    "Beeren mit etwas Wasser und Zucker etwa 5–10 Minuten zu Kompott kochen.|Milch mit Vanillezucker aufkochen, Grieß unter Rühren einrieseln lassen.|Bei kleiner Hitze etwa 5 Minuten quellen lassen und mit dem Kompott servieren.",
  waffeln:
    "Butter mit Zucker verrühren, Ei und Milch einarbeiten. Mehl und Backpulver unterrühren.|Waffeleisen erhitzen und den Teig portionsweise goldbraun backen.|Kirschen mit etwas Wasser erwärmen. Quark mit Vanillezucker verrühren und beides dazu servieren.",
};
export function baseRecipe(dish) {
  const list = amounts[dish.id];
  return {
    dishId: dish.id,
    name: dish.name,
    ingredients: list ? list.map((t) => ingredient(...t)) : [],
    instructions: methods[dish.id]?.split("|") || [],
    portions: { a: 1, b: 1 },
  };
}
