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
/* ======================================================
   GENERELLE HJELPEFUNKSJONER
====================================================== */
const clean=v=>(v??"").toString().trim();
function setHidden(el,hide){if(el)el.classList.toggle("hidden",!!hide)}
function formatPhone(raw){const d=(raw||"").replace(/\D/g,"");return d.length===8?d.slice(0,3)+" "+d.slice(3,5)+" "+d.slice(5):raw}
function getBinaryValue(group){if(group==="hast")return valgtHastegrad;const el=document.querySelector('.binOpt[data-group="'+group+'"]:checked');return el?el.dataset.value:""}
function setBinaryValue(group,value){document.querySelectorAll('.binOpt[data-group="'+group+'"]').forEach(el=>el.checked=el.dataset.value===value)}
function getSpedbarnValue(){const el=document.querySelector(".spedRadio:checked");return el?el.dataset.value:""}
function getCaveValue(){const el=document.querySelector(".caveRadio:checked");return el?el.dataset.value:""}
function isAcute(){return valgtHastegrad==="Akutt"}
function autoGrowTextarea(el){if(!el)return;el.style.height="auto";el.style.height=el.scrollHeight+"px"}
function updateTitle(){pageTitle.textContent=getBinaryValue("transport")==="Kuvøse"?"KUVØSETRANSPORT":"Intensiv- og helikoptertransport"}
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

const cvkLumen = clean($("cvkLumen")?.value);

if ($("til_cvk").checked) {
  out.push(cvkLumen ? "CVK  " + cvkLumen : "CVK");
}
  const n = clean(pvkAntall.value);

  if (pvkChk.checked) {
    out.push(n ? "PVK " + n + "stk" : "PVK");
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

  if (getSpedbarnValue() !== "Ja") {
    return "";
  }

  const u = clean($("gestasjonsUker").value);
  const d = clean($("gestasjonsDager").value);
  const v = clean($("vekt").value);

  const p = ["Spedbarn"];

  if (u || d) {
    p.push(
      "GA " +
      (u || "?") +
      "+" +
      (d || "0")
    );
  }

  if (v) {
    p.push("Vekt: " + v + " g");
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
  const spedRespArbeidWrap = $("spedRespArbeidWrap");

  setHidden(spedbarnExtraWrap, val !== "Ja");
  setHidden(spedRespArbeidWrap, val !== "Ja");

  vektLabel.textContent = val === "Ja"
    ? "Vekt (gram)"
    : "Vekt (kg)";

  $("vekt").placeholder = val === "Ja"
    ? "gram"
    : "kg";

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
function updateMapField(){const mapEl=$("map"),auto=calcMapFromSysDia($("btSys").value,$("btDia").value);if(auto){mapEl.value=auto;mapEl.dataset.auto="1"}else if(mapEl.dataset.auto==="1"){mapEl.value="";mapEl.dataset.auto=""}}
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

function copyVal(from,to){if(clean($(from).value)&&!clean($(to).value))$(to).value=$(from).value}
function syncAcuteToFull(){copyVal("acuteHovedproblem","hovedproblem");const a=getBinaryValue("acuteAirway");if(a&&!getBinaryValue("airwayMain"))setBinaryValue("airwayMain",a);[["acuteSpontO2Liter","spontO2Liter"],["acuteHighFlowFio2","highFlowFio2"],["acuteHighFlowFlow","highFlowFlow"],["acuteNivFio2","nivFio2"],["acuteIntubFio2","intubFio2"],["acuteIntubPeep","intubPeep"],["acuteIntubTopp","intubTopp"],["acuteTrachO2Liter","trachO2Liter"],["acuteTrachVentFio2","trachVentFio2"],["acuteTrachVentPeep","trachVentPeep"],["acuteTrachVentTopp","trachVentTopp"],["acuteRekNavn","rekNavn"],["acuteRekTlf","rekTlf"]].forEach(x=>copyVal(...x));if($("acute_tr_spont").checked)$("tr_spont").checked=true;if($("acute_tr_o2").checked)$("tr_o2").checked=true;if($("acute_tr_vent").checked)$("tr_vent").checked=true;if(clean(acutePumperAntall.value)&&!clean(utstPumperAntall.value)){utstPumperAntall.value=acutePumperAntall.value;utstPumperChk.checked=true}}
function syncFullToAcute(){copyVal("hovedproblem","acuteHovedproblem");const a=getBinaryValue("airwayMain");if(a&&!getBinaryValue("acuteAirway"))setBinaryValue("acuteAirway",a);[["spontO2Liter","acuteSpontO2Liter"],["highFlowFio2","acuteHighFlowFio2"],["highFlowFlow","acuteHighFlowFlow"],["nivFio2","acuteNivFio2"],["intubFio2","acuteIntubFio2"],["intubPeep","acuteIntubPeep"],["intubTopp","acuteIntubTopp"],["trachO2Liter","acuteTrachO2Liter"],["trachVentFio2","acuteTrachVentFio2"],["trachVentPeep","acuteTrachVentPeep"],["trachVentTopp","acuteTrachVentTopp"],["rekNavn","acuteRekNavn"],["rekTlf","acuteRekTlf"]].forEach(x=>copyVal(...x));if($("tr_spont").checked)$("acute_tr_spont").checked=true;if($("tr_o2").checked)$("acute_tr_o2").checked=true;if($("tr_vent").checked)$("acute_tr_vent").checked=true;if(clean(utstPumperAntall.value)&&!clean(acutePumperAntall.value)){acutePumperAntall.value=utstPumperAntall.value;acutePumperChk.checked=true}updateAcuteAirwayDetails()}
function syncVisibleSharedFieldsBeforeSwitch(){if(forrigeHastegrad==="Akutt"&&valgtHastegrad!=="Akutt")syncAcuteToFull();else if(forrigeHastegrad!=="Akutt"&&valgtHastegrad==="Akutt")syncFullToAcute()}
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
  setHidden(acuteTop, !acute);
  setHidden(acuteBottom, !acute);

  // Ikke-akutt-del
  setHidden(fullTop, acute);
  setHidden(fullBottom, acute);

  // Smitte, CAVE og HLR/respirator vises både ved Akutt og Haster
  setHidden(safetyBlock, false);

  // Rekvirerende lege for Akutt vises nederst i Akutt-flyten
  setHidden(acuteDoctorBlock, !acute);

  // Tilganger, utstyr og full legeinfo skjules ved Akutt
  setHidden(sharedBottom, acute);

  // Rapport og knapper skal alltid vises når hastegrad er valgt
  setHidden($("reportActions"), false);
  setHidden($("rapport"), false);
  setHidden($("feedbackWrap"), false);

  if (acute) {
    updateAcuteAirwayDetails();
  } else {
    handleAirwayChange();
  }

  updateTitle();
}

/* ======================================================
   EVENT BINDING
====================================================== */
function bindHastegradEvents() {

  document
    .querySelectorAll(".hasteCard")
    .forEach(btn =>
      btn.addEventListener("click", () => {

        forrigeHastegrad = valgtHastegrad;
        valgtHastegrad = btn.dataset.haste;

        syncVisibleSharedFieldsBeforeSwitch();

        document
          .querySelectorAll(".hasteCard")
          .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        updateMainVisibility();
        lagRapport();
      })
    );
}

function bindVitalEvents() {

  ["btSys", "btDia"].forEach(id => {
    const el = $(id);

    if (el) {
      el.addEventListener("input", () => {
        updateMapField();
        handleVitalInput({ target: el });
      });

      el.addEventListener("keydown", handleVitalSpace);
    }
  });

  $("map").addEventListener("input", handleVitalInput);
  $("map").addEventListener("keydown", handleVitalSpace);

  ["rf", "spo2", "puls", "temp"].forEach(id => {
    const el = $(id);

    if (el) {
      el.addEventListener("input", handleVitalInput);
      el.addEventListener("keydown", handleVitalSpace);
    }
  });
}
function bindSpedRespArbeidEvents() {
  const normal = document.querySelector('input[name="spedRespArbeid"][value="Normal"]');
  const alle = document.querySelectorAll('input[name="spedRespArbeid"]');

  if (!normal) return;

  normal.addEventListener("change", () => {
    if (normal.checked) {
      alle.forEach(chk => {
        if (chk !== normal) chk.checked = false;
      });
    }

    lagRapport();
  });

  alle.forEach(chk => {
    if (chk === normal) return;

    chk.addEventListener("change", () => {
      if (chk.checked) {
        normal.checked = false;
      }

      lagRapport();
    });
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
  document.querySelectorAll(".spedRadio").forEach(r =>
    r.addEventListener("change", () => {
      updateSpedbarnUI();
      lagRapport();
    })
  );
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
        handleAirwayChange();
      }

      if (g === "acuteAirway") {
        updateAcuteAirwayDetails();
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
      chk.dataset.wasChecked = chk.checked ? "true" : "false";
    });

    cell.addEventListener("click", e => {
      e.preventDefault();

      const wasChecked = chk.dataset.wasChecked === "true";

      document.querySelectorAll(".trachOpt").forEach(o => {
        o.checked = false;
        o.dataset.wasChecked = "false";
      });

      if (!wasChecked) {
        chk.checked = true;
      }

      refreshTrachDeps();
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
function buildSpedRespArbeidLine() {
  if (getSpedbarnValue() !== "Ja") {
    return "";
  }

  const valgt = Array.from(
    document.querySelectorAll('input[name="spedRespArbeid"]:checked')
  ).map(x => x.value);

  if (!valgt.length) {
    return "";
  }

  return "Respirasjonsarbeid: " + valgt.join(", ");
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

bindPvkEvents();
bindCvkEvents();
bindUtstyrPumpeEvents();
bindAcutePumpeEvents();
bindAcuteSpontO2NumberOnly();
bindHighFlowNumberOnly();
bindMedicationNeiEvents();

  bindSpedbarnEvents();
  bindSpedRespArbeidEvents();
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

  $("copyBtn")?.addEventListener("click", kopierRapport);
  $("resetBtn")?.addEventListener("click", nullstillSkjema);

  document.addEventListener("input", () => {
    lagRapport();
  });

  document.addEventListener("change", () => {
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
function formatGcsValue(raw){if(!raw)return"";const match=raw.match(/^\s*(\d{1,2})\s*\+\s*(\d{1,2})\s*\+\s*(\d{1,2})\s*$/);if(match){const sum=Number(match[1])+Number(match[2])+Number(match[3]);return"GCS: "+match[1]+"+"+match[2]+"+"+match[3]+"="+sum}return"GCS: "+raw}
function lagRapport() {
  syncSpecMirrors();
  updateTitle();

  const h = getBinaryValue("hast");

  if (!h) {
    rapport.value = "";
    return;
  }

  const lines = [];

  addHeader(lines);
  addSpesialtransport(lines);
  addHastegrad(lines);

  const follow = buildFollowNeedLine();
if (follow) lines.push(follow);

  const sped = buildSpedbarnLine();
  if (sped) lines.push(sped);

  const respArbeid = buildSpedRespArbeidLine();
if (respArbeid) lines.push(respArbeid);

  if (getSpedbarnValue() === "Ja") {
    addTransportform(lines);
  }

  if (isAcute()) {
    buildAcuteReport(lines);
  } else {
    buildFullReport(lines);
  }

rapport.value = lines.join("\n");
autoGrowTextarea(rapport);
}
function addHeader(lines) {
  const transportVal = getBinaryValue("transport");

  lines.push(
    transportVal === "Kuvøse"
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
    getSpedbarnValue() !== "Ja"
  ) {
    lines.push(
      "Vekt: " +
      clean($("vekt").value) +
      " kg"
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

  if (
    clean($("vekt").value) &&
    getSpedbarnValue() !== "Ja"
  ) {
    lines.push(
      "Vekt: " +
      clean($("vekt").value) +
      " kg"
    );
  }

const airway = buildFullAirwayLine();

if (airway) {
  lines.push(airway);
}

const respArbeid = buildSpedRespArbeidLine();

if (respArbeid) {
  lines.push(respArbeid);
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

function kopierRapport() {
  navigator.clipboard.writeText(rapport.value);

  copyMsg.textContent = "Rapport kopiert";
  copyMsg.classList.add("show");

  clearTimeout(copyTimer);

  copyTimer = setTimeout(() => {
    copyMsg.classList.remove("show");
  }, 2000);
}

function nullstillSkjema() {

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

  valgtHastegrad = "";
  forrigeHastegrad = "";

  document
    .querySelectorAll(".hasteCard")
    
    .forEach(b => b.classList.remove("active"));

  updateMainVisibility();
  updateSpedbarnUI();
  updateCaveUI();
  updateHlrRespUI(); 
  updateSmitteSpes();
  handleAirwayChange();
  updateAcuteAirwayDetails();

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
  setHidden($("cvkWrap"), !$("til_cvk")?.checked);
  setHidden($("pvkWrap"), !$("til_pvk")?.checked);
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