/**
 * De testbundel. Draaien met `npm test`.
 *
 * Drie lagen:
 *   1. de Markdown-lezer, want daar komt alle inhoud doorheen
 *   2. de rekenkern, met gevallen waarvan de uitkomst met de hand na te rekenen is
 *   3. de bouw als geheel, met de cijfers die in de rapporten staan als ijkpunt
 *
 * Laag 3 is de belangrijkste. Als iemand de weegmethode aanpast of een stelling
 * toevoegt, veranderen die cijfers, en dan hoort deze test te zakken. Dat is geen
 * ongemak maar het doel: de getallen in de rapporten en het dashboard moeten dezelfde
 * getallen zijn.
 */
import { test, gelijk, bijna, gooit, rapport } from './loop.mjs';
import { leesMarkdown, naarHtml, escapeHtml } from '../src/markdown.mjs';
import {
  eensgezindheid, stellingstatus, gewichtRangorde, gewichtGemiddelde,
  groepsgewicht, locatiescore, hussel, toevalsreeks,
} from '../src/bereken.mjs';
import { bouw } from '../src/bouw.mjs';
import { contrast, afstand } from '../src/controleer.mjs';

/* ============================================================ 1. markdown */

test('frontmatter leest tekst, getallen, ja/nee en lijsten', () => {
  const { kop } = leesMarkdown([
    '---', 'titel: Proef', 'aantal: 12', 'aan: ja', 'uit: nee',
    'codes: [K1, K7]', '---', '', 'body',
  ].join('\n'));
  gelijk(kop.titel, 'Proef');
  gelijk(kop.aantal, 12);
  gelijk(kop.aan, true);
  gelijk(kop.uit, false);
  gelijk(kop.codes, ['K1', 'K7']);
});

test('frontmatter leest een lijst over meerdere regels', () => {
  const { kop } = leesMarkdown(['---', 'schaal:', '  - laag', '  - hoog', '---'].join('\n'));
  gelijk(kop.schaal, ['laag', 'hoog']);
});

test('tabel wordt een lijst objecten met de kolomkoppen als sleutel', () => {
  const { tabellen } = leesMarkdown([
    '| code | naam |', '|---|---|', '| A | water |', '| B | bodem |',
  ].join('\n'));
  gelijk(tabellen.length, 1);
  gelijk(tabellen[0], [{ code: 'A', naam: 'water' }, { code: 'B', naam: 'bodem' }]);
});

test('een rij met te weinig kolommen stopt de bouw met regelnummer', () => {
  gooit(() => leesMarkdown(['| a | b |', '|---|---|', '| 1 |'].join('\n'), 'proef.md'),
    'proef\\.md:3.*1 kolom.*2 kolommen');
});

test('secties worden platte tekst onder hun kop', () => {
  const { secties } = leesMarkdown(['## Mijn Kop', '', 'regel een', 'regel twee'].join('\n'));
  gelijk(secties['mijn-kop'], 'regel een\nregel twee');
});

test('html in inhoud wordt onschadelijk gemaakt', () => {
  gelijk(escapeHtml('<script>"x"</script>'),
    '&lt;script&gt;&quot;x&quot;&lt;/script&gt;');
  gelijk(naarHtml('**vet** en `code`'), '<b>vet</b> en <code>code</code>');
});

/* ========================================================== 2. rekenkern */

test('eensgezindheid is 1 als iedereen hetzelfde invult', () => {
  bijna(eensgezindheid([2, 2, 2, 2]), 1);
});

test('eensgezindheid van een groep exact in tweeen is 0,4286', () => {
  // vier keer 0 en vier keer 3: 12 paren op afstand 0, 16 paren op afstand 3
  // gemiddelde afstand 48/28 = 1,714 -> 1 - 1,714/3 = 0,4286
  bijna(eensgezindheid([0, 0, 0, 0, 3, 3, 3, 3]), 0.42857, 0.0001);
});

test('eensgezindheid kijkt naar spreiding en niet naar richting', () => {
  gelijk(eensgezindheid([0, 0, 0, 0]), eensgezindheid([3, 3, 3, 3]));
});

test('samen tegen is geen verdeeldheid', () => {
  gelijk(stellingstatus(0, 8), 'samen-tegen');
  gelijk(stellingstatus(8, 0), 'samen-voor');
  gelijk(stellingstatus(5, 3), 'sloot');
  gelijk(stellingstatus(4, 4), 'verdeeld');
  gelijk(stellingstatus(3, 5), 'verdeeld');
});

test('gewichten tellen op tot honderd, in beide methodes', () => {
  const themas = [{ code: 'A' }, { code: 'B' }, { code: 'C' }];
  const stellingen = [
    { nr: 1, thema: 'A', omgekeerd: false }, { nr: 2, thema: 'B', omgekeerd: false },
    { nr: 3, thema: 'C', omgekeerd: false },
  ];
  const lid = { antwoorden: [3, 1, 0], topvijf: [] };
  for (const methode of [gewichtRangorde, gewichtGemiddelde]) {
    const gewicht = methode(lid, stellingen, themas);
    bijna(Object.values(gewicht).reduce((a, b) => a + b, 0), 100, 0.0001, methode.name);
  }
});

test('rangorde kijkt naar volgorde, gemiddelde ook naar strengheid', () => {
  // Twee leden met dezelfde volgorde maar een andere strengheid: streng en mild.
  // De rangordemethode hoort ze identiek te wegen, de gemiddeldemethode niet.
  const themas = [{ code: 'A' }, { code: 'B' }, { code: 'C' }];
  const stellingen = [
    { nr: 1, thema: 'A', omgekeerd: false }, { nr: 2, thema: 'B', omgekeerd: false },
    { nr: 3, thema: 'C', omgekeerd: false },
  ];
  const streng = { antwoorden: [3, 2, 1], topvijf: [] };
  const mild = { antwoorden: [2, 1, 0], topvijf: [] };

  gelijk(gewichtRangorde(streng, stellingen, themas),
    gewichtRangorde(mild, stellingen, themas),
    'rangorde hoort alleen naar de volgorde te kijken');

  const een = gewichtGemiddelde(streng, stellingen, themas);
  const twee = gewichtGemiddelde(mild, stellingen, themas);
  gelijk(Math.abs(een.A - twee.A) > 1, true,
    'de gemiddeldemethode hoort hier juist wel verschil te zien');
});

test('omgekeerde stellingen tellen gespiegeld', () => {
  const themas = [{ code: 'A' }, { code: 'B' }];
  const stellingen = [
    { nr: 1, thema: 'A', omgekeerd: false }, { nr: 2, thema: 'B', omgekeerd: true },
  ];
  const gewicht = gewichtGemiddelde({ antwoorden: [3, 3], topvijf: [] }, stellingen, themas);
  gelijk(Math.round(gewicht.A), 100);
  gelijk(Math.round(gewicht.B), 0);
});

test('een lid dat niets invult laat de groep niet crashen', () => {
  const themas = [{ code: 'A' }];
  const stellingen = [{ nr: 1, thema: 'A', omgekeerd: false }];
  const gewicht = groepsgewicht([{ antwoorden: [null], topvijf: [] }], stellingen, themas);
  gelijk(Number.isFinite(gewicht.A), true);
});

test('locatiescore laat onbekende themas buiten de noemer', () => {
  const themas = [{ code: 'A' }, { code: 'B' }];
  const gewicht = { A: 50, B: 50 };
  // alleen A is bekend en die staat op 4: de score is 100, niet 50
  const uit = locatiescore({ A: 4, B: null }, gewicht, themas);
  bijna(uit.score, 100);
  gelijk(uit.geteld, 1);
});

test('de band loopt van alles tegen tot alles mee', () => {
  const themas = [{ code: 'A' }, { code: 'B' }];
  const gewicht = { A: 50, B: 50 };
  const scores = { A: 4, B: null };
  bijna(locatiescore(scores, gewicht, themas, 0).score, 50);
  bijna(locatiescore(scores, gewicht, themas, 4).score, 100);
});

test('husselen is herhaalbaar met dezelfde startwaarde', () => {
  const een = hussel([1, 2, 3, 4, 5, 6, 7, 8], toevalsreeks(42));
  const twee = hussel([1, 2, 3, 4, 5, 6, 7, 8], toevalsreeks(42));
  gelijk(een, twee);
  gelijk([...een].sort(), [1, 2, 3, 4, 5, 6, 7, 8]);
});

/* ============================================================ 3. de bouw */

const uitkomst = bouw({ doel: 'dist/.test-uitvoer.html' });

test('de bouw levert een volledige pagina op', () => {
  gelijk(uitkomst.html.startsWith('<!DOCTYPE html>'), true);
  gelijk(uitkomst.html.includes('</html>'), true);
  gelijk(uitkomst.html.length > 40000, true, 'de pagina lijkt verdacht kort');
});

test('alle vijf de panelen staan erin', () => {
  for (const label of [
    'eensgezindheid per stelling', 'gewicht per thema tegenover dekking',
    'aantal plekken dat overblijft per scenario', 'hoe vaak een stelling in een top vijf staat',
    'score en onzekerheidsband per plek',
  ]) {
    gelijk(uitkomst.html.includes(label), true, `paneel ontbreekt: ${label}`);
  }
});

test('de gewichten komen overeen met wat in de rapporten staat', () => {
  bijna(uitkomst.gewicht.A, 16.7, 0.05, 'thema A water en klimaat');
  bijna(uitkomst.gewicht.G, 15.8, 0.05, 'thema G energie');
  bijna(uitkomst.gewicht.F, 6.4, 0.05, 'thema F planologie');
  bijna(uitkomst.gewicht.E, 5.3, 0.05, 'thema E bereikbaarheid');
});

test('bijna de helft van het gewicht landt op themas zonder dekking', () => {
  bijna(uitkomst.cijfers.zonderDekking, 26.2, 0.1);
  bijna(uitkomst.cijfers.zonderDekking + uitkomst.cijfers.dunneDekking, 47.0, 0.1);
});

test('de themas D en G zijn nergens gescoord', () => {
  gelijk(uitkomst.dekking.D, 0);
  gelijk(uitkomst.dekking.G, 0);
});

test('de indeling van de stellingen klopt met de rapporten', () => {
  const tel = (status) => uitkomst.stellingen.filter((s) => s.status === status).length;
  gelijk(tel('samen-voor'), 11);
  gelijk(tel('samen-tegen'), 2);
  gelijk(tel('sloot'), 7);
  gelijk(tel('verdeeld'), 10);
});

test('stelling 12 is de meest verdeelde en stelling 28 de meest eensgezinde', () => {
  const opEensgezindheid = [...uitkomst.stellingen].sort(
    (a, b) => a.eensgezindheid - b.eensgezindheid);
  gelijk(opEensgezindheid[0].nr, 12);
  gelijk(opEensgezindheid.at(-1).nr, 28);
});

test('stelling 22 weegt het zwaarst en kan toch geen plek laten afvallen', () => {
  const s22 = uitkomst.stellingen.find((s) => s.nr === 22);
  gelijk(s22.topvijf, 5);
  gelijk(s22.zeeft, false, 'thema G is nergens gescoord, dus stelling 22 zeeft niets');
});

test('de trechter loopt van twaalf naar drie', () => {
  gelijk(uitkomst.scenarios.map((s) => s.over), [12, 7, 8, 3]);
});

test('alle onzekerheidsbanden overlappen elkaar', () => {
  const gescoord = uitkomst.locaties.filter((l) => l.score !== null);
  const hoogsteOndergrens = Math.max(...gescoord.map((l) => l.ondergrens));
  const laagsteBovengrens = Math.min(...gescoord.map((l) => l.bovengrens));
  gelijk(hoogsteOndergrens < laagsteBovengrens, true,
    'als dit zakt kan het model wel degelijk een plek uitsluiten, en dat is nieuws');
});

test('de andere weegmethode geeft een andere uitkomst maar geen fout', () => {
  const ander = bouw({ methode: 'gemiddelde', doel: 'dist/.test-gemiddelde.html' });
  bijna(ander.gewicht.A, 13.6, 0.05);
  gelijk(ander.gewicht.A !== uitkomst.gewicht.A, true);
});

test('stellingteksten met aanhalingstekens breken de svg niet', () => {
  gelijk(uitkomst.html.includes('<text'), true);
  gelijk(/<text[^>]*>[^<]*"[^<]*<\/text>/.test(uitkomst.html), false,
    'er staat een onveilig aanhalingsteken in een svg-tekst');
});

/* ======================================================= 4. de kleurleer */

test('contrast van wit op zwart is 21:1', () => {
  bijna(contrast('#ffffff', '#000000'), 21, 0.01);
});

test('afstand tussen dezelfde kleur is nul', () => {
  bijna(afstand('#b0463c', '#b0463c'), 0);
});

rapport('Evolorahof locatiekaart, tests');
