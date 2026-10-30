
/* ======================================================
   DOM ELEMENTER
====================================================== */
const $=id=>document.getElementById(id);
const pageTitle=$("pageTitle"),
mainContent=$("mainContent"),
acuteTop=$("acuteTop"),
fullTop=$("fullTop"),
acuteBottom=$("acuteBottom"),
fullBottom=$("fullBottom"),
sharedBottom=$("sharedBottom"),
sharedEquipmentBlock=$("sharedEquipmentBlock"),
safetyBlock=$("safetyBlock"),
acuteDoctorBlock=$("acuteDoctorBlock"),
transportWrap=$("transportWrap"),
spedbarnExtraWrap=$("spedbarnExtraWrap"),
rapport=$("rapport"),
vektLabel=$("vektLabel"),
copyMsg=$("copyMsg");
const spontO2Wrap=$("spontO2Wrap"),highFlowWrap=$("highFlowWrap"),nivWrap=$("nivWrap"),intubWrap=$("intubWrap"),trachWrap=$("trachWrap"),trO2=$("tr_o2"),trVent=$("tr_vent"),trachO2Wrap=$("trachO2Wrap"),trachVentWrap=$("trachVentWrap");
const acuteSpontO2Wrap=$("acuteSpontO2Wrap"),acuteHighFlowWrap=$("acuteHighFlowWrap"),acuteNivWrap=$("acuteNivWrap"),acuteIntubWrap=$("acuteIntubWrap"),acuteTrachWrap=$("acuteTrachWrap"),acuteTrachO2Wrap=$("acuteTrachO2Wrap"),acuteTrachVentWrap=$("acuteTrachVentWrap");
const caveTextWrap=$("caveTextWrap"),caveText=$("caveText"),smitteSpesWrap=$("smitteSpesWrap"),smitteSpes=$("smitteSpes");
const sedDynamicBody=$("sedDynamicBody"),pressorDynamicBody=$("pressorDynamicBody"),andreInfBody=$("andreInfBody"),tilgangerDynamicBody=$("tilgangerDynamicBody"),drenAnnetContainer=$("utstyrDynamicBody");
const pvkChk=$("til_pvk"),pvkAntall=$("pvkAntall"),utstPumperChk=$("utst_pumper"),utstPumperAntall=$("utstPumpeAntall"),acutePumperChk=$("acutePumperChk"),acutePumperAntall=$("acutePumperAntall");
let valgtHastegrad="",forrigeHastegrad="",copyTimer=null;

/* Hver seksjon huskes separat, ikke som én stor hastegradgruppe. */
const beholdteFeltgrupper = new Set();
const beholdteSeksjoner = new Set();
const hasteFeltgrupper = ["acuteBottom", "acuteDoctorBlock", "fullBottom"];
const seksjoner = {};

function lagSeksjon(id, noder) {
  if (!noder.length) return;
  const parent = noder[0].parentElement;
  const wrap = document.createElement("div");
  wrap.id = "bevar-" + id;
  parent.insertBefore(wrap, noder[0]);
  noder.forEach(node => wrap.appendChild(node));
  seksjoner[id] = wrap;
}

function mellom(start, slutt) {
  const nodes = [];
  for (let node = start; node && node !== slutt; node = node.nextElementSibling) nodes.push(node);
  return nodes;
}

function lagFeltseksjoner() {
  const full = $("fullTop");
  const form = full.querySelector(".formGroup");
  const felter = Array.from(form.children);
  lagSeksjon("full-aktuelt", felter.slice(0, 2));
  lagSeksjon("full-tidligere", felter.slice(2, 4));
  const airway = full.querySelector(".airwaySection");
  const vitals = full.querySelector(".vpTitle");
  lagSeksjon("full-luftveier", mellom(airway, vitals));
  lagSeksjon("full-vitalparametre", [vitals, full.querySelector(".inlineVitals")]);

  const acute = $("acuteTop");
  const acuteAktuelt = acute.querySelector(".bigSection");
  const acuteAirway = acute.querySelector(".airwaySection");
  lagSeksjon("acute-aktuelt", [acuteAktuelt, $("acuteHovedproblem")]);
  lagSeksjon("acute-luftveier", mellom(acuteAirway, null));

  const groups = $("sharedEquipmentBlock").querySelectorAll(":scope > .accessGroup");
  lagSeksjon("full-tilganger", [groups[0]]);
  lagSeksjon("full-utstyr", [groups[1]]);

  const doctors = $("sharedBottom").querySelector(".accessGroup");
  const doctorChildren = Array.from(doctors.children);
  lagSeksjon("full-rekvirerende", doctorChildren.slice(0, 2));
  lagSeksjon("full-mottakende", doctorChildren.slice(2, 4));
}

function seksjonHarInnhold(el) {
  return !!el && Array.from(el.querySelectorAll("input, textarea, select")).some(felt => {
    if (felt.type === "checkbox" || felt.type === "radio") return felt.checked;
    return clean(felt.value) !== "";
  });
}

function huskUtfylteFeltgrupper() {
  Object.entries(seksjoner).forEach(([id, el]) => {
    // Registrer bare seksjoner som faktisk har vært synlige for brukeren.
    if (el.getClientRects().length && seksjonHarInnhold(el)) beholdteSeksjoner.add(id);
  });
  hasteFeltgrupper.forEach(id => {
    const el = $(id);
    if (el && el.getClientRects().length && seksjonHarInnhold(el)) beholdteFeltgrupper.add(id);
  });
}

function harBeholdteSeksjoner(prefix) {
  return Array.from(beholdteSeksjoner).some(id => id.startsWith(prefix));
}

function plasserTidligereRiktig() {
  const tidligere = seksjoner["full-tidligere"];
  const aktueltAkutt = $("acuteHovedproblem");
  const aktueltFull = seksjoner["full-aktuelt"];

  if (!tidligere || !aktueltAkutt || !aktueltFull) {
    return;
  }

  if (isAcute() && beholdteSeksjoner.has("full-tidligere")) {
    // Flytt Tidligere rett etter Aktuelt i Akutt-visningen.
    aktueltAkutt.insertAdjacentElement("afterend", tidligere);
  } else {
    // Flytt Tidligere tilbake til sin vanlige plass.
    aktueltFull.insertAdjacentElement("afterend", tidligere);
  }
}



function oppdaterSeksjonsvisning() {

  // Plasser Tidligere under riktig Aktuelt-felt.
  plasserTidligereRiktig();

  const acute = isAcute();

  // Oppdater hver seksjon separat.
  Object.entries(seksjoner).forEach(([id, el]) => {

    const tilhorerAkutt = id.startsWith("acute-");

    const standardSynlig = tilhorerAkutt
      ? acute
      : !acute;

    let skalVises =
      standardSynlig || beholdteSeksjoner.has(id);

    // Aktuelt skal aldri vises dobbelt.
    // Den aktive hastegraden bestemmer hvilket
    // Aktuelt-felt brukeren skal se.
    if (id === "acute-aktuelt") {
      skalVises = acute;
    }

    if (id === "full-aktuelt") {
      skalVises = !acute;
    }

    setHidden(el, !skalVises);

  });

  // Kontroller om Akutt-gruppen har synlige seksjoner.
  const akuttHarSynligeSeksjoner = [
    "acute-aktuelt",
    "acute-luftveier"
  ].some(id => {
    const el = seksjoner[id];
    return el && !el.classList.contains("hidden");
  });

  // Kontroller om Haster-gruppen har synlige seksjoner.
  const fullHarSynligeSeksjoner = [
    "full-aktuelt",
    "full-tidligere",
    "full-luftveier",
    "full-vitalparametre"
  ].some(id => {
    const el = seksjoner[id];

    return el &&
      el.parentElement?.closest("#fullTop") &&
      !el.classList.contains("hidden");
  });

  // Skjul hele den inaktive gruppen dersom
  // ingen av dens seksjoner trenger å vises.
  setHidden(
    acuteTop,
    !acute && !akuttHarSynligeSeksjoner
  );

  setHidden(
    fullTop,
    acute && !fullHarSynligeSeksjoner
  );

}

function visFeltgruppe(id, normaltSynlig) {
  let brukt = beholdteFeltgrupper.has(id);
  if (id === "acuteTop") brukt = harBeholdteSeksjoner("acute-");
  if (id === "fullTop" || id === "sharedEquipmentBlock" || id === "sharedBottom") {
if (id === "fullTop") {
  brukt = [
    "full-aktuelt",
    "full-luftveier",
    "full-vitalparametre"
  ].some(id => beholdteSeksjoner.has(id));
}    else if (id === "sharedEquipmentBlock") brukt = ["full-tilganger","full-utstyr"].some(x => beholdteSeksjoner.has(x));
    else brukt = ["full-rekvirerende","full-mottakende"].some(x => beholdteSeksjoner.has(x));
  }
  setHidden($(id), !normaltSynlig && !brukt);
}

/* Supplerer rapporten med registreringer fra en annen hastegrad.
   Identiske linjer legges ikke inn to ganger. */
function leggTilUnikeRapportlinjer(mal, tillegg) {
  const finnes = new Set(mal);
  tillegg.forEach(linje => {
    if (linje && !finnes.has(linje)) {
      mal.push(linje);
      finnes.add(linje);
    }
  });
}

/* ======================================================
   GENERELLE HJELPEFUNKSJONER
====================================================== */
const clean=v=>(v??"").toString().trim();
function setHidden(el,hide){if(el)el.classList.toggle("hidden",!!hide)}
function formatPhone(raw){const d=(raw||"").replace(/\D/g,"");return d.length===8?d.slice(0,3)+" "+d.slice(3,5):raw}
function getBinaryValue(group){if(group==="hast")return valgtHastegrad;const el=document.querySelector('.binOpt[data-group="'+group+'"]:checked');return el?el.dataset.value:""}
function setBinaryValue(group,value){document.querySelectorAll('.binOpt[data-group="'+group+'"]').forEach(el=>el.checked=el.dataset.value===value)}
function getSpedbarnValue(){const el=document.querySelector(".spedRadio:checked");return el?el.dataset.value:""}
function getCaveValue(){const el=document.querySelector(".caveRadio:checked");return el?el.dataset.value:""}
function isAcute(){return valgtHastegrad==="Akutt"}
function autoGrowTextarea(el){if(!el)return;el.style.height="auto";el.style.height=el.scrollHeight+"px"}
function updateTitle() {
  const kategori = getSpedbarnValue();

  const kanHaTransportform =
    ["Nyfødt", "Spedbarn", "Barn"].includes(kategori);

  pageTitle.textContent =
    kanHaTransportform &&
    getBinaryValue("transport") === "Kuvøse"
      ? "KUVØSETRANSPORT"
      : "Intensiv- og helikoptertransport";
}
function syncSpecChoices(){
  const state = {};

  document.querySelectorAll(".specChoice").forEach(cb => {
    const rowVisible = !!cb.offsetParent;
    if (rowVisible) state[cb.dataset.spec] = cb.checked;
  });

  document.querySelectorAll(".specChoice").forEach(cb => {
    if (Object.prototype.hasOwnProperty.call(state, cb.dataset.spec)){
      cb.checked = !!state[cb.dataset.spec];
    }
  });
}

function setSpecChoice(specName, checked){
  document.querySelectorAll('.specChoice[data-spec="' + specName + '"]').forEach(cb => {
    cb.checked = checked;
  });
  lagRapport();
}

function syncSpecMirrors(){
  syncSpecChoices();
}
/* ======================================================
   RAPPORTBYGGING
====================================================== */
function buildVitalsLine() {
  const p = [];

  const vals = {
    RF: clean($("rf").value),
    SpO2: clean($("spo2").value),
    Puls: clean($("puls").value),
    Tmp: clean($("temp").value),
    GCS: clean($("gcs").value)
  };

  if (vals.RF) {
    p.push("RF: " + vals.RF);
  }

  if (vals.SpO2) {
    p.push("SpO2: " + vals.SpO2 + "%");
  }

  if (vals.Puls) {
    p.push("Puls: " + vals.Puls);
  }

  const sys = clean($("btSys").value);
  const dia = clean($("btDia").value);
  const map = clean($("map").value);

  if (sys || dia) {
    p.push("BT: " + (sys || "?") + "/" + (dia || "?"));
  }

  if (map) {
    p.push("MAP: " + map);
  }

  if (vals.Tmp) {
    p.push("Tmp: " + vals.Tmp);
  }

  const gcsLine = formatGcsValue(vals.GCS);

  if (gcsLine) {
    p.push(gcsLine);
  }

  return p.join(", ");
}
function linesTilganger() {
  const out = [];

  if ($("til_ingen")?.checked) {
    return ["Ingen tilganger"];
  }

  const cvkLumen = clean($("cvkLumen")?.value);

  if ($("til_cvk")?.checked) {
    out.push(cvkLumen ? "CVK " + cvkLumen : "CVK");
  }

  const n = clean(pvkAntall.value);

  if (pvkChk.checked) {
    out.push(n ? "PVK " + n + " stk" : "PVK");
  }

  out.push(
    ...collectDynamicTexts(".tilgangText", ".tilgangDynChk")
  );

  return out;
}

function buildFullAirwayLine() {
  const main = getBinaryValue("airwayMain");

  if (!main) return "";

  if (main === "Spontan uten O2") {
    return "Luftveier: Spontan uten O2";
  }

  if (main === "Spontan med O2") {
    const l = clean($("spontO2Liter").value);

    

return l
  ? "Luftveier: Spontan med " + l + " l/min O2"
  : "Luftveier: Spontan med O2";
  }

if (main === "Spontant med high flow") {

  const f = clean($("highFlowFio2").value);
  const fl = clean($("highFlowFlow").value);

  let tekst = "Luftveier: Spontant med high flow";

  if (f) {
    tekst += ", FiO2 " + f + " %";  }

  if (fl) {
    tekst += ", Flow " + fl + " L/min";
  }

  return tekst;
}

if (main === "NIV (CPAP/BiPAP)") {
  const f = clean($("nivFio2").value);

  return f
    ? "Luftveier: NIV, FiO2 " + f + " %"
    : "Luftveier: NIV";
}

if (main === "Intubert") {

  const deler = [];

  const f = clean($("intubFio2").value);
  const pe = clean($("intubPeep").value);
  const t = clean($("intubTopp").value);

  if (f) deler.push("FiO2 " + f + " %");
  if (pe) deler.push("PEEP " + pe);
  if (t) deler.push("topptrykk " + t);

  return deler.length
    ? "Luftveier: Intubert, " + deler.join(", ")
    : "Luftveier: Intubert";
}

if (main === "Trakeostomi") {

  const sel = [];

  document.querySelectorAll(".trachOpt").forEach(cb => {
    if (cb.checked) {
      sel.push(cb.dataset.name);
    }
  });

  const l = clean($("trachO2Liter").value);
  const f = clean($("trachVentFio2").value);
  const pe = clean($("trachVentPeep").value);
  const t = clean($("trachVentTopp").value);

  let tekst = "Luftveier: Trakeostomi";

  if (sel.includes("Spontan pust via trakeostomi")) {
    tekst += "; spontan";
  }

  if (sel.includes("O2 via trakeostomi")) {
    tekst += l
      ? "; O2 " + l + " l/min"
      : "; O2";
  }

  if (
    sel.includes("Koblet til respirator") ||
    sel.includes("Trykkstøtte (NIV via trakeostomi)")
  ) {
    const vent = [];

    if (f) vent.push("FiO2 " + f + " %");
    if (pe) vent.push("PEEP " + pe);
    if (t) vent.push("topptrykk " + t);

    tekst += vent.length
      ? "; respiratorbehandlet med " +
        vent.join(", ").replace(/,([^,]*)$/, " og$1")
      : "; respiratorbehandlet";
  }

  return tekst;
}
return "";
}
function buildAcuteAirwayLines() {
  

  const airway = getBinaryValue("acuteAirway");

  if (!airway) {
    return [];
  }

  if (airway === "Spontan uten O2") {
    return ["Luftveier: Spontan uten O2"];
  }

  if (airway === "Spontan med O2") {

    const l =
      clean($("acuteSpontO2Liter").value) ||
      clean($("spontO2Liter").value);

return [
  l
    ? "Luftveier: Spontan med " + l + " l/min O2"
    : "Luftveier: Spontan med O2"
];
  }

if (airway === "Spontant med high flow") {

  const f =
    clean($("acuteHighFlowFio2").value) ||
    clean($("highFlowFio2").value);

  const fl =
    clean($("acuteHighFlowFlow").value) ||
    clean($("highFlowFlow").value);

  let tekst = "Luftveier: Spontant med high flow";

  if (f) {
    tekst += ", FiO2 " + f + " %";
  }

  if (fl) {
    tekst += ", Flow " + fl + " L/min";
  }

  return [tekst];
}

if (airway === "NIV (CPAP/BiPAP)") {
  const f =
    clean($("acuteNivFio2").value) ||
    clean($("nivFio2").value);

  return [
    f
      ? "Luftveier: NIV, FiO2 " + f + " %"
      : "Luftveier: NIV"
  ];
}

if (airway === "Intubert") {

  const deler = [];

  const f =
    clean($("acuteIntubFio2").value) ||
    clean($("intubFio2").value);

  const pe =
    clean($("acuteIntubPeep").value) ||
    clean($("intubPeep").value);

  const t =
    clean($("acuteIntubTopp").value) ||
    clean($("intubTopp").value);

  if (f) deler.push("FiO2 " + f + " %");
  if (pe) deler.push("PEEP " + pe);
  if (t) deler.push("topptrykk " + t);

  return [
    deler.length
      ? "Luftveier: Intubert, " + deler.join(", ")
      : "Luftveier: Intubert"
  ];
}

if (airway === "Trakeostomi") {

  const sel = [];

  const valgtTrach = document.querySelector(".acuteTrachOpt:checked");

  if (valgtTrach) {
    sel.push(valgtTrach.dataset.name);
  }

  const l = clean($("acuteTrachO2Liter").value);
  const f = clean($("acuteTrachVentFio2").value);
  const pe = clean($("acuteTrachVentPeep").value);
  const t = clean($("acuteTrachVentTopp").value);

  let tekst = "Luftveier: Trakeostomi";

  if (sel.includes("Spontan pust via trakeostomi")) {
    tekst += "; spontan";
  }

  if (sel.includes("O2 via trakeostomi")) {
    tekst += l
      ? "; O2 " + l + " l/min"
      : "; O2";
  }

  if (
    sel.includes("Koblet til respirator") ||
    sel.includes("Trykkstøtte (NIV via trakeostomi)")
  ) {
    const vent = [];

    if (f) vent.push("FiO2 " + f + " %");
    if (pe) vent.push("PEEP " + pe);
    if (t) vent.push("topptrykk " + t);

    tekst += vent.length
      ? "; respiratorbehandlet med " +
        vent.join(", ").replace(/,([^,]*)$/, " og$1")
      : "; respiratorbehandlet";
  }

  return [tekst];
}

return ["Luftveier: " + airway];
}

function buildSpedbarnLine() {
  const kategori = getSpedbarnValue();

  if (!kategori || kategori === "Nei") {
    return "";
  }

  const u = clean($("gestasjonsUker").value);
  const d = clean($("gestasjonsDager").value);
  const v = clean($("vekt").value);
  const brukerGram = kategori === "Nyfødt" || kategori === "Spedbarn";

  const p = [kategori];

  if (brukerGram && (u || d)) {
    p.push(
      "GA " +
      (u || "?") +
      "+" +
      (d || "0")
    );
  }

if (brukerGram && v !== "") {

  p.push(
    Number(v) === 0
      ? "Vekt: Ikke oppgitt"
      : "Vekt: " + v + " g"
  );

}
  return p.join(", ");
}

function buildUtstyrList() {
  const out = [];

  const n = clean(utstPumperAntall.value);

  if (utstPumperChk.checked) {
    out.push(
      n
        ? "Sprøytepumper: " + n + "stk"
        : "Sprøytepumper"
    );
  }

  if ($("utst_arterie").checked) {
    out.push("Arteriekran");
  }

  if ($("dren_thorax").checked) {
    out.push("Thoraxdren");
  }

  document.querySelectorAll(".drenAnnetText").forEach(txt => {
    const row = txt.closest(".dynamicRow");
    const cb = row ? row.querySelector(".drenAnnetChk") : null;
    const val = clean(txt.value);

    if (cb && cb.checked && val) {
      out.push(val);
    }
  });

  return out;
}

function buildSmitteLines() {
  const base = document.querySelector(".smitteBase:checked");
  const blod = $("sm_blod");
  const spes = clean(smitteSpes.value);

  if (!base || base.dataset.name === "Ingen kjente") {

    if (blod.checked) {
      let line = "Smitte: Blodsmitte";

      if (spes) {
        line += " (" + spes + ")";
      }

      return [line];
    }

    return ["Smitte: Nei"];
  }

  let line = "Smitte: " + base.dataset.name;

  if (blod.checked) {
    line += " og blodsmitte";
  }

  if (spes) {
    line += " (" + spes + ")";
  }

  return [line];
}

function buildCaveLines() {
  const val = getCaveValue();
  const txt = clean(caveText.value);

  if (!val) {
    return [];
  }

  if (val === "Nei") {
    return ["CAVE: Nei"];
  }

  return [
    "CAVE: Ja" +
    (txt ? " (" + txt + ")" : "")
  ];
}

function buildHlrRespLines() {

  const hlrVal =
    document.querySelector(".hlrRadio:checked")?.value || "";

  const respVal =
    document.querySelector(".respRadio:checked")?.value || "";

  const out = [];

  if (hlrVal === "Ja") {
    out.push("HLR pluss");
  }

  if (hlrVal === "Nei") {

    const lege =
      clean($("hlrMinusLege")?.value);

    const dato =
      clean($("hlrMinusDato")?.value);

    const dok =
      lege || dato
        ? "satt av " +
          (lege || "lege ikke oppgitt") +
          (dato ? " den " + dato : "")
        : "mangler dokumentasjon";

    out.push("HLR minus " + dok);
  }

  if (respVal === "Ja") {
    out.push("Respirator pluss");
  }

  if (respVal === "Nei") {

    const lege =
      clean($("respMinusLege")?.value);

    const dato =
      clean($("respMinusDato")?.value);

    const dok =
      lege || dato
        ? "satt av " +
          (lege || "lege ikke oppgitt") +
          (dato ? " den " + dato : "")
        : "mangler dokumentasjon";

    out.push("Respirator minus " + dok);
  }

  return out;
}

/* ======================================================
   UI OPPDATERING
====================================================== */
function updateSpedbarnUI() {

  const val = getSpedbarnValue();

  const brukerGram =
    val === "Nyfødt" ||
    val === "Spedbarn";

  const viserGA = brukerGram;

  const viserTransportform =
    val === "Nyfødt" ||
    val === "Spedbarn" ||
    val === "Barn";

  const vektInput = $("vekt");
  const weightWrap = $("weightWrap");

  // Vektfeltet skal alltid være synlig
  setHidden(weightWrap, false);

  // GA skal kun vises ved nyfødt og spedbarn
  setHidden(spedbarnExtraWrap, !viserGA);

  // Transportform vises kun for barn
  setHidden(transportWrap, !viserTransportform);


  /* ==========================================
     T013 – KORREKT VEKTENHET
  ========================================== */

  const gammelEnhet = vektInput.dataset.unit;
  const nyEnhet = brukerGram ? "g" : "kg";

  if (
    gammelEnhet &&
    gammelEnhet !== nyEnhet &&
    clean(vektInput.value)
  ) {

    const gammelVekt = Number(vektInput.value);

    const nyVekt = gammelEnhet === "g"
      ? gammelVekt / 1000
      : gammelVekt * 1000;

    vektInput.value =
      Number.isFinite(nyVekt) && nyVekt >= 0
        ? String(Number(nyVekt.toFixed(6)))
        : "";
  }

  vektLabel.textContent = brukerGram
    ? "Vekt (gram)"
    : "Vekt (kg)";

  vektInput.placeholder = brukerGram
    ? "gram"
    : "kg";

  vektInput.step = brukerGram
    ? "1"
    : "0.1";

  vektInput.inputMode = brukerGram
    ? "numeric"
    : "decimal";

  vektInput.dataset.unit = nyEnhet;


  /* ==========================================
     T035 – FJERN UAKTUELL TRANSPORTFORM
  ========================================== */

  if (!viserTransportform) {

    document
      .querySelectorAll('.binOpt[data-group="transport"]')
      .forEach(el => {

        el.checked = false;
        el.dataset.wasChecked = "false";

      });
  }


  /* ==========================================
     GESTASJONSALDER
  ========================================== */

  if (!viserGA) {
    $("gestasjonsUker").value = "";
    $("gestasjonsDager").value = "";
  }

  updateTitle();
}

function updateCaveUI() {

  const valgt =
    document.querySelector(".caveRadio:checked");

  const skalVises =
    valgt &&
    valgt.dataset.value === "Ja";

  setHidden(caveTextWrap, !skalVises);

  if (!skalVises) {
    caveText.value = "";
  }
}

function calcMapFromSysDia(sysRaw,diaRaw){const sys=Number(clean(sysRaw)),dia=Number(clean(diaRaw));return(!sys||!dia)?"":String(Math.round((sys+2*dia)/3))}
function updateMapField() {

  const mapEl = $("map");

  // Manuell MAP skal ikke overskrives
  if (
    mapEl.dataset.auto === "manual" &&
    clean(mapEl.value)
  ) {
    return;
  }

  const auto = calcMapFromSysDia(
    $("btSys").value,
    $("btDia").value
  );

  if (auto) {

    mapEl.value = auto;
    mapEl.dataset.auto = "1";

  } else if (mapEl.dataset.auto === "1") {

    mapEl.value = "";
    mapEl.dataset.auto = "";

  }
}
function normalizeNumericField(el,maxDigits,maxValue){let raw=(el.value||"").replace(/\D/g,"");if(maxValue!=null&&raw){const numeric=Number(raw);if(numeric>maxValue)raw=String(maxValue)}if(raw.length>maxDigits)raw=raw.slice(0,maxDigits);if(el.value!==raw)el.value=raw;return raw}
function normalizeDecimalField(el,maxIntegerDigits,maxDecimals,decimalSep=','){let v=el.value||'';const sep=decimalSep||','; // allow digits and one separator
  // replace dot with chosen separator to be forgiving
  v=v.replace('.',sep);
  // remove everything except digits and separator
  v=v.split('').filter((c,i,arr)=>/\d/.test(c) || (c===sep && arr.indexOf(sep)===i)).join('');
  const parts=v.split(sep);
  let intPart=parts[0]||'';
  let decPart=parts[1]||'';
  if(intPart.length>maxIntegerDigits)intPart=intPart.slice(0,maxIntegerDigits);
  if(decPart.length>maxDecimals)decPart=decPart.slice(0,maxDecimals);
  // keep the separator in the output if the user has entered it (parts.length>1),
  // even when the decimal part is still empty — this lets the user type '36,' then '5'
  const out=(parts.length>1)?intPart+sep+decPart:intPart;
  if(el.value!==out)el.value=out;
  return {raw:out,int:intPart,dec:decPart};
}
function focusNextField(currentId){const next={rf:"spo2",spo2:"puls",puls:"btSys",btSys:"btDia",btDia:"map",map:"temp",temp:"gcs"}[currentId];const nextEl=next?$(next):null;if(nextEl){nextEl.focus();if(typeof nextEl.select==="function")nextEl.select()}}
function handleVitalInput(evt){

  const id = evt.target.id;

  if(id==="rf"){

    normalizeNumericField(evt.target,3);

  }else if(id==="spo2"){

    normalizeNumericField(evt.target,3,100);

  }else if(id==="puls"){

    normalizeNumericField(evt.target,3);

  }else if(id==="btSys"){

    normalizeNumericField(evt.target,3);

  }else if(id==="btDia"){

    normalizeNumericField(evt.target,3);

  }else if(id==="map"){

    normalizeNumericField(evt.target,3);

  }else if(id==="temp"){

    normalizeDecimalField(evt.target,2,1,',');

  }
}

function handleVitalSpace(evt){if(evt.key!==" ")return;const id=evt.target.id;let digits=(evt.target.value||"").replace(/\D/g,"");if(id==="temp"){const r=(evt.target.value||"").replace('.',',').split(',');digits=r[0]||''}const mins={rf:1,spo2:1,puls:1,btSys:1,btDia:1,map:1,temp:1}[id];if(mins==null||digits.length<mins)return;evt.preventDefault();focusNextField(id)}
function updateSmitteSpes() {

  const valgt =
    document.querySelector(".smitteBase:checked");

  const skalVises =
    valgt &&
    valgt.id !== "sm_ingen";

  setHidden(smitteSpesWrap, !skalVises);

  if (!skalVises) {
    smitteSpes.value = "";
  }
}

function refreshTrachDeps(){setHidden(trachO2Wrap,!trO2?.checked);setHidden(trachVentWrap,!trVent?.checked);if(!trO2?.checked)$("trachO2Liter").value="";if(!trVent?.checked)["trachVentFio2","trachVentPeep","trachVentTopp"].forEach(id=>$(id).value="")}
function handleAirwayChange(){const v=getBinaryValue("airwayMain");[spontO2Wrap,highFlowWrap,nivWrap,intubWrap,trachWrap].forEach(el=>setHidden(el,true));if(v==="Spontan med O2")setHidden(spontO2Wrap,false);else if(v==="Spontant med high flow")setHidden(highFlowWrap,false);else if(v==="NIV (CPAP/BiPAP)")setHidden(nivWrap,false);else if(v==="Intubert")setHidden(intubWrap,false);else if(v==="Trakeostomi")setHidden(trachWrap,false);refreshTrachDeps()}
function updateAcuteAirwayDetails() {
  const a = getBinaryValue("acuteAirway");

  [
    acuteSpontO2Wrap,
    acuteHighFlowWrap,
    acuteNivWrap,
    acuteIntubWrap,
    acuteTrachWrap,
    acuteTrachO2Wrap,
    acuteTrachVentWrap
  ].forEach(el => setHidden(el, true));

if (a === "Spontan med O2") {
  setHidden(acuteSpontO2Wrap, false);
}

  if (a === "Spontant med high flow") {
    setHidden(acuteHighFlowWrap, false);
  }

  if (a === "NIV (CPAP/BiPAP)") {
    setHidden(acuteNivWrap, false);
  }

  if (a === "Intubert") {
    setHidden(acuteIntubWrap, false);
  }

  if (a === "Trakeostomi") {
    setHidden(acuteTrachWrap, false);

    const trachO2 = $("acute_tr_o2")?.checked;
    const trachVent = $("acute_tr_vent")?.checked;

    setHidden(acuteTrachO2Wrap, !trachO2);
    setHidden(acuteTrachVentWrap, !trachVent);
  }
}

function copyVal(from, to) {
  const kilde = $(from), mottaker = $(to);
  if (!kilde || !mottaker) {
    console.warn("Manglende felt-ID ved synkronisering:", from, to);
    return;
  }
  if (clean(kilde.value) && !clean(mottaker.value)) mottaker.value = kilde.value;
}
/* ======================================================
   T039 – FELLES AKTUELT-TEKST

   Aktuelt er én opplysning som kan redigeres
   fra begge hastegradvisningene.

   Siste registrerte tekst skal alltid gjelde.
====================================================== */

function bindAktueltSynkronisering() {

  [
    ["hovedproblem", "acuteHovedproblem"],
    ["acuteHovedproblem", "hovedproblem"]

  ].forEach(([fraId, tilId]) => {

    $(fraId).addEventListener("input", () => {

      const fra = $(fraId);
      const til = $(tilId);

      til.value = fra.value;

      autoGrowTextarea(til);

    });

  });

}
function syncAcuteToFull(){copyVal("acuteHovedproblem","hovedproblem");const a=getBinaryValue("acuteAirway");if(a&&!getBinaryValue("airwayMain"))setBinaryValue("airwayMain",a);[["acuteSpontO2Liter","spontO2Liter"],["acuteHighFlowFio2","highFlowFio2"],["acuteHighFlowFlow","highFlowFlow"],["acuteNivFio2","nivFio2"],["acuteIntubFio2","intubFio2"],["acuteIntubPeep","intubPeep"],["acuteIntubTopp","intubTopp"],["acuteTrachO2Liter","trachO2Liter"],["acuteTrachVentFio2","trachVentFio2"],["acuteTrachVentPeep","trachVentPeep"],["acuteTrachVentTopp","trachVentTopp"],["acuteRekNavn","rekNavn"],["acuteRekTlf","rekTlf"]].forEach(x=>copyVal(...x));if($("acute_tr_spont").checked)$("tr_spont").checked=true;if($("acute_tr_o2").checked)$("tr_o2").checked=true;if($("acute_tr_vent").checked)$("tr_vent").checked=true;if(clean(acutePumperAntall.value)&&!clean(utstPumperAntall.value)){utstPumperAntall.value=acutePumperAntall.value;utstPumperChk.checked=true}}
function syncFullToAcute(){copyVal("hovedproblem","acuteHovedproblem");const a=getBinaryValue("airwayMain");if(a&&!getBinaryValue("acuteAirway"))setBinaryValue("acuteAirway",a);[["spontO2Liter","acuteSpontO2Liter"],["highFlowFio2","acuteHighFlowFio2"],["highFlowFlow","acuteHighFlowFlow"],["nivFio2","acuteNivFio2"],["intubFio2","acuteIntubFio2"],["intubPeep","acuteIntubPeep"],["intubTopp","acuteIntubTopp"],["trachO2Liter","acuteTrachO2Liter"],["trachVentFio2","acuteTrachVentFio2"],["trachVentPeep","acuteTrachVentPeep"],["trachVentTopp","acuteTrachVentTopp"],["rekNavn","acuteRekNavn"],["rekTlf","acuteRekTlf"]].forEach(x=>copyVal(...x));if($("tr_spont").checked)$("acute_tr_spont").checked=true;if($("tr_o2").checked)$("acute_tr_o2").checked=true;if($("tr_vent").checked)$("acute_tr_vent").checked=true;if(clean(utstPumperAntall.value)&&!clean(acutePumperAntall.value)){acutePumperAntall.value=utstPumperAntall.value;acutePumperChk.checked=true}updateAcuteAirwayDetails()}
/* ======================================================
   T034 – FELLES LUFTVEISSTATUS

   Sist registrerte luftveisstatus skal alltid være
   gjeldende, uavhengig av hastegrad.

   Den andre luftveisstatusen erstattes automatisk.
====================================================== */

const LUFTVEI_DETALJFELTER = [
  ["spontO2Liter", "acuteSpontO2Liter"],
  ["highFlowFio2", "acuteHighFlowFio2"],
  ["highFlowFlow", "acuteHighFlowFlow"],
  ["nivFio2", "acuteNivFio2"],
  ["intubFio2", "acuteIntubFio2"],
  ["intubPeep", "acuteIntubPeep"],
  ["intubTopp", "acuteIntubTopp"],
  ["trachO2Liter", "acuteTrachO2Liter"],
  ["trachVentFio2", "acuteTrachVentFio2"],
  ["trachVentPeep", "acuteTrachVentPeep"],
  ["trachVentTopp", "acuteTrachVentTopp"]
];

const LUFTVEI_TRACHVALG = [
  ["tr_spont", "acute_tr_spont"],
  ["tr_o2", "acute_tr_o2"],
  ["tr_vent", "acute_tr_vent"]
];


/* ======================================================
   SYNKRONISERING AV LUFTVEIER
====================================================== */

function synkroniserLuftveiFra(kilde) {

  const fraAkutt = kilde === "acute";

  const fraGruppe = fraAkutt
    ? "acuteAirway"
    : "airwayMain";

  const tilGruppe = fraAkutt
    ? "airwayMain"
    : "acuteAirway";


  // Erstatt tidligere luftveisvalg med gjeldende valg.

  setBinaryValue(
    tilGruppe,
    getBinaryValue(fraGruppe)
  );


  // Synkroniser tilhørende luftveisverdier.

  LUFTVEI_DETALJFELTER.forEach(([fullId, akuttId]) => {

    const fra = $(
      fraAkutt ? akuttId : fullId
    );

    const til = $(
      fraAkutt ? fullId : akuttId
    );

    if (fra && til) {
      til.value = fra.value;
    }

  });


  // Synkroniser trakeostomivalg.

  LUFTVEI_TRACHVALG.forEach(([fullId, akuttId]) => {

    const fra = $(
      fraAkutt ? akuttId : fullId
    );

    const til = $(
      fraAkutt ? fullId : akuttId
    );

    if (fra && til) {
      til.checked = fra.checked;
    }

  });


  // Oppdater begge luftveisvisningene.

  handleAirwayChange();
  updateAcuteAirwayDetails();

}


/* ======================================================
   OPPDATER LUFTVEIER VED ENDRING AV DETALJFELTER
====================================================== */

function bindLuftveiDetaljer() {

  const idTilKilde = new Map();

  LUFTVEI_DETALJFELTER.forEach(([fullId, akuttId]) => {

    idTilKilde.set(fullId, "full");
    idTilKilde.set(akuttId, "acute");

  });


  document.addEventListener("input", event => {

    const kilde = idTilKilde.get(event.target.id);

    if (kilde) {
      synkroniserLuftveiFra(kilde);
    }

  });

}


/* ======================================================
   SYNKRONISERING VED BYTTE AV HASTEGRAD
====================================================== */

function syncVisibleSharedFieldsBeforeSwitch() {

  if (
    forrigeHastegrad === "Akutt" &&
    valgtHastegrad !== "Akutt"
  ) {

    syncAcuteToFull();
    synkroniserLuftveiFra("acute");

  } else if (
    forrigeHastegrad !== "Akutt" &&
    valgtHastegrad === "Akutt"
  ) {

    syncFullToAcute();
    synkroniserLuftveiFra("full");

  }

}
function updateMainVisibility() {
  const h = getBinaryValue("hast");
  const harHastegrad = !!h;
  const acute = isAcute();

  setHidden(mainContent, !harHastegrad);

if (!harHastegrad) {
  setHidden(acuteTop, true);
  setHidden(acuteBottom, true);
  setHidden(fullTop, true);
  setHidden(fullBottom, true);
  setHidden(sharedEquipmentBlock, true);
  setHidden(safetyBlock, true);
  setHidden(acuteDoctorBlock, true);
  setHidden(sharedBottom, true);

  
    setHidden($("reportActions"), true);
    setHidden($("rapport"), true);
    setHidden($("feedbackWrap"), true);

    rapport.value = "";
    return;
  }

  // Akutt-del
  visFeltgruppe("acuteTop", acute);
  visFeltgruppe("acuteBottom", acute);

  // Ikke-akutt-del
  visFeltgruppe("fullTop", !acute);
  visFeltgruppe("fullBottom", !acute);

  // Smitte, CAVE og HLR/respirator vises både ved Akutt og Haster
  setHidden(safetyBlock, false);

  // Rekvirerende lege for Akutt vises nederst i Akutt-flyten
  visFeltgruppe("acuteDoctorBlock", acute);

// Tilganger og utstyr skjules ved Akutt
visFeltgruppe("sharedEquipmentBlock", !acute);

// Full legeinfo skjules ved Akutt
visFeltgruppe("sharedBottom", !acute);

  // Rapport og knapper skal alltid vises når hastegrad er valgt
  setHidden($("reportActions"), false);
  setHidden($("rapport"), false);
  setHidden($("feedbackWrap"), false);

  if (acute) {
    updateAcuteAirwayDetails();
  } else {
    handleAirwayChange();
  }

  oppdaterSeksjonsvisning();
  updateTitle();
}

/* ======================================================
   EVENT BINDING
====================================================== */
function bindHastegradEvents() {
  function velgHastegrad(btn) {
    const neste = btn.dataset.haste;
    if (!neste || neste === valgtHastegrad) return;

    // Bevar innhold før feltene skifter visningsmodus.
    huskUtfylteFeltgrupper();
    forrigeHastegrad = valgtHastegrad;
    valgtHastegrad = neste;
    syncVisibleSharedFieldsBeforeSwitch();

    document.querySelectorAll(".hasteCard").forEach(b => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-pressed", String(b === btn));
    });
    updateMainVisibility();
    lagRapport();
  }

  document.querySelectorAll(".hasteCard").forEach(btn => {
    btn.addEventListener("click", () => velgHastegrad(btn));
  });
}
/* ======================================================
   GCS – HURTIGREGISTRERING
====================================================== */

function bindGcsHurtigregistrering() {

  const felt = $("gcs");

  if (!felt) return;

  felt.addEventListener("input", () => {

    const tekst = felt.value
      .trim()
      .replace(/\s+/g, "");

    // Tre siffer blir automatisk E+V+M

    if (/^\d{3}$/.test(tekst)) {

      const oye = tekst[0];
      const verbal = tekst[1];
      const motorisk = tekst[2];

      felt.value =
        oye + "+" +
        verbal + "+" +
        motorisk;

    }

  });

}

function bindVitalEvents() {

  ["btSys", "btDia"].forEach(id => {

    const el = $(id);

    if (el) {

      el.addEventListener("input", () => {

        handleVitalInput({ target: el });
        updateMapField();

      });

      el.addEventListener(
        "keydown",
        handleVitalSpace
      );
    }
  });


  /* ==========================================
     MANUELL MAP
  ========================================== */

  $("map").addEventListener("input", event => {

    handleVitalInput(event);

    $("map").dataset.auto =
      clean($("map").value)
        ? "manual"
        : "";

  });

  $("map").addEventListener(
    "keydown",
    handleVitalSpace
  );


  /* ==========================================
     ØVRIGE VITALPARAMETRE
  ========================================== */

  ["rf", "spo2", "puls", "temp"].forEach(id => {

    const el = $(id);

    if (el) {

      el.addEventListener(
        "input",
        handleVitalInput
      );

      el.addEventListener(
        "keydown",
        handleVitalSpace
      );

    }
  });
}

function bindAutoGrowEvents() {

  document
    .querySelectorAll(".autoGrow")
    .forEach(el =>
      el.addEventListener("input", () =>
        autoGrowTextarea(el)
      )
    );
}

function bindPvkEvents() {

  pvkAntall.addEventListener("input", () => {
    pvkChk.checked = !!pvkAntall.value;
    updateTilgangerUI();
    lagRapport();
  });

  pvkChk.addEventListener("change", () => {

    if (!pvkChk.checked) {
      pvkAntall.value = "";
    }

    updateTilgangerUI();

    lagRapport();
  });
}

function bindCvkEvents() {

  $("cvkLumen")?.addEventListener("input", () => {

    $("til_cvk").checked = !!$("cvkLumen").value;
    updateTilgangerUI();
    lagRapport();
  });

  $("til_cvk")?.addEventListener("change", () => {

    if (!$("til_cvk").checked) {
      $("cvkLumen").value = "";
    }
    updateTilgangerUI();
    lagRapport();
  });
}

function updateUtstyrPumpeUI() {
  setHidden(utstPumperAntall, !utstPumperChk?.checked);
}

function bindUtstyrPumpeEvents() {

  utstPumperAntall.addEventListener("input", () => {
    utstPumperChk.checked = !!utstPumperAntall.value;
    updateUtstyrPumpeUI();
    lagRapport();
  });

  utstPumperChk.addEventListener("change", () => {

    if (!utstPumperChk.checked) {
      utstPumperAntall.value = "";
    }

    updateUtstyrPumpeUI();
    lagRapport();
  });
}

function updateAcutePumpeUI() {
  setHidden(acutePumperAntall, !acutePumperChk?.checked);
}

function bindAcutePumpeEvents() {

  updateAcutePumpeUI();

  acutePumperAntall.addEventListener("input", () => {
    acutePumperChk.checked = !!acutePumperAntall.value;
    updateAcutePumpeUI();
    lagRapport();
  });

  acutePumperAntall.addEventListener("change", () => {
    acutePumperChk.checked = !!acutePumperAntall.value;
    updateAcutePumpeUI();
    lagRapport();
  });

  acutePumperChk.addEventListener("change", () => {

    if (!acutePumperChk.checked) {
      acutePumperAntall.value = "";
    }

    updateAcutePumpeUI();
    lagRapport();
  });
}

function bindToggleEvents() {

  document.addEventListener("change", e => {
    if (!e.target.classList.contains("specChoice")) return;
    e.stopPropagation();

    const specName = e.target.dataset.spec;
    const checked = e.target.checked;

    document
      .querySelectorAll('.specChoice[data-spec="' + specName + '"]')
      .forEach(cb => {
        cb.checked = checked;
      });

    lagRapport();
  }, true);

  document.addEventListener("click", e => {
    const cell = e.target.closest(".toggleCell");
    if (!cell) return;

    const tag = (e.target.tagName || "").toLowerCase();

    if (
      tag === "select" ||
      tag === "textarea" ||
      e.target.closest(".clickableChoice")
    ) {
      return;
    }

    if (cell.classList.contains("specCell")) {
      if (tag === "input") return;

      const cb = cell.querySelector(".specChoice");
      if (!cb) return;

      setSpecChoice(cb.dataset.spec, !cb.checked);
      return;
    }

    if (tag === "input") return;

    const id = cell.dataset.toggle;
    if (!id) return;

    const master = $(id);
    if (!master) return;

    if (
      master.classList.contains("binOpt") ||
      master.classList.contains("trachOpt") ||
      master.classList.contains("acuteTrachOpt")
    ) {
      return;
    }

    if (master.type === "radio") {
      master.checked = true;
    } else {
      master.checked = !master.checked;
    }

    lagRapport();
  });
}

function bindSpedbarnEvents() {
  document.querySelectorAll(".spedRadio").forEach(radio => {
    const chip = radio.closest(".spedChip");

    if (!chip) return;

    chip.addEventListener("pointerdown", () => {
      radio.dataset.wasChecked =
        radio.checked ? "true" : "false";
    });

    chip.addEventListener("click", event => {
      event.preventDefault();

      const wasChecked =
        radio.dataset.wasChecked === "true";

      // Slå av alle alternativer først
      document.querySelectorAll(".spedRadio").forEach(otherRadio => {
        otherRadio.checked = false;
        otherRadio.dataset.wasChecked = "false";
      });

      // Hvis alternativet ikke allerede var valgt,
      // velges det. Var det valgt, forblir alt avslått.
      if (!wasChecked) {
        radio.checked = true;
      }

      updateSpedbarnUI();
      lagRapport();
    });
  });
}

function bindCaveEvents() {

  document.querySelectorAll(".caveRadio").forEach(radio => {

    const chip = radio.closest(".medChip");
    if (!chip) return;

    chip.addEventListener("pointerdown", () => {
      radio.dataset.wasChecked = radio.checked ? "true" : "false";
    });

    chip.addEventListener("click", e => {
      e.preventDefault();

      const wasChecked = radio.dataset.wasChecked === "true";

      if (wasChecked) {
        radio.checked = false;
      } else {
        document.querySelectorAll(".caveRadio").forEach(r => {
          r.checked = false;
        });

        radio.checked = true;
      }

      updateCaveUI();
      lagRapport();
    });

  });

}

function bindBinaryOptionEvents() {

  document.querySelectorAll(".binOpt").forEach(chk => {
    const label = chk.closest("label");

    if (!label) return;

    label.addEventListener("pointerdown", () => {
      chk.dataset.wasChecked = chk.checked ? "true" : "false";
    });

    label.addEventListener("click", e => {
      e.preventDefault();

      const g = chk.dataset.group;
      const wasChecked = chk.dataset.wasChecked === "true";

      const canToggleOff =
        g === "airwayMain" ||
        g === "acuteAirway";

      document
        .querySelectorAll('.binOpt[data-group="' + g + '"]')
        .forEach(o => {
          o.checked = false;
          o.dataset.wasChecked = "false";
        });

      if (!wasChecked || !canToggleOff) {
        chk.checked = true;
      }

      if (g === "transport") {
        updateTitle();
      }

if (g === "airwayMain") {
  synkroniserLuftveiFra("full");
}

if (g === "acuteAirway") {
  synkroniserLuftveiFra("acute");
}

      lagRapport();
    });
  });
}

function bindTrachEvents() {

  document.querySelectorAll(".trachOpt").forEach(chk => {

    const cell = chk.closest("label");

    if (!cell) return;

    cell.addEventListener("pointerdown", () => {

      chk.dataset.wasChecked =
        chk.checked ? "true" : "false";

    });


    cell.addEventListener("click", e => {

      e.preventDefault();

      const wasChecked =
        chk.dataset.wasChecked === "true";

      document.querySelectorAll(".trachOpt").forEach(o => {

        o.checked = false;
        o.dataset.wasChecked = "false";

      });

      if (!wasChecked) {
        chk.checked = true;
      }

      refreshTrachDeps();
      synkroniserLuftveiFra("full");
      lagRapport();

    });

  });

}

function bindAcuteTrachEvents() {

  document.querySelectorAll(".acuteTrachOpt").forEach(chk => {
    const cell = chk.closest(".toggleCell");

    if (!cell) return;

    cell.addEventListener("pointerdown", () => {
      chk.dataset.wasChecked = chk.checked ? "true" : "false";
    });

    cell.addEventListener("click", e => {
      e.preventDefault();

      const wasChecked = chk.dataset.wasChecked === "true";

      document.querySelectorAll(".acuteTrachOpt").forEach(o => {
        o.checked = false;
        o.dataset.wasChecked = "false";
      });

      if (!wasChecked) {
        chk.checked = true;
      }

updateAcuteAirwayDetails();
synkroniserLuftveiFra("acute");
lagRapport();
    });
  });
}

function bindSmitteEvents() {

  document
    .querySelectorAll(".smitteBase")
    .forEach(r =>
      r.addEventListener("change", () => {

        updateSmitteSpes();
        lagRapport();
      })
    );

  $("sm_blod").addEventListener("change", () => {

    updateSmitteSpes();
    lagRapport();
  });
}

function bindAcuteAirwayInputEvents() {

  [
    "acuteSpontO2Liter",
    "acuteHighFlowFio2",
    "acuteHighFlowFlow",
    "acuteNivFio2",
    "acuteIntubFio2",
    "acuteIntubPeep",
    "acuteIntubTopp",
    "acuteTrachO2Liter",
    "acuteTrachVentFio2",
    "acuteTrachVentPeep",
    "acuteTrachVentTopp"
  ].forEach(id =>

    $(id)?.addEventListener("input", () => {

      updateAcuteAirwayDetails();
      lagRapport();
    })
  );
}

function updateHlrRespUI() {

  const hlrVal =
    document.querySelector(".hlrRadio:checked")?.value || "";

  const respVal =
    document.querySelector(".respRadio:checked")?.value || "";

  setHidden(
    $("hlrMinusTextWrap"),
    hlrVal !== "Nei"
  );

  setHidden(
    $("respMinusTextWrap"),
    respVal !== "Nei"
  );

  if (hlrVal !== "Nei") {
    $("hlrMinusLege").value = "";
    $("hlrMinusDato").value = "";
  }

  if (respVal !== "Nei") {
    $("respMinusLege").value = "";
    $("respMinusDato").value = "";
  }
}


function bindHlrRespEvents() {

  document.querySelectorAll(".hlrRadio, .respRadio").forEach(radio => {

    const chip = radio.closest(".medChip");
    if (!chip) return;

    chip.addEventListener("pointerdown", () => {
      radio.dataset.wasChecked = radio.checked ? "true" : "false";
    });

    chip.addEventListener("click", e => {
      e.preventDefault();

      const wasChecked = radio.dataset.wasChecked === "true";

      if (wasChecked) {
        radio.checked = false;
      } else {
        radio.checked = true;
      }

      updateHlrRespUI();
      lagRapport();
    });

  });

}

function bindEvents() {

bindHastegradEvents();
bindAutoGrowEvents();
bindVitalEvents();
bindGcsHurtigregistrering();
bindAktueltSynkronisering();

  bindPvkEvents();
  bindCvkEvents();
  bindUtstyrPumpeEvents();
  bindAcutePumpeEvents();

  bindAcuteSpontO2NumberOnly();
  bindHighFlowNumberOnly();
  bindMedicationNeiEvents();

  bindSpedbarnEvents();
  bindFollowNeedEvents();
  bindCaveEvents();
  bindSmitteEvents();
  bindHlrRespEvents();

  bindBinaryOptionEvents();
  bindSpontO2NumberOnly();

  bindTrachEvents();
  bindAcuteTrachEvents();

  bindSmartChipLogic();
  bindAcuteAirwayInputEvents();
  bindToggleEvents();

  // Synkroniser etter øvrig feltbehandling
  bindLuftveiDetaljer();


  $("copyBtn")?.addEventListener(
    "click",
    kopierRapport
  );

  $("resetBtn")?.addEventListener(
    "click",
    nullstillSkjema
  );


  document.addEventListener("input", () => {

    huskUtfylteFeltgrupper();
    lagRapport();

  });

  document.addEventListener("change", () => {

    huskUtfylteFeltgrupper();
    lagRapport();

  });

}

/* ======================================================
   DYNAMISKE FELTER
====================================================== */
function cleanupDynamicTextRows(container, textClass, checkboxClass) {
  const rows = Array.from(
    container.querySelectorAll(".dynamicRow")
  );

  const blanks = rows.filter(row => {
    const txt = row.querySelector("." + textClass);
    const chk = row.querySelector("." + checkboxClass);
    const val = clean(txt?.value);

    return !val && (!chk || !chk.checked);
  });

  if (blanks.length <= 1) return;

  blanks.slice(0, -1).forEach(row => {
    const tr = row.closest("tr");

    if (tr) {
      tr.remove();
    } else {
      row.remove();
    }
  });
}

function addDynamicTextRow(container, placeholder, checkboxClass, textClass) {  const row=document.createElement("div");
  row.className="dynamicRow";
  row.innerHTML='<input type="checkbox" class="chk '+checkboxClass+'"><input type="text" class="'+textClass+'" placeholder="'+placeholder+'">';
  container.appendChild(row);
  const chk=row.querySelector("."+checkboxClass),txt=row.querySelector("."+textClass);
  txt.addEventListener("input",()=>{
    chk.checked=!!clean(txt.value);
    cleanupDynamicTextRows(container,textClass,checkboxClass);
    if(textClass==="sedText")ensureSedBlankRow();
    if(textClass==="pressorText")ensurePressorBlankRow();
    if(textClass==="andreInfText")ensureAndreInfBlankRow();
    lagRapport();
  });
  chk.addEventListener("change",lagRapport);
}
function ensureBlankByClass(textClass,addFn){const texts=Array.from(document.querySelectorAll("."+textClass));if(!texts.length||!texts.some(t=>!clean(t.value)))addFn()}
function addSedRow(){
  addDynamicTextRow(
    sedDynamicBody,
    "Annet sedativ",
    "sedDynChk",
    "sedText"
  )
}
function ensureSedBlankRow(){
  ensureBlankByClass("sedText", addSedRow);
}

function resetSedRows(){
  sedDynamicBody.innerHTML="";
  addSedRow();
}
function addPressorRow(){
  addDynamicTextRow(
    pressorDynamicBody,
    "Annen pressor",
    "pressorDynChk",
    "pressorText"
  )
}
function ensurePressorBlankRow(){ensureBlankByClass("pressorText",addPressorRow)}function resetPressorRows(){pressorDynamicBody.innerHTML="";addPressorRow()}
function addAndreInfRow(){
  addDynamicTextRow(
    andreInfBody,
    "Annet medikament / infusjon",
    "andreInfChk",
    "andreInfText"
  )
}
function ensureAndreInfBlankRow(){ensureBlankByClass("andreInfText",addAndreInfRow)}function resetAndreInfRows(){
  andreInfBody.innerHTML="";
  addAndreInfRow();
}

function addTilgangRow() {
  const row = document.createElement("tr");

row.innerHTML =
  '<td class="dynamicTableCell"><div class="dynamicRow"><input type="checkbox" class="chk tilgangDynChk"><input type="text" class="tilgangText" placeholder="Annen tilgang"></div></td>';

  tilgangerDynamicBody.appendChild(row);

  const chk = row.querySelector(".tilgangDynChk");
  const txt = row.querySelector(".tilgangText");

  txt.addEventListener("input", () => {
    chk.checked = !!clean(txt.value);

    cleanupDynamicTextRows(
      tilgangerDynamicBody,
      "tilgangText",
      "tilgangDynChk"
    );

    ensureTilgangBlankRow();
    lagRapport();
  });

  chk.addEventListener("change", lagRapport);
}
function ensureTilgangBlankRow(){const texts=Array.from(document.querySelectorAll(".tilgangText"));if(!texts.length||!texts.some(t=>!clean(t.value)))addTilgangRow()}
function resetTilgangRows(){tilgangerDynamicBody.innerHTML="";addTilgangRow()}
function addDrenAnnetField(){const row=document.createElement("div");row.className="dynamicRow";row.innerHTML='<input type="checkbox" class="chk drenAnnetChk"><input type="text" class="drenAnnetText" placeholder="Beskriv utstyr">';const cb=row.querySelector(".drenAnnetChk"),txt=row.querySelector(".drenAnnetText");txt.addEventListener("input", () => {

  cb.checked = !!clean(txt.value);

  cleanupDynamicTextRows(
    drenAnnetContainer,
    "drenAnnetText",
    "drenAnnetChk"
  );

  ensureDrenAnnetBlankField();

  lagRapport();
});cb.addEventListener("change",lagRapport);drenAnnetContainer.appendChild(row)}
function ensureDrenAnnetBlankField(){const texts=Array.from(document.querySelectorAll(".drenAnnetText"));if(!texts.length||!texts.some(t=>!clean(t.value)))addDrenAnnetField()}
function resetDrenAnnetFields(){drenAnnetContainer.innerHTML="";addDrenAnnetField()}
function collectDynamicTexts(textSelector,checkSelector){const out=[];document.querySelectorAll(textSelector).forEach(txt=>{const row=txt.closest(".dynamicRow"),chk=row?row.querySelector(checkSelector):null,val=clean(txt.value);if(chk&&chk.checked&&val)out.push(val)});return out}
function linesFixedMeds(selector){const out=[];document.querySelectorAll(selector).forEach(chk=>{if(chk.checked&&chk.dataset.name)out.push(chk.dataset.name)});return out}
/* ======================================================
   GCS – KONTROLL AV TOTALSKÅR OG E+V+M
====================================================== */

function kontrollerGcs(raw) {

  const v = clean(raw);

  if (!v) {
    return { gyldig: true, tekst: "" };
  }

  // GCS oppgitt som totalskår, f.eks. 15

  if (/^\d{1,2}$/.test(v)) {

    const sum = Number(v);

    return {
      gyldig: sum >= 3 && sum <= 15,
      tekst: "GCS: " + sum
    };
  }

  // GCS oppgitt som Øye + Verbal + Motorisk

  const m = v.match(
    /^(\d{1,2})\s*\+\s*(\d{1,2})\s*\+\s*(\d{1,2})$/
  );

  if (m) {

    const [e, verbal, motorisk] =
      m.slice(1).map(Number);

    const gyldig =
      e >= 1 && e <= 4 &&
      verbal >= 1 && verbal <= 5 &&
      motorisk >= 1 && motorisk <= 6;

    return {
      gyldig,
      tekst:
        `GCS: ${e}+${verbal}+${motorisk}` +
        (gyldig ? `=${e + verbal + motorisk}` : "")
    };
  }

  return {
    gyldig: false,
    tekst: "GCS: " + v
  };
}


/* ======================================================
   GCS – TEKST I RAPPORT
====================================================== */

function formatGcsValue(raw) {

  const vurdering = kontrollerGcs(raw);

  if (!vurdering.tekst) {
    return "";
  }

  return vurdering.gyldig
    ? vurdering.tekst
    : vurdering.tekst + " (KONTROLLER GCS)";
}


/* ======================================================
   VISUELL KONTROLL AV GCS OG FiO2
====================================================== */

function oppdaterKliniskeFeltvarsler() {

  // GCS

  const gcs = $("gcs");

  if (gcs) {

    const feil =
      !!clean(gcs.value) &&
      !kontrollerGcs(gcs.value).gyldig;

    gcs.classList.toggle("kliniskUgyldig", feil);

    gcs.setAttribute(
      "aria-invalid",
      String(feil)
    );

    gcs.title = feil
      ? "Kontroller GCS: sum 3–15 eller E 1–4 + V 1–5 + M 1–6"
      : "";
  }


  // FiO2 – samtlige relevante felt

  [
    "highFlowFio2",
    "acuteHighFlowFio2",
    "nivFio2",
    "acuteNivFio2",
    "intubFio2",
    "acuteIntubFio2",
    "trachVentFio2",
    "acuteTrachVentFio2"

  ].forEach(id => {

    const el = $(id);

    if (!el) return;

    const tekst = clean(el.value).replace(",", ".");

    const feil =
      tekst !== "" &&
      Number.isFinite(Number(tekst)) &&
      Number(tekst) > 100;

    el.classList.toggle("kliniskUgyldig", feil);

    el.setAttribute(
      "aria-invalid",
      String(feil)
    );

    el.title = feil
      ? "FiO₂ kan ikke være over 100 %"
      : "";
  });
}
function lagRapport() {

  syncSpecMirrors();
  updateTitle();
  oppdaterKliniskeFeltvarsler();

  const h = getBinaryValue("hast");

  if (!h) {
    rapport.value = "";
    return;
  }

  const lines = [];

  addHeader(lines);
  addSpesialtransport(lines);
  addHastegrad(lines);


  /* ==========================================
     FØLGEBEHOV OG BARN
  ========================================== */

  const follow = buildFollowNeedLine();

  if (follow) {
    lines.push(follow);
  }

  const sped = buildSpedbarnLine();

  if (sped) {
    lines.push(sped);
  }

  if (
    getSpedbarnValue() &&
    getSpedbarnValue() !== "Nei"
  ) {
    addTransportform(lines);
  }


  /* ==========================================
     BYGG RAPPORT ETTER HASTEGRAD
  ========================================== */

  if (isAcute()) {

    buildAcuteReport(lines);

    if (
      harBeholdteSeksjoner("full-") ||
      beholdteFeltgrupper.has("fullBottom")
    ) {

      const supplerende = [];

      buildFullReport(supplerende);

      leggTilUnikeRapportlinjer(
        lines,
        supplerende
      );
    }

  } else {

    buildFullReport(lines);

    if (
      harBeholdteSeksjoner("acute-") ||
      ["acuteBottom", "acuteDoctorBlock"]
        .some(id => beholdteFeltgrupper.has(id))
    ) {

      const supplerende = [];

      buildAcuteReport(supplerende);

      leggTilUnikeRapportlinjer(
        lines,
        supplerende
      );
    }
  }


  /* ==========================================
     T034 – SISTE LUFTVEISSTATUS
  ========================================== */

  const gjeldendeLuftvei = isAcute()
    ? (buildAcuteAirwayLines()[0] || "")
    : buildFullAirwayLine();


  /* ==========================================
     T039 – SISTE AKTUELT-TEKST
  ========================================== */

  const gjeldendeAktuelt = clean(
    $(
      isAcute()
        ? "acuteHovedproblem"
        : "hovedproblem"
    ).value
  );


  /* ==========================================
     FJERN MOTSTRIDENDE RAPPORTLINJER
  ========================================== */

  let aktueltSattInn = false;
  let luftveiSattInn = false;

  const ferdigeLinjer = [];

  lines.forEach(linje => {

    // Kun én gjeldende Aktuelt-tekst
    if (linje.startsWith("Aktuelt:")) {

      if (
        !aktueltSattInn &&
        gjeldendeAktuelt
      ) {

        ferdigeLinjer.push(
          "Aktuelt: " + gjeldendeAktuelt
        );

      }

      aktueltSattInn = true;
      return;
    }


    // Kun én gjeldende luftveisstatus
    if (linje.startsWith("Luftveier:")) {

      if (
        !luftveiSattInn &&
        gjeldendeLuftvei
      ) {

        ferdigeLinjer.push(
          gjeldendeLuftvei
        );

      }

      luftveiSattInn = true;
      return;
    }


    // Alle andre opplysninger beholdes
    ferdigeLinjer.push(linje);

  });


  /* ==========================================
     FERDIG RAPPORT
  ========================================== */

/* ======================================================
   MARKER FOR HØY FiO2 I RAPPORTTEKSTEN
====================================================== */

const kontrollerteLinjer = ferdigeLinjer.map(linje => {

  if (!linje.startsWith("Luftveier:")) {
    return linje;
  }

  const treff = linje.match(
    /\bFiO2\s+(\d+(?:[.,]\d+)?)\s*%/i
  );

  if (
    treff &&
    Number(treff[1].replace(",", ".")) > 100
  ) {

    return linje +
      " (KONTROLLER FiO₂ – over 100 %)";
  }

  return linje;

});


rapport.value = kontrollerteLinjer.join("\n");

autoGrowTextarea(rapport);
}

function addHeader(lines) {

  const transportVal =
    getBinaryValue("transport");

  const barn = [
    "Nyfødt",
    "Spedbarn",
    "Barn"
  ].includes(getSpedbarnValue());

  lines.push(
    barn && transportVal === "Kuvøse"
      ? "KUVØSETRANSPORT"
      : "INTENSIV"
  );

}
function addSpesialtransport(lines) {
  const specs = [
    ...new Set(
      Array.from(document.querySelectorAll(".specChoice"))
        .filter(x => x.checked)
        .map(x => x.dataset.spec || x.value)
        .filter(x => x && x !== "Ikke aktuelt")
    )
  ];

  if (specs.length) {
    lines.push("Spesialtransport: " + specs.join(", "));
  }
}

function addHastegrad(lines) {
  lines.push(
    "Rekvirentens hastegrad: " +
    getBinaryValue("hast")
  );
}
function addTransportform(lines) {
  const transportVal = getBinaryValue("transport");

  if (transportVal) {
    lines.push("Transportform: " + transportVal);
  }
}
function getMedicationData() {
  return {
    sedasjon: [
      ...linesFixedMeds(".sed"),
      ...collectDynamicTexts(".sedText", ".sedDynChk")
    ],

    pressor: [
      ...linesFixedMeds(".pre"),
      ...collectDynamicTexts(".pressorText", ".pressorDynChk")
    ],

    andre: [
      ...Array.from(document.querySelectorAll('input[name="medicationOther"]:checked'))
        .map(x => x.value),
      ...collectDynamicTexts(".andreInfText", ".andreInfChk")
    ]
  };
}

function addMedicationSections(lines) {
  const meds = getMedicationData();

  if (meds.sedasjon.length) {
    lines.push(
      "Sedasjon: " +
      meds.sedasjon.join(", ")
    );
  }

  if (meds.pressor.length) {
    lines.push(
      "Pressor: " +
      meds.pressor.join(", ")
    );
  }

  if (meds.andre.length) {
    lines.push(
      "Andre medikamenter/infusjoner: " +
      meds.andre.join(", ")
    );
  }
}
function buildAcuteReport(lines) {

  const hp = clean($("acuteHovedproblem").value);

  if (hp) {
    lines.push("Aktuelt: " + hp);
  }

  if (
    clean($("vekt").value) &&
    !["Nyfødt", "Spedbarn"].includes(getSpedbarnValue())
  ) {
const vekt = clean($("vekt").value);

lines.push(
  Number(vekt) === 0
    ? "Vekt: Ikke oppgitt"
    : "Vekt: " + vekt + " kg"
);
  }

  buildAcuteAirwayLines().forEach(l => {
    lines.push(l);
  });

  addMedicationSections(lines);

  if (acutePumperChk.checked) {
    const antall = clean(acutePumperAntall.value);

    lines.push(
      antall
        ? "Sprøytepumper: " + antall + " stk"
        : "Sprøytepumper: antall ikke oppgitt"
    );
  }

    buildSmitteLines().forEach(l => lines.push(l));
  buildCaveLines().forEach(l => lines.push(l));
  buildHlrRespLines().forEach(l => lines.push(l));

  addAcuteDoctor(lines);
}


function buildFullReport(lines) {

  const hp = clean($("hovedproblem").value);

  if (hp) {
    lines.push("Aktuelt: " + hp);
  }

  const tid = clean($("tidligere").value);

  if (tid) {
    lines.push("T: " + tid);
  }


  const vekt = clean($("vekt").value);

if (
  vekt !== "" &&
  !["Nyfødt", "Spedbarn"].includes(getSpedbarnValue())
) {

  lines.push(
    Number(vekt) === 0
      ? "Vekt: Ikke oppgitt"
      : "Vekt: " + vekt + " kg"
  );

}

const airway = buildFullAirwayLine();

if (airway) {
  lines.push(airway);
}

const vit = buildVitalsLine();

if (vit) {
  lines.push(vit);
}

addMedicationSections(lines);

  const til = linesTilganger();

  if (til.length) {
    lines.push(
      "Tilganger: " +
      til.join(", ")
    );
  }

  const utstyr = buildUtstyrList();

  if (utstyr.length) {
    lines.push(
      "Utstyr: " +
      utstyr.join(", ")
    );
  }

buildSmitteLines().forEach(l => lines.push(l));
buildCaveLines().forEach(l => lines.push(l));
buildHlrRespLines().forEach(l => lines.push(l));

  addFullDoctors(lines);
}
function addAcuteDoctor(lines) {

  const rn = clean($("acuteRekNavn").value);

  const rt = clean($("acuteRekTlf").value)
    ? formatPhone(clean($("acuteRekTlf").value))
    : "";

  if (rn || rt) {
    lines.push(
      "Rekvirerende lege: " +
      (rn && rt ? rn + " - " + rt : rn || rt)
    );
  }
}
function addFullDoctors(lines) {

  const rn = clean($("rekNavn").value);

  const rt = clean($("rekTlf").value)
    ? formatPhone(clean($("rekTlf").value))
    : "";

  const mn = clean($("mottNavn").value);

  const mt = clean($("mottTlf").value)
    ? formatPhone(clean($("mottTlf").value))
    : "";

  if (rn || rt) {
    lines.push(
      "Rekvirerende lege: " +
      (rn && rt ? rn + " - " + rt : rn || rt)
    );
  }

  if (mn || mt) {
    lines.push(
      "Mottakende lege: " +
      (mn && mt ? mn + " - " + mt : mn || mt)
    );
  }
}

async function kopierRapport() {

  const tekst = rapport.value;

  clearTimeout(copyTimer);

  try {

    if (
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== "function"
    ) {
      throw new Error("Utklippstavle ikke tilgjengelig");
    }

    await navigator.clipboard.writeText(tekst);

    // Vis bare suksess når kopieringen lykkes
    copyMsg.textContent = "Rapport kopiert";

  } catch (error) {

    console.warn("Kopiering mislyktes:", error);

    copyMsg.textContent =
      "Kunne ikke kopiere. Marker rapporten og kopier manuelt.";

  }

  copyMsg.classList.add("show");

  copyTimer = setTimeout(() => {

    copyMsg.classList.remove("show");

  }, 4000);

}

function nullstillSkjema() {

  beholdteFeltgrupper.clear();
  beholdteSeksjoner.clear();

  document.querySelectorAll("input").forEach(el => {

    el.dataset.active = "false";

    if (
      el.type === "checkbox" ||
      el.type === "radio"
    ) {

      el.checked = false;

    } else {

      el.value = "";

    }

  });


  document.querySelectorAll("textarea").forEach(el => {

    el.value = "";
    autoGrowTextarea(el);

  });


  // Nullstill manuell MAP-status
  $("map").dataset.auto = "";


  // Nullstill alle nedtrekksmenyer
  document.querySelectorAll("select").forEach(el => {

    el.selectedIndex = 0;

  });


  valgtHastegrad = "";
  forrigeHastegrad = "";

  document
    .querySelectorAll(".hasteCard")
    .forEach(b => {

      b.classList.remove("active");

    });


  updateMainVisibility();
  updateSpedbarnUI();
  updateCaveUI();
  updateHlrRespUI();
  updateSmitteSpes();

handleAirwayChange();
updateAcuteAirwayDetails();
oppdaterKliniskeFeltvarsler();

rapport.value = "";
}

function bindExclusiveChipGroup(options) {
  const {
    noneSelector,
    otherSelector,
    clearSelectors = [],
    resetRows,
    onChange
  } = options;

  const none = document.querySelector(noneSelector);
  const others = document.querySelectorAll(otherSelector);

  if (!none) return;

  none.addEventListener("change", () => {
    if (none.checked) {
      others.forEach(chk => {
        chk.checked = false;
      });

      clearSelectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          if ("value" in el) el.value = "";
          if ("checked" in el) el.checked = false;
          el.classList?.add("hidden");
        });
      });

      if (typeof resetRows === "function") {
        resetRows();
      }
    }

    if (typeof onChange === "function") onChange();
    lagRapport();
  });

  others.forEach(chk => {
    chk.addEventListener("change", () => {
      if (chk.checked) {
        none.checked = false;
      }

      if (typeof onChange === "function") onChange();
      lagRapport();
    });
  });
}

function bindSmartChipLogic() {

  // Følgebehov: Ikke aktuelt slår av alle andre
  bindExclusiveChipGroup({
    noneSelector: "#follow_none",
    otherSelector: 'input[name="followNeed"]:not(#follow_none)'
  });

// Tilganger: Ingen tilganger slår av CVK/PVK/annet
bindExclusiveChipGroup({
  noneSelector: "#til_ingen",
  otherSelector: '.accessChipRow input[type="checkbox"]:not(#til_ingen)',
  clearSelectors: [
    ".tilgangDynChk",
    ".tilgangText"
  ],
  resetRows: () => {
    $("cvkLumen").value = "";
    $("pvkAntall").value = "";

    if (typeof resetTilgangRows === "function") {
      resetTilgangRows();

    }

    updateTilgangerUI();
  },
  onChange: () => {
    updateTilgangerUI();
  }
});

  // Utstyr: Ingen utstyr slår av alt annet
  bindExclusiveChipGroup({
    noneSelector: "#utst_ingen",
    otherSelector: '.utstyrChipRow input[type="checkbox"]:not(#utst_ingen)',
    clearSelectors: [
      "#utstPumpeAntall",
      ".drenAnnetChk",
      ".drenAnnetText"
    ],
    resetRows: () => {
      if (typeof resetDrenAnnetFields === "function") resetDrenAnnetFields();
    }
  });

  // Sedasjon: Nei slår av andre sedasjonsvalg og fritekst
  bindExclusiveChipGroup({
    noneSelector: "#sed_nei",
    otherSelector: '.sed:not(#sed_nei)',
    clearSelectors: [
      ".sedDynChk",
      ".sedText"
    ],
    resetRows: () => {
      if (typeof resetSedRows === "function") resetSedRows();
    }
  });

  // Pressor: Nei slår av andre pressorvalg og fritekst
  bindExclusiveChipGroup({
    noneSelector: "#pre_nei",
    otherSelector: '.pre:not(#pre_nei)',
    clearSelectors: [
      ".pressorDynChk",
      ".pressorText"
    ],
    resetRows: () => {
      if (typeof resetPressorRows === "function") resetPressorRows();
    }
  });

  // Andre medikamenter: Nei slår av Ringer/NaCl/Blod/Plasma/annet
  bindExclusiveChipGroup({
    noneSelector: 'input[name="medicationOther"][value="Nei"]',
    otherSelector: 'input[name="medicationOther"]:not([value="Nei"])',
    clearSelectors: [
      ".andreInfChk",
      ".andreInfText"
    ],
    resetRows: () => {
      if (typeof resetAndreInfRows === "function") resetAndreInfRows();
    }
  });

  // Spesialtransport: Ikke aktuelt slår av ECMO/IABP osv.
  bindExclusiveChipGroup({
    noneSelector: "#spec_ingen",
    otherSelector: '.specialGroup .specChoice:not(#spec_ingen)'
  });
}

function init() {

  lagFeltseksjoner();
  bindEvents();

  resetSedRows();
  resetPressorRows();
  resetAndreInfRows();
  resetTilgangRows();
  resetDrenAnnetFields();

  updateSpedbarnUI();

  handleAirwayChange();
  updateAcuteAirwayDetails();

  updateMapField();
  syncSpecMirrors();
  updateMainVisibility();
  updateTitle();

  document
    .querySelectorAll(".autoGrow")
    .forEach(autoGrowTextarea);

  lagRapport();
}

init();

function bindGestasjonsalderEvents() {
  const uker = document.getElementById("gestasjonsUker");
  const dager = document.getElementById("gestasjonsDager");

  if (!uker || !dager) return;

  uker.addEventListener("input", () => {
    uker.value = uker.value.replace(/\D/g, "").slice(0, 2);

    lagRapport();
  });

  uker.addEventListener("keydown", e => {
    if ((e.key === " " || e.code === "Space") && uker.value.length >= 1) {
      e.preventDefault();
      dager.focus();
      dager.select?.();
    }
  });

  dager.addEventListener("input", () => {
    dager.value = dager.value.replace(/\D/g, "").slice(0, 1);
    lagRapport();
  });
}

bindGestasjonsalderEvents();

document.addEventListener("click", e => {
  const cell = e.target.closest(".specialGroup .specCell");
  if (!cell) return;

  e.preventDefault();
  e.stopPropagation();

  const input = cell.querySelector("input");
  if (!input) return;

  input.checked = !input.checked;

  const ikkeAktuelt = $("spec_ingen");
  const alle = document.querySelectorAll(".specialGroup .specChoice");

  if (input === ikkeAktuelt && input.checked) {
    alle.forEach(chk => {
      if (chk !== ikkeAktuelt) chk.checked = false;
    });
  }

  if (input !== ikkeAktuelt && input.checked && ikkeAktuelt) {
    ikkeAktuelt.checked = false;
  }

  document.querySelectorAll(".specialGroup .specCell").forEach(celle => {
    const chk = celle.querySelector("input");
    celle.classList.toggle("active", !!chk?.checked);
  });

  lagRapport();
}, true);

function bindSpontO2NumberOnly() {
  const el = $("spontO2Liter");
  if (!el) return;

  el.addEventListener("input", () => {
    el.value = el.value.replace(/\D/g, "").slice(0, 2);
    lagRapport();
  });
}

function bindAcuteSpontO2NumberOnly() {

  const el = $("acuteSpontO2Liter");
  if (!el) return;

  el.addEventListener("input", () => {

    el.value = el.value
      .replace(/\D/g, "")
      .slice(0, 2);

    lagRapport();
  });
}

function bindHighFlowNumberOnly() {

  [
    $("highFlowFlow"),
    $("acuteHighFlowFlow")
  ].forEach(el => {

    if (!el) return;

    el.addEventListener("input", () => {

      el.value = el.value
        .replace(/\D/g, "")
        .slice(0, 3);

      lagRapport();
    });
  });

  [
    $("highFlowFio2"),
    $("acuteHighFlowFio2")
  ].forEach(el => {

    if (!el) return;

    el.addEventListener("input", () => {

      el.value = el.value
        .replace(/[^0-9.,]/g, "")
        .replace(",", ".");

      lagRapport();
    });
  });
}

function updateTilgangerUI() {
  const cvkValgt = $("til_cvk")?.checked;
  const pvkValgt = $("til_pvk")?.checked;

  setHidden($("cvkWrap"), !cvkValgt);
  setHidden($("pvkWrap"), !pvkValgt);

  $("cvkLumen")?.classList.remove("hidden");
  $("pvkAntall")?.classList.remove("hidden");
}

function bindMedicationNeiLogic(groupSelector, neiSelector, dynamicBody, textClass) {

  const nei = document.querySelector(neiSelector);
  if (!nei) return;

  const alle = document.querySelectorAll(groupSelector);

  nei.addEventListener("change", () => {

    if (nei.checked) {

      alle.forEach(chk => {
        if (chk !== nei) chk.checked = false;
      });

      if (dynamicBody) {
        dynamicBody.innerHTML = "";

        if (textClass === "sedText") addSedRow();
        if (textClass === "pressorText") addPressorRow();
        if (textClass === "andreInfText") addAndreInfRow();
      }
    }

    lagRapport();
  });

  alle.forEach(chk => {

    if (chk === nei) return;

    chk.addEventListener("change", () => {

      if (chk.checked) {
        nei.checked = false;
      }

      lagRapport();
    });

  });

  if (dynamicBody) {

    dynamicBody.addEventListener("input", () => {

      const harTekst = Array.from(
        dynamicBody.querySelectorAll("input[type='text']")
      ).some(txt => clean(txt.value));

      if (harTekst) {
        nei.checked = false;
      }

      lagRapport();
    });

  }

}

function bindMedicationNeiEvents() {

  bindMedicationNeiLogic(
    ".sed",
    "#sed_nei",
    sedDynamicBody,
    "sedText"
  );

  bindMedicationNeiLogic(
    ".pre",
    "#pre_nei",
    pressorDynamicBody,
    "pressorText"
  );

  bindMedicationNeiLogic(
    'input[name="medicationOther"]',
    'input[name="medicationOther"][value="Nei"]',
    andreInfBody,
    "andreInfText"
  );
}

function buildFollowNeedLine() {
  const valgt = Array.from(
    document.querySelectorAll('input[name="followNeed"]:checked')
  ).map(x => x.value);

  if (!valgt.length) return "";

  return "Følgebehov ifølge rekvirent: " + valgt.join(", ");
}

function bindFollowNeedEvents() {
  const none = document.getElementById("follow_none");
  const all = document.querySelectorAll('input[name="followNeed"]');

  if (!none) return;

  none.addEventListener("change", () => {
    if (none.checked) {
      all.forEach(chk => {
        if (chk !== none) chk.checked = false;
      });
    }

    lagRapport();
  });

  all.forEach(chk => {
    if (chk === none) return;

    chk.addEventListener("change", () => {
      if (chk.checked) {
        none.checked = false;
      }

      lagRapport();
    });
  });
}
/* ======================================================
   POPUP – TILBAKEMELDINGER OG INNSPILL
====================================================== */

(() => {
  "use strict";

  function initFeedbackDialog() {

    const feedbackBtn = document.getElementById("feedbackBtn");
    const feedbackDialog = document.getElementById("feedbackDialog");
    const closeBtn = document.getElementById("feedbackDialogClose");
    const okBtn = document.getElementById("feedbackDialogOk");

    // Avslutt dersom elementene ikke finnes.
    if (!feedbackBtn || !feedbackDialog || !closeBtn || !okBtn) {
      return;
    }

    // Åpne popup.
    feedbackBtn.addEventListener("click", () => {
      if (!feedbackDialog.open) {
        feedbackDialog.showModal();
      }
    });

    // Lukk med X.
    closeBtn.addEventListener("click", () => {
      feedbackDialog.close();
    });

    // Lukk med knappen "Lukk".
    okBtn.addEventListener("click", () => {
      feedbackDialog.close();
    });

    // Lukk ved klikk utenfor popup-vinduet.
    feedbackDialog.addEventListener("click", (event) => {
      if (event.target === feedbackDialog) {
        const rect = feedbackDialog.getBoundingClientRect();

        const inside =
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom;

        if (!inside) {
          feedbackDialog.close();
        }
      }
    });

    // Escape-tasten håndteres automatisk av dialog-elementet.
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFeedbackDialog);
  } else {
    initFeedbackDialog();
  }

})();
/* ======================================================
   VERSJONSHISTORIKK – GITHUB RELEASES
====================================================== */

(() => {
  "use strict";

  /* ====================================================
     INNSTILLINGER

     FYLL INN GITHUB-INFORMASJON HER
  ==================================================== */

const GITHUB_OWNER = "gunnartande1-collab";
const GITHUB_REPO = "Intensiv--og-helikoptertransport";

  const MAX_RELEASES = 100;

  /* ====================================================
     INITIALISERING
  ==================================================== */

  function initVersionHistory() {

    const openBtn = document.getElementById(
      "versionHistoryBtn"
    );

    const dialog = document.getElementById(
      "versionHistoryDialog"
    );

    const closeBtn = document.getElementById(
      "versionHistoryClose"
    );

    const okBtn = document.getElementById(
      "versionHistoryOk"
    );

    const list = document.getElementById(
      "versionHistoryList"
    );

    const currentVersionElement = document.getElementById(
      "currentVersion"
    );

    if (
      !openBtn ||
      !dialog ||
      !closeBtn ||
      !okBtn ||
      !list ||
      !currentVersionElement
    ) {
      return;
    }

    const currentVersion =
      currentVersionElement.dataset.version || "v1.0.0";

    let releasesLoaded = false;

    /* ================================================
       HJELPEFUNKSJONER
    ================================================ */

    function normalizeVersion(value) {
      return String(value || "")
        .trim()
        .replace(/^v/i, "")
        .toLowerCase();
    }

    function formatDate(dateString) {

      if (!dateString) {
        return "Dato ikke oppgitt";
      }

      const date = new Date(dateString);

      if (Number.isNaN(date.getTime())) {
        return "Dato ikke oppgitt";
      }

      return new Intl.DateTimeFormat("nb-NO", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }).format(date);
    }

    function setStatus(message) {

      list.replaceChildren();

      const paragraph = document.createElement("p");
      paragraph.className = "versionHistoryStatus";
      paragraph.textContent = message;

      list.appendChild(paragraph);
    }

    function createElement(tag, className, text) {

      const element = document.createElement(tag);

      if (className) {
        element.className = className;
      }

      if (text !== undefined) {
        element.textContent = text;
      }

      return element;
    }

    /* ================================================
       VIS ÉN VERSJON
    ================================================ */

    function createReleaseEntry(release) {

      const entry = createElement(
        "article",
        "versionHistoryEntry"
      );

      const header = createElement(
        "div",
        "versionHistoryEntryHeader"
      );

      const versionName =
        release.tag_name || release.name || "Ukjent versjon";

      const title = createElement(
        "h3",
        "versionHistoryEntryTitle",
        versionName
      );

      header.appendChild(title);

      const isCurrent =
        normalizeVersion(release.tag_name) ===
        normalizeVersion(currentVersion);

      if (isCurrent) {

        const badge = createElement(
          "span",
          "versionHistoryBadge",
          "Gjeldende"
        );

        header.appendChild(badge);
      }

      entry.appendChild(header);

      const date = createElement(
        "span",
        "versionHistoryDate",
        "Publisert: " + formatDate(release.published_at)
      );

      entry.appendChild(date);

      const description = createElement(
        "p",
        "versionHistoryDescription",
        release.body && release.body.trim()
          ? release.body.trim()
          : "Ingen endringsbeskrivelse er registrert."
      );

      entry.appendChild(description);

      return entry;
    }

    /* ================================================
       HENT RELEASES FRA GITHUB
    ================================================ */

    async function loadVersionHistory() {

      if (releasesLoaded) {
        return;
      }

      const owner = GITHUB_OWNER.trim();
      const repo = GITHUB_REPO.trim();

      if (
        !owner ||
        !repo ||
        owner === "DITT_GITHUB_BRUKERNAVN" ||
        repo === "DITT_REPOSITORY_NAVN"
      ) {

        setStatus(
          "Versjon " +
          currentVersion.replace(/^v/i, "") +
          " er angitt som gjeldende. " +
          "GitHub-repositoriet må konfigureres før " +
          "versjonshistorikken kan hentes automatisk."
        );

        return;
      }

      setStatus("Henter versjonshistorikk fra GitHub…");

      const apiUrl =
        "https://api.github.com/repos/" +
        encodeURIComponent(owner) +
        "/" +
        encodeURIComponent(repo) +
        "/releases?per_page=" +
        MAX_RELEASES;

      try {

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Accept": "application/vnd.github+json"
          },
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error(
            "GitHub svarte med status " + response.status
          );
        }

        const releases = await response.json();

        if (!Array.isArray(releases)) {
          throw new Error("Ugyldig svar fra GitHub");
        }

        // Vis kun publiserte, ordinære versjoner.
        const publishedReleases = releases.filter(
          release =>
            !release.draft &&
            !release.prerelease &&
            release.published_at
        );

        publishedReleases.sort(
          (a, b) =>
            new Date(b.published_at) -
            new Date(a.published_at)
        );

        list.replaceChildren();

        if (publishedReleases.length === 0) {

          setStatus(
            "Ingen publiserte versjoner er registrert " +
            "i GitHub Releases ennå. " +
            "Gjeldende versjon i skjemaet er " +
            currentVersion + "."
          );

          releasesLoaded = true;
          return;
        }

        publishedReleases.forEach(release => {
          list.appendChild(
            createReleaseEntry(release)
          );
        });

        const currentReleaseExists =
          publishedReleases.some(
            release =>
              normalizeVersion(release.tag_name) ===
              normalizeVersion(currentVersion)
          );

        if (!currentReleaseExists) {

          const notice = createElement(
            "p",
            "versionHistoryStatus",
            "Merk: Versjonen som er angitt som gjeldende " +
            "i nettsiden (" + currentVersion + ") finnes " +
            "ikke blant de hentede publiserte versjonene."
          );

          list.prepend(notice);
        }

        releasesLoaded = true;

      } catch (error) {

        console.error(
          "Kunne ikke hente versjonshistorikk:",
          error
        );

        setStatus(
          "Kunne ikke hente versjonshistorikken fra GitHub. " +
          "Kontroller at repositoriet er offentlig, " +
          "at adressen er riktig, og at du har " +
          "internettforbindelse. " +
          "Gjeldende versjon i skjemaet er " +
          currentVersion + "."
        );
      }
    }

    /* ================================================
       ÅPNE OG LUKKE POPUP
    ================================================ */

    openBtn.addEventListener("click", () => {

      if (!dialog.open) {
        dialog.showModal();
      }

      loadVersionHistory();
    });

    closeBtn.addEventListener("click", () => {
      dialog.close();
    });

    okBtn.addEventListener("click", () => {
      dialog.close();
    });

    dialog.addEventListener("click", event => {

      if (event.target !== dialog) {
        return;
      }

      const rect = dialog.getBoundingClientRect();

      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!inside) {
        dialog.close();
      }
    });

    // Escape håndteres automatisk av <dialog>.
  }

  /* ====================================================
     START FUNKSJONEN
  ==================================================== */

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      initVersionHistory
    );

  } else {

    initVersionHistory();

  }

})();

/* ======================================================
   OPSIX – DAG / NATT

   Nattmodus er alltid standard ved åpning.
   Brukeren kan manuelt velge dagmodus.
   Ingen valg eller pasientopplysninger lagres.
====================================================== */

(() => {
  "use strict";

  function initThemeToggle() {

    const button = document.getElementById("themeToggle");
    const label = document.getElementById("themeLabel");
    const icon = document.getElementById("themeIcon");

    if (!button || !label || !icon) {
      return;
    }

    function applyTheme(isLight) {

      document.body.classList.toggle(
        "theme-light",
        isLight
      );

      button.setAttribute(
        "aria-pressed",
        String(isLight)
      );

      button.setAttribute(
        "aria-label",
        isLight
          ? "Bytt til nattvisning"
          : "Bytt til dagvisning"
      );

      button.title = isLight
        ? "Bytt til nattvisning"
        : "Bytt til dagvisning";

      label.textContent = isLight
        ? "Natt"
        : "Dag";

      icon.textContent = isLight
        ? "☾"
        : "☀";

      document.documentElement.style.colorScheme =
        isLight ? "light" : "dark";
    }

    // Start alltid i nattmodus
    applyTheme(false);

    // Bytt mellom dag og natt ved klikk
    button.addEventListener("click", () => {

      const nextLight =
        !document.body.classList.contains("theme-light");

      applyTheme(nextLight);

    });

  }

  // Initialiser når HTML er ferdig lastet
  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      initThemeToggle
    );

  } else {

    initThemeToggle();

  }

})();
