/* ======================================================
   DOM ELEMENTER
====================================================== */
const $=id=>document.getElementById(id);
const pageTitle=$("pageTitle"),mainContent=$("mainContent"),acuteTop=$("acuteTop"),fullTop=$("fullTop"),acuteBottom=$("acuteBottom"),fullBottom=$("fullBottom"),transportWrap=$("transportWrap"),spedbarnExtraWrap=$("spedbarnExtraWrap"),rapport=$("rapport"),vektLabel=$("vektLabel"),copyMsg=$("copyMsg");
const spontO2Wrap=$("spontO2Wrap"),highFlowWrap=$("highFlowWrap"),nivWrap=$("nivWrap"),intubWrap=$("intubWrap"),trachWrap=$("trachWrap"),trO2=$("tr_o2"),trVent=$("tr_vent"),trachO2Wrap=$("trachO2Wrap"),trachVentWrap=$("trachVentWrap");
const acuteSpontO2Wrap=$("acuteSpontO2Wrap"),acuteHighFlowWrap=$("acuteHighFlowWrap"),acuteNivWrap=$("acuteNivWrap"),acuteIntubWrap=$("acuteIntubWrap"),acuteTrachWrap=$("acuteTrachWrap"),acuteTrachO2Wrap=$("acuteTrachO2Wrap"),acuteTrachVentWrap=$("acuteTrachVentWrap");
const caveTextWrap=$("caveTextWrap"),caveText=$("caveText"),smitteSpesWrap=$("smitteSpesWrap"),smitteSpes=$("smitteSpes");
const sedDynamicBody=$("sedDynamicBody"),pressorDynamicBody=$("pressorDynamicBody"),andreInfBody=$("andreInfBody"),tilgangerDynamicBody=$("tilgangerDynamicBody");
const pvkChk=$("til_pvk"),pvkAntall=$("pvkAntall"),utstPumperChk=$("utst_pumper"),acutePumperChk=$("acutePumperChk"),acutePumperAntall=$("acutePumperAntall");

let valgtHastegrad="",forrigeHastegrad="",copyTimer=null;

const hlrTextWrap = $("hlrTextWrap");
const hlrText = $("hlrText");
const respTextWrap = $("respTextWrap");
const respText = $("respText");
const spedRespArbeidWrap = $("spedRespArbeidWrap");

/* ======================================================
   GENERELLE HJELPEFUNKSJONER
====================================================== */
const clean=v=>(v??"").toString().trim();

function setHidden(el,hide){
  if(el)el.classList.toggle("hidden",!!hide)
}

function formatPhone(raw){
  const d=(raw||"").replace(/\D/g,"");
  return d.length===8
    ? d.slice(0,3)+" "+d.slice(3,5)+" "+d.slice(5)
    : raw
}

function getBinaryValue(group){
  if(group==="hast") return valgtHastegrad;

  const el=document.querySelector(
    '.binOpt[data-group="'+group+'"]:checked'
  );

  return el ? el.dataset.value : "";
}

function setBinaryValue(group,value){
  document
    .querySelectorAll('.binOpt[data-group="'+group+'"]')
    .forEach(el=>{
      el.checked = el.dataset.value===value;
    });
}

function getSpedbarnValue(){
  const el=document.querySelector(".spedRadio:checked");
  return el ? el.dataset.value : "";
}

function getCaveValue(){
  const el=document.querySelector(".caveRadio:checked");
  return el ? el.dataset.value : "";
}

function isAcute(){
  return valgtHastegrad==="Akutt"
}

function autoGrowTextarea(el){
  if(!el) return;

  el.style.height="auto";
  el.style.height=el.scrollHeight+"px";
}

function updateTitle(){
  pageTitle.textContent =
    getBinaryValue("transport")==="Kuvøse"
      ? "KUVØSETRANSPORT"
      : "Intensiv- og helikoptertransport";
}

/* ======================================================
   SPESIALTRANSPORT
====================================================== */
function syncSpecChoices(){

  const state = {};

  document.querySelectorAll(".specChoice").forEach(cb => {
    const rowVisible = !!cb.offsetParent;

    if (rowVisible) {
      state[cb.dataset.spec] = cb.checked;
    }
  });

  document.querySelectorAll(".specChoice").forEach(cb => {

    if (
      Object.prototype.hasOwnProperty.call(
        state,
        cb.dataset.spec
      )
    ) {
      cb.checked = !!state[cb.dataset.spec];
    }
  });
}

function setSpecChoice(specName, checked){

  document
    .querySelectorAll(
      '.specChoice[data-spec="' + specName + '"]'
    )
    .forEach(cb => {
      cb.checked = checked;
    });

  lagRapport();
}

function syncSpecMirrors(){
  syncSpecChoices();
}

/* ======================================================
   VITALPARAMETERE
====================================================== */
function calcMapFromSysDia(sysRaw,diaRaw){

  const sys=Number(clean(sysRaw));
  const dia=Number(clean(diaRaw));

  return (!sys||!dia)
    ? ""
    : String(Math.round((sys+2*dia)/3));
}

function updateMapField(){

  const mapEl=$("map");

  const auto=calcMapFromSysDia(
    $("btSys").value,
    $("btDia").value
  );

  if(auto){
    mapEl.value=auto;
    mapEl.dataset.auto="1";

  }else if(mapEl.dataset.auto==="1"){

    mapEl.value="";
    mapEl.dataset.auto="";
  }
}

function normalizeNumericField(el,maxDigits,maxValue){

  let raw=(el.value||"").replace(/\D/g,"");

  if(maxValue!=null && raw){

    const numeric=Number(raw);

    if(numeric>maxValue){
      raw=String(maxValue);
    }
  }

  if(raw.length>maxDigits){
    raw=raw.slice(0,maxDigits);
  }

  if(el.value!==raw){
    el.value=raw;
  }

  return raw;
}

function normalizeDecimalField(
  el,
  maxIntegerDigits,
  maxDecimals,
  decimalSep=','
){

  let v=el.value||'';
  const sep=decimalSep||',';

  v=v.replace('.',sep);

  v=v
    .split('')
    .filter((c,i,arr)=>
      /\d/.test(c) ||
      (c===sep && arr.indexOf(sep)===i)
    )
    .join('');

  const parts=v.split(sep);

  let intPart=parts[0]||'';
  let decPart=parts[1]||'';

  if(intPart.length>maxIntegerDigits){
    intPart=intPart.slice(0,maxIntegerDigits);
  }

  if(decPart.length>maxDecimals){
    decPart=decPart.slice(0,maxDecimals);
  }

  const out=(parts.length>1)
    ? intPart+sep+decPart
    : intPart;

  if(el.value!==out){
    el.value=out;
  }

  return {
    raw:out,
    int:intPart,
    dec:decPart
  };
}

function focusNextField(currentId){

  const next={
    rf:"spo2",
    spo2:"puls",
    puls:"btSys",
    btSys:"btDia",
    btDia:"map",
    map:"temp",
    temp:"gcs"
  }[currentId];

  const nextEl=next ? $(next) : null;

  if(nextEl){

    nextEl.focus();

    if(typeof nextEl.select==="function"){
      nextEl.select();
    }
  }
}

function handleVitalInput(evt){

  const id = evt.target.id;

  if(id === "rf"){
    normalizeNumericField(evt.target,3);

  }else if(id === "spo2"){
    normalizeNumericField(evt.target,3,100);

  }else if(id === "puls"){
    normalizeNumericField(evt.target,3);

  }else if(id === "btSys"){
    normalizeNumericField(evt.target,3);

  }else if(id === "btDia"){
    normalizeNumericField(evt.target,3);

  }else if(id === "map"){
    normalizeNumericField(evt.target,3);

  }else if(id === "temp"){
    normalizeDecimalField(evt.target,2,1,',');
  }
}

function handleVitalSpace(evt){

  if(evt.key!==" ") return;

  const id=evt.target.id;

  let digits=(evt.target.value||"").replace(/\D/g,"");

  if(id==="temp"){

    const r=(evt.target.value||"")
      .replace('.',',')
      .split(',');

    digits=r[0]||'';
  }

  const mins={
    rf:1,
    spo2:1,
    puls:1,
    btSys:1,
    btDia:1,
    map:1,
    temp:1
  }[id];

  if(mins==null || digits.length<mins){
    return;
  }

  evt.preventDefault();
  focusNextField(id);
}

function formatGcsValue(raw){
  if(!raw)return"";

  const match=raw.match(
    /^\s*(\d{1,2})\s*\+\s*(\d{1,2})\s*\+\s*(\d{1,2})\s*$/
  );

  if(match){
    const sum =
      Number(match[1])+
      Number(match[2])+
      Number(match[3]);

    return "GCS: "+
      match[1]+"+"+
      match[2]+"+"+
      match[3]+"="+sum;
  }

  return "GCS: "+raw;
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

function addDynamicTextRow(
  container,
  placeholder,
  checkboxClass,
  textClass
) {

  const row=document.createElement("div");

  row.className="dynamicRow";

  row.innerHTML=
    '<input type="checkbox" class="chk '+checkboxClass+'">' +
    '<input type="text" class="'+textClass+'" placeholder="'+placeholder+'">';

  container.appendChild(row);

  const chk=row.querySelector("."+checkboxClass);
  const txt=row.querySelector("."+textClass);

  txt.addEventListener("input",()=>{

    chk.checked=!!clean(txt.value);

    cleanupDynamicTextRows(
      container,
      textClass,
      checkboxClass
    );

    if(textClass==="sedText")ensureSedBlankRow();
    if(textClass==="pressorText")ensurePressorBlankRow();
    if(textClass==="andreInfText")ensureAndreInfBlankRow();

    lagRapport();
  });

  chk.addEventListener("change",lagRapport);
}

function ensureBlankByClass(textClass,addFn){

  const texts=Array.from(
    document.querySelectorAll("."+textClass)
  );

  if(!texts.length || !texts.some(t=>!clean(t.value))){
    addFn();
  }
}

/* ======================================================
   SEDASJON / PRESSOR / ANDRE MEDIKAMENTER
====================================================== */
function addSedRow(){

  addDynamicTextRow(
    sedDynamicBody,
    "Annet sedativ",
    "sedDynChk",
    "sedText"
  );
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
  );
}

function ensurePressorBlankRow(){
  ensureBlankByClass("pressorText",addPressorRow);
}

function resetPressorRows(){
  pressorDynamicBody.innerHTML="";
  addPressorRow();
}

function addAndreInfRow(){

  addDynamicTextRow(
    andreInfBody,
    "Annet medikament / infusjon",
    "andreInfChk",
    "andreInfText"
  );
}

function ensureAndreInfBlankRow(){
  ensureBlankByClass("andreInfText",addAndreInfRow);
}

function resetAndreInfRows(){
  andreInfBody.innerHTML="";
  addAndreInfRow();
}

/* ======================================================
   TILGANGER
====================================================== */
function addTilgangRow() {

  const row = document.createElement("div");

  row.className = "dynamicRow";

  row.innerHTML =
    '<input type="checkbox" class="chk tilgangDynChk">' +
    '<input type="text" class="tilgangText" placeholder="Annen tilgang">';

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

function ensureTilgangBlankRow(){

  const texts=Array.from(
    document.querySelectorAll(".tilgangText")
  );

  if(!texts.length || !texts.some(t=>!clean(t.value))){
    addTilgangRow();
  }
}

function resetTilgangRows(){
  tilgangerDynamicBody.innerHTML="";
  addTilgangRow();
}

/* ======================================================
   UTSTYR
====================================================== */
function addUtstyrRow() {

  const row = document.createElement("div");

  row.className = "dynamicRow";

  row.innerHTML =
    '<input type="checkbox" class="chk utstyrDynChk">' +
    '<input type="text" class="utstyrText" placeholder="Annet utstyr / presisering">';

  const body = $("utstyrDynamicBody");

  if (!body) return;

  body.appendChild(row);

  const chk = row.querySelector(".utstyrDynChk");
  const txt = row.querySelector(".utstyrText");

  txt.addEventListener("input", () => {

    chk.checked = !!clean(txt.value);

    cleanupDynamicTextRows(
      $("utstyrDynamicBody"),
      "utstyrText",
      "utstyrDynChk"
    );

    ensureUtstyrBlankRow();
    lagRapport();
  });

  chk.addEventListener("change", () => {

    cleanupDynamicTextRows(
      $("utstyrDynamicBody"),
      "utstyrText",
      "utstyrDynChk"
    );

    ensureUtstyrBlankRow();
    lagRapport();
  });
}

function ensureUtstyrBlankRow(){

  const texts = Array.from(
    document.querySelectorAll(".utstyrText")
  );

  if (!texts.length || !texts.some(t => !clean(t.value))) {
    addUtstyrRow();
  }
}

function resetUtstyrRows(){

  const body = $("utstyrDynamicBody");

  if (!body) return;

  body.innerHTML = "";
  addUtstyrRow();
}

/* ======================================================
   INNSAMLING AV DYNAMISKE TEKSTER
====================================================== */
function collectDynamicTexts(textSelector,checkSelector){

  const out=[];

  document.querySelectorAll(textSelector).forEach(txt=>{

    const row=txt.closest(".dynamicRow");
    const chk=row ? row.querySelector(checkSelector) : null;
    const val=clean(txt.value);

    if(chk && chk.checked && val){
      out.push(val);
    }
  });

  return out;
}

/* ======================================================
   UI OPPDATERING
====================================================== */
function updateSpedbarnUI() {

  const val = getSpedbarnValue();
  const erSpedbarn = val === "Ja";

  setHidden(spedbarnExtraWrap, !erSpedbarn);
  setHidden(spedRespArbeidWrap, !erSpedbarn);

  if (!erSpedbarn) {
    document
      .querySelectorAll('input[name="spedRespArbeid"]')
      .forEach(chk => {
        chk.checked = false;
      });
  }

  if (vektLabel) {
    vektLabel.textContent =
      erSpedbarn ? "Vekt (gram)" : "Vekt (kg)";
  }

  if ($("vekt")) {
    $("vekt").placeholder =
      erSpedbarn ? "gram" : "kg";
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

function updateHlrUI() {

  const val =
    document.querySelector('input[name="hlrStatus"]:checked')?.value;

  const show = val === "Nei";

  setHidden(hlrTextWrap, !show);

  if (!show && hlrText) {
    hlrText.value = "";
  }
}

function updateRespUI() {

  const val =
    document.querySelector('input[name="respStatus"]:checked')?.value;

  const show = val === "Nei";

  setHidden(respTextWrap, !show);

  if (!show && respText) {
    respText.value = "";
  }
}

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

function updateTilgangUI(){

  setHidden(
    $("cvkWrap"),
    !$("til_cvk")?.checked
  );

  setHidden(
    $("pvkWrap"),
    !$("til_pvk")?.checked
  );
}

/* ======================================================
   LUFTVEIER
====================================================== */
function refreshTrachDeps(){

  setHidden(trachO2Wrap,!trO2?.checked);
  setHidden(trachVentWrap,!trVent?.checked);

  if(!trO2?.checked){
    $("trachO2Liter").value="";
  }

  if(!trVent?.checked){
    [
      "trachVentFio2",
      "trachVentPeep",
      "trachVentTopp"
    ].forEach(id=>{
      $(id).value="";
    });
  }
}

function handleAirwayChange(){

  const v=getBinaryValue("airwayMain");

  [
    spontO2Wrap,
    highFlowWrap,
    nivWrap,
    intubWrap,
    trachWrap
  ].forEach(el=>setHidden(el,true));

  if(v==="Spontan med O2"){
    setHidden(spontO2Wrap,false);

  }else if(v==="Spontant med high flow"){
    setHidden(highFlowWrap,false);

  }else if(v==="NIV (CPAP/BiPAP)"){
    setHidden(nivWrap,false);

  }else if(v==="Intubert"){
    setHidden(intubWrap,false);

  }else if(v==="Trakeostomi"){
    setHidden(trachWrap,false);
  }

  refreshTrachDeps();
}

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

/* ======================================================
   SYNKRONISERING AKUTT / FULLT SKJEMA
====================================================== */
function copyVal(from,to){

  if(clean($(from).value) && !clean($(to).value)){
    $(to).value=$(from).value;
  }
}

function syncAcuteToFull(){

  copyVal("acuteHovedproblem","hovedproblem");

  const a=getBinaryValue("acuteAirway");

  if(a && !getBinaryValue("airwayMain")){
    setBinaryValue("airwayMain",a);
  }

  [
    ["acuteSpontO2Liter","spontO2Liter"],
    ["acuteHighFlowFio2","highFlowFio2"],
    ["acuteHighFlowFlow","highFlowFlow"],
    ["acuteNivFio2","nivFio2"],
    ["acuteIntubFio2","intubFio2"],
    ["acuteIntubPeep","intubPeep"],
    ["acuteIntubTopp","intubTopp"],
    ["acuteTrachO2Liter","trachO2Liter"],
    ["acuteTrachVentFio2","trachVentFio2"],
    ["acuteTrachVentPeep","trachVentPeep"],
    ["acuteTrachVentTopp","trachVentTopp"],
    ["acuteRekNavn","rekNavn"],
    ["acuteRekTlf","rekTlf"]
  ].forEach(x=>copyVal(...x));

  if($("acute_tr_spont").checked){
    $("tr_spont").checked=true;
  }

  if($("acute_tr_o2").checked){
    $("tr_o2").checked=true;
  }

  if($("acute_tr_vent").checked){
    $("tr_vent").checked=true;
  }
}

function syncFullToAcute(){

  copyVal("hovedproblem","acuteHovedproblem");

  const a=getBinaryValue("airwayMain");

  if(a && !getBinaryValue("acuteAirway")){
    setBinaryValue("acuteAirway",a);
  }

  [
    ["spontO2Liter","acuteSpontO2Liter"],
    ["highFlowFio2","acuteHighFlowFio2"],
    ["highFlowFlow","acuteHighFlowFlow"],
    ["nivFio2","acuteNivFio2"],
    ["intubFio2","acuteIntubFio2"],
    ["intubPeep","acuteIntubPeep"],
    ["intubTopp","acuteIntubTopp"],
    ["trachO2Liter","acuteTrachO2Liter"],
    ["trachVentFio2","acuteTrachVentFio2"],
    ["trachVentPeep","acuteTrachVentPeep"],
    ["trachVentTopp","acuteTrachVentTopp"],
    ["rekNavn","acuteRekNavn"],
    ["rekTlf","acuteRekTlf"]
  ].forEach(x=>copyVal(...x));

  if($("tr_spont").checked){
    $("acute_tr_spont").checked=true;
  }

  if($("tr_o2").checked){
    $("acute_tr_o2").checked=true;
  }

  if($("tr_vent").checked){
    $("acute_tr_vent").checked=true;
  }

  updateAcuteAirwayDetails();
}

function syncVisibleSharedFieldsBeforeSwitch(){

  if(forrigeHastegrad==="Akutt" && valgtHastegrad!=="Akutt"){
    syncAcuteToFull();

  }else if(forrigeHastegrad!=="Akutt" && valgtHastegrad==="Akutt"){
    syncFullToAcute();
  }
}

function updateMainVisibility(){

  const h=getBinaryValue("hast");

  setHidden(mainContent,!h);

  if(!h){
    rapport.value="";
    return;
  }

  const acute=isAcute();

  setHidden(acuteTop,!acute);
  setHidden(acuteBottom,!acute);
  setHidden(fullTop,acute);
  setHidden(fullBottom,acute);

  acute ? updateAcuteAirwayDetails() : handleAirwayChange();

  updateTitle();
}

/* ======================================================
   RAPPORTBYGGING - VITALIA
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

/* ======================================================
   RAPPORTBYGGING - LUFTVEIER FULLT SKJEMA
====================================================== */
function buildFullAirwayLine() {

  const main = getBinaryValue("airwayMain");

  if (!main) return "";

  if (main === "Spontan uten O2") {
    return "Luftveier: Spontan uten O2";
  }

  if (main === "Spontan med O2") {

    const l = clean($("spontO2Liter").value);

    return l
      ? "Luftveier: Spontan med O2 " + l + " l/min"
      : "Luftveier: Spontan med O2";
  }

  if (main === "Spontant med high flow") {

    const p = ["Luftveier: Spontant med high flow"];

    const f = clean($("highFlowFio2").value);
    const fl = clean($("highFlowFlow").value);

    if (f) p.push("FiO2 " + f);
    if (fl) p.push("flow " + fl + " l/min");

    return p.length > 1
      ? p[0] + "; " + p.slice(1).join(" og ")
      : p[0];
  }

  if (main === "NIV (CPAP/BiPAP)") {

    const p = ["Luftveier: NIV"];
    const f = clean($("nivFio2").value);

    if (f) p.push("FiO2 " + f + " %");

    return p.length > 1
      ? p[0] + "; " + p.slice(1).join(" og ")
      : p[0];
  }

  if (main === "Intubert") {

    const p = ["Luftveier: Intubert"];

    const f = clean($("intubFio2").value);
    const pe = clean($("intubPeep").value);
    const t = clean($("intubTopp").value);

    if (f) p.push("FiO2 " + f + " %");
    if (pe) p.push("PEEP " + pe);
    if (t) p.push("topptrykk " + t);

    return p.length > 1
      ? p[0] + "; " + p.slice(1).join(", ").replace(/,([^,]*)$/, " og$1")
      : p[0];
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

/* ======================================================
   RAPPORTBYGGING - LUFTVEIER AKUTT
====================================================== */
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
        ? "Luftveier: Spontan med O2, antall liter O2 " + l
        : "Luftveier: Spontan med O2"
    ];
  }

  if (airway === "Spontant med high flow") {

    const p = ["Luftveier: Spontant med high flow"];

    const f =
      clean($("acuteHighFlowFio2").value) ||
      clean($("highFlowFio2").value);

    const fl =
      clean($("acuteHighFlowFlow").value) ||
      clean($("highFlowFlow").value);

    if (f) p.push("Fio2 " + f);

    if (fl) {
      p.push("Flow " + fl + " liter/min");
    }

    return [p.join(", ")];
  }

  if (airway === "NIV (CPAP/BiPAP)") {

    const p = ["Luftveier: NIV"];

    const f =
      clean($("acuteNivFio2").value) ||
      clean($("nivFio2").value);

    if (f) p.push("Fio2 " + f);

    return [p.join(", ")];
  }

  if (airway === "Intubert") {

    const p = ["Luftveier: Intubert"];

    const f =
      clean($("acuteIntubFio2").value) ||
      clean($("intubFio2").value);

    const pe =
      clean($("acuteIntubPeep").value) ||
      clean($("intubPeep").value);

    const t =
      clean($("acuteIntubTopp").value) ||
      clean($("intubTopp").value);

    if (f) p.push("FiO2 " + f + " %");
    if (pe) p.push("PEEP " + pe);
    if (t) p.push("topptrykk " + t);

    return [
      p.length > 1
        ? p[0] + "; " + p.slice(1).join(", ").replace(/,([^,]*)$/, " og$1")
        : p[0]
    ];
  }

  if (airway === "Trakeostomi") {

    const sel = [];

    const valgtTrach =
      document.querySelector(".acuteTrachOpt:checked");

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

/* ======================================================
   RAPPORTBYGGING - SPEDBARN
====================================================== */
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

function addSpedRespArbeidSection(lines) {

  if (getSpedbarnValue() !== "Ja") return;

  const valg = Array.from(
    document.querySelectorAll('input[name="spedRespArbeid"]:checked')
  ).map(x => x.value);

  if (valg.length) {
    lines.push(
      "Respirasjonsarbeid: " + valg.join(", ")
    );
  }
}

/* ======================================================
   RAPPORTBYGGING - TILGANGER
====================================================== */
function linesTilganger() {

  const out = [];

  if ($("til_ingen")?.checked) {
    return ["Ingen tilganger"];
  }

  const cvkLumen = clean($("cvkLumen")?.value);

  if ($("til_cvk").checked) {
    out.push(cvkLumen ? "CVK - " + cvkLumen : "CVK");
  }

  const n = clean(pvkAntall.value);

  if (pvkChk.checked) {
    out.push(n ? "PVK -" + n + "stk" : "PVK");
  }

  out.push(
    ...collectDynamicTexts(".tilgangText", ".tilgangDynChk")
  );

  return out;
}

/* ======================================================
   RAPPORTBYGGING - UTSTYR
====================================================== */
function buildUtstyrList() {

  const out = [];

  if ($("utst_ingen")?.checked) {
    return ["Ingen utstyr"];
  }

  if ($("utst_arterie")?.checked) {
    out.push("Arteriekran");
  }

  if ($("dren_thorax")?.checked) {
    out.push("Thoraxdren");
  }

  if ($("utst_pumper")?.checked) {

    const antall = clean($("utstPumpeAntall")?.value);

    out.push(
      antall
        ? "Sprøytepumper - " + antall + " stk"
        : "Sprøytepumper"
    );
  }

  out.push(
    ...collectDynamicTexts(".utstyrText", ".utstyrDynChk")
  );

  return out;
}

/* ======================================================
   RAPPORTBYGGING - SMITTE / CAVE / HLR / RESP
====================================================== */
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

    return ["Smitte: Ikke kjent"];
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

function buildHlrLines() {

  const val =
    document.querySelector('input[name="hlrStatus"]:checked')?.value;

  const txt = clean(hlrText?.value);

  if (!val) return [];

  if (val === "Ja") {
    return ["HLR-status: Ja"];
  }

  return [
    "HLR-status: Nei" +
    (txt ? " (" + txt + ")" : "")
  ];
}

function buildRespLines() {

  const val =
    document.querySelector('input[name="respStatus"]:checked')?.value;

  const txt = clean(respText?.value);

  if (!val) return [];

  if (val === "Ja") {
    return ["Respiratorstatus: Ja"];
  }

  return [
    "Respiratorstatus: Nei" +
    (txt ? " (" + txt + ")" : "")
  ];
}

/* ======================================================
   RAPPORTBYGGING - MEDIKAMENTER
====================================================== */
function linesFixedMeds(selector){

  const out=[];

  document.querySelectorAll(selector).forEach(chk=>{

    if(chk.checked && chk.dataset.name){
      out.push(chk.dataset.name);
    }
  });

  return out;
}

function getMedicationData() {

  const medicationOther = Array.from(
    document.querySelectorAll('input[name="medicationOther"]:checked')
  ).map(chk => chk.value);

  const andreFritekst = collectDynamicTexts(
    ".andreInfText",
    ".andreInfChk"
  );

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
      ...medicationOther,
      ...andreFritekst
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

/* ======================================================
   RAPPORTBYGGING - HUD
====================================================== */
function addHudSection(lines){

  const hud = Array.from(
    document.querySelectorAll('input[name="hud"]:checked')
  ).map(x => x.value);

  if(hud.length){
    lines.push(
      "Hud: " + hud.join(", ")
    );
  }
}

/* ======================================================
   RAPPORTBYGGING - HOVEDRAPPORT
====================================================== */
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
  addFollowNeed(lines);

  buildCaveLines().forEach(l => lines.push(l));
  buildHlrLines().forEach(l => lines.push(l));
  buildRespLines().forEach(l => lines.push(l));
  buildSmitteLines().forEach(l => lines.push(l));

  const sped = buildSpedbarnLine();

  if (sped) {
    lines.push(sped);
  }

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
    lines.push(
      "Antall sprøytepumper: " +
      (clean(acutePumperAntall.value) || "ikke oppgitt")
    );
  }

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

  const vit = buildVitalsLine();

  if (vit) {
    lines.push(vit);
  }

  addHudSection(lines);

  const airway = buildFullAirwayLine();

  if (airway) {
    lines.push(airway);
  }

  addSpedRespArbeidSection(lines);

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

  addFullDoctors(lines);
}

/* ======================================================
   RAPPORTBYGGING - LEGER
====================================================== */
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

/* ======================================================
   KOPIER / NULLSTILL
====================================================== */
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
    .querySelectorAll(".hasteBtn")
    .forEach(b => b.classList.remove("active"));

  updateMainVisibility();
  updateSpedbarnUI();
  updateCaveUI();
  updateHlrUI();
  updateRespUI();
  updateSmitteSpes();
  handleAirwayChange();
  updateAcuteAirwayDetails();

  rapport.value = "";
}

/* ======================================================
   EVENT BINDING - HASTEGRAD
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

/* ======================================================
   EVENT BINDING - VITALIA
====================================================== */
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

function bindAutoGrowEvents() {

  document
    .querySelectorAll(".autoGrow")
    .forEach(el =>
      el.addEventListener("input", () =>
        autoGrowTextarea(el)
      )
    );
}

/* ======================================================
   EVENT BINDING - TILGANGER
====================================================== */
function bindPvkEvents() {

  pvkAntall.addEventListener("input", () => {

    pvkChk.checked = !!pvkAntall.value;

    updateTilgangUI();
    lagRapport();
  });

  pvkChk.addEventListener("change", () => {

    if (!pvkChk.checked) {
      pvkAntall.value = "";
    }

    updateTilgangUI();
    lagRapport();
  });
}

function bindCvkEvents() {

  $("cvkLumen")?.addEventListener("input", () => {

    $("til_cvk").checked = !!$("cvkLumen").value;

    updateTilgangUI();
    lagRapport();
  });

  $("til_cvk")?.addEventListener("change", () => {

    if (!$("til_cvk").checked) {
      $("cvkLumen").value = "";
    }

    updateTilgangUI();
    lagRapport();
  });
}

function bindTilgangerIngenEvents(){

  const ingen = $("til_ingen");

  if(!ingen) return;

  const andre = document.querySelectorAll(
    '.accessChipRow input[type="checkbox"]:not(#til_ingen)'
  );

  ingen.addEventListener("change", () => {

    if(ingen.checked){

      andre.forEach(chk => {
        chk.checked = false;
      });

      $("cvkLumen").value = "";
      $("pvkAntall").value = "";

      document.querySelectorAll(".tilgangDynChk").forEach(chk => {
        chk.checked = false;
      });

      document.querySelectorAll(".tilgangText").forEach(txt => {
        txt.value = "";
      });

      resetTilgangRows();
      updateTilgangUI();
    }

    lagRapport();
  });

  andre.forEach(chk => {

    chk.addEventListener("change", () => {

      if(chk.checked){
        ingen.checked = false;
      }
    });
  });

  tilgangerDynamicBody?.addEventListener("input", () => {

    if(clean(document.querySelector(".tilgangText")?.value)){
      ingen.checked = false;
    }
  });
}

/* ======================================================
   EVENT BINDING - UTSTYR
====================================================== */
function bindUtstyrPumpeEvents(){

  const chk = document.getElementById("utst_pumper");
  const sel = document.getElementById("utstPumpeAntall");

  if(!chk || !sel) return;

  function update(){

    sel.classList.toggle("hidden", !chk.checked);

    if(!chk.checked){
      sel.value = "";
    }
  }

  chk.addEventListener("change", () => {
    update();
    lagRapport();
  });

  sel.addEventListener("change", lagRapport);

  update();
}

function bindUtstyrIngenEvents(){

  const ingen = document.getElementById("utst_ingen");

  if(!ingen) return;

  const andre = document.querySelectorAll(
    '.utstyrChipRow input[type="checkbox"]:not(#utst_ingen)'
  );

  ingen.addEventListener("change", () => {

    if(ingen.checked){

      andre.forEach(chk => {
        chk.checked = false;
      });

      const sel = document.getElementById("utstPumpeAntall");

      if(sel){
        sel.value = "";
        sel.classList.add("hidden");
      }

      document.querySelectorAll(".utstyrDynChk").forEach(chk => {
        chk.checked = false;
      });

      document.querySelectorAll(".utstyrText").forEach(txt => {
        txt.value = "";
      });

      resetUtstyrRows();
    }

    lagRapport();
  });

  andre.forEach(chk => {

    chk.addEventListener("change", () => {

      if(chk.checked){
        ingen.checked = false;
      }
    });
  });

  $("utstyrDynamicBody")?.addEventListener("input", () => {

    if(clean(document.querySelector(".utstyrText")?.value)){
      ingen.checked = false;
    }
  });
}

function bindUtstyrChipEvents() {

  const pumper = $("utst_pumper");
  const pumperAntall = $("utstPumpeAntall");

  const utstyrFritekst = $("utstyrFritekst");
  const utstyrFritekstChk = $("utstyrFritekstChk");

  function updateUtstyrUI() {

    if (pumperAntall) {

      pumperAntall.classList.toggle(
        "hidden",
        !pumper?.checked
      );

      if (!pumper?.checked) {
        pumperAntall.value = "";
      }
    }

    lagRapport();
  }

  document
    .querySelectorAll(".utstyrChip input")
    .forEach(input => {
      input.addEventListener("change", updateUtstyrUI);
    });

  pumperAntall?.addEventListener("change", lagRapport);

  utstyrFritekst?.addEventListener("input", () => {

    if (utstyrFritekstChk) {
      utstyrFritekstChk.checked =
        !!clean(utstyrFritekst.value);
    }

    lagRapport();
  });

  utstyrFritekstChk?.addEventListener("change", () => {

    if (!utstyrFritekstChk.checked && utstyrFritekst) {
      utstyrFritekst.value = "";
    }

    lagRapport();
  });

  updateUtstyrUI();
}

/* ======================================================
   EVENT BINDING - LUFTVEIER
====================================================== */
function bindBinaryOptionEvents() {

  document.querySelectorAll(".binOpt").forEach(chk => {

    const label = chk.closest("label");

    if (!label) return;

    label.addEventListener("pointerdown", () => {
      chk.dataset.wasChecked =
        chk.checked ? "true" : "false";
    });

    label.addEventListener("click", e => {

      e.preventDefault();

      const g = chk.dataset.group;

      const wasChecked =
        chk.dataset.wasChecked === "true";

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

    const label = chk.closest("label");

    if (!label) return;

    label.addEventListener("pointerdown", () => {
      chk.dataset.wasChecked =
        chk.checked ? "true" : "false";
    });

    label.addEventListener("click", e => {

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
      lagRapport();
    });
  });
}

function bindAcuteTrachEvents() {

  document.querySelectorAll(".acuteTrachOpt").forEach(chk => {

    const label = chk.closest("label");

    if (!label) return;

    label.addEventListener("pointerdown", () => {
      chk.dataset.wasChecked =
        chk.checked ? "true" : "false";
    });

    label.addEventListener("click", e => {

      e.preventDefault();

      const wasChecked =
        chk.dataset.wasChecked === "true";

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

/* ======================================================
   EVENT BINDING - SPEDBARN
====================================================== */
function bindSpedbarnEvents() {

  document.querySelectorAll(".spedChip").forEach(label => {

    label.addEventListener("click", e => {

      e.preventDefault();

      const radio = label.querySelector(".spedRadio");

      if (!radio) return;

      document.querySelectorAll(".spedRadio").forEach(r => {
        r.checked = false;
      });

      radio.checked = true;

      updateSpedbarnUI();
      lagRapport();
    });
  });
}

function bindGestasjonsalderEvents() {

  const uker = document.getElementById("gestasjonsUker");
  const dager = document.getElementById("gestasjonsDager");

  if (!uker || !dager) return;

  uker.addEventListener("input", () => {

    uker.value =
      uker.value.replace(/\D/g, "").slice(0, 2);

    if (uker.value.length === 2) {
      dager.focus();
      dager.select?.();
    }

    lagRapport();
  });

  uker.addEventListener("keydown", e => {

    if (
      (e.key === " " || e.code === "Space") &&
      uker.value.length >= 1
    ) {
      e.preventDefault();
      dager.focus();
      dager.select?.();
    }
  });

  dager.addEventListener("input", () => {

    dager.value =
      dager.value.replace(/\D/g, "").slice(0, 1);

    lagRapport();
  });
}

function bindSpedRespArbeidEvents() {

  const checks =
    document.querySelectorAll('input[name="spedRespArbeid"]');

  checks.forEach(chk => {

    chk.addEventListener("change", () => {

      if (chk.value === "Normal" && chk.checked) {

        checks.forEach(other => {
          if (other !== chk) other.checked = false;
        });
      }

      if (chk.value !== "Normal" && chk.checked) {

        const normal =
          document.querySelector(
            'input[name="spedRespArbeid"][value="Normal"]'
          );

        if (normal) normal.checked = false;
      }

      lagRapport();
    });
  });
}

/* ======================================================
   EVENT BINDING - CAVE / HLR / RESP
====================================================== */
function bindCaveEvents() {

  document.querySelectorAll(".caveRadio").forEach(r =>
    r.addEventListener("change", () => {
      updateCaveUI();
      lagRapport();
    })
  );
}

function bindHlrEvents() {

  document.querySelectorAll(".hlrRadio").forEach(radio => {

    radio.addEventListener("change", () => {
      updateHlrUI();
      lagRapport();
    });
  });

  hlrText?.addEventListener("input", lagRapport);
}

function bindRespEvents() {

  document.querySelectorAll(".respRadio").forEach(radio => {

    radio.addEventListener("change", () => {
      updateRespUI();
      lagRapport();
    });
  });

  respText?.addEventListener("input", lagRapport);
}

/* ======================================================
   EVENT BINDING - SMITTE
====================================================== */
function bindSmitteEvents() {

  document.querySelectorAll(".smitteBase").forEach(radio => {

    const label = radio.closest(".smChip");

    if (!label) return;

    label.addEventListener("pointerdown", () => {
      radio.dataset.wasChecked =
        radio.checked ? "true" : "false";
    });

    label.addEventListener("click", e => {

      e.preventDefault();

      const wasChecked =
        radio.dataset.wasChecked === "true";

      document.querySelectorAll(".smitteBase").forEach(r => {
        r.checked = false;
        r.dataset.wasChecked = "false";
      });

      if (!wasChecked) {
        radio.checked = true;
      }

      updateSmitteSpes();
      lagRapport();
    });
  });

  $("sm_blod").addEventListener("change", () => {
    updateSmitteSpes();
    lagRapport();
  });
}

/* ======================================================
   EVENT BINDING - FØLGEBEHOV
====================================================== */
function addFollowNeed(lines) {

  const follow = Array.from(
    document.querySelectorAll(
      'input[name="followNeed"]:checked'
    )
  ).map(x => x.value);

  if (follow.length) {

    lines.push(
      "Følgebehov: " + follow.join(", ")
    );
  }
}

function bindFollowNeedNoneEvents() {

  const none = $("follow_none");

  const followChoices = document.querySelectorAll(
    'input[name="followNeed"]:not(#follow_none)'
  );

  if (!none) return;

  none.closest("label")?.addEventListener("click", e => {

    e.preventDefault();

    none.checked = !none.checked;

    if (none.checked) {

      followChoices.forEach(chk => {
        chk.checked = false;
      });
    }

    lagRapport();
  });

  followChoices.forEach(chk => {

    chk.closest("label")?.addEventListener("click", e => {

      e.preventDefault();

      chk.checked = !chk.checked;

      if (chk.checked) {
        none.checked = false;
      }

      lagRapport();
    });
  });
}

/* ======================================================
   EVENT BINDING - SEDASJON / PRESSOR
====================================================== */
function bindSedasjonNeiEvents() {

  const nei = $("sed_nei");

  const sedChoices =
    document.querySelectorAll(".sed:not(#sed_nei)");

  if (!nei) return;

  nei.closest("label")?.addEventListener("click", e => {

    e.preventDefault();

    nei.checked = !nei.checked;

    if (nei.checked) {

      sedChoices.forEach(chk => {
        chk.checked = false;
      });
    }

    lagRapport();
  });

  sedChoices.forEach(chk => {

    chk.closest("label")?.addEventListener("click", () => {

      if (chk.checked) {
        nei.checked = false;
      }
    });
  });
}

function bindPressorNeiEvents() {

  const nei = $("pre_nei");

  const pressorChoices = document.querySelectorAll(
    '.pre:not(#pre_nei)'
  );

  if (!nei) return;

  nei.closest("label")?.addEventListener("click", e => {

    e.preventDefault();

    nei.checked = !nei.checked;

    if (nei.checked) {

      pressorChoices.forEach(chk => {
        chk.checked = false;
      });
    }

    lagRapport();
  });

  pressorChoices.forEach(chk => {

    chk.closest("label")?.addEventListener("click", () => {

      if (chk.checked) {
        nei.checked = false;
      }
    });
  });
}

/* ======================================================
   EVENT BINDING - ANDRE MEDIKAMENTER
====================================================== */
function bindAndreMedNeiEvents() {

  const nei = $("andre_nei");

  if (!nei) return;

  nei.closest("label")?.addEventListener("click", e => {

    e.preventDefault();

    nei.checked = !nei.checked;

    if (nei.checked) {

      document.querySelectorAll(".andreInfChk").forEach(chk => {
        chk.checked = false;
      });

      document.querySelectorAll(".andreInfText").forEach(txt => {
        txt.value = "";
      });
    }

    ensureAndreInfBlankRow();
    lagRapport();
  });

  andreInfBody?.addEventListener("input", () => {

    if(clean(document.querySelector(".andreInfText")?.value)){
      nei.checked = false;
    }
  });
}

function bindMedicationOtherEvents() {

  const checks =
    document.querySelectorAll('input[name="medicationOther"]');

  checks.forEach(chk => {

    chk.addEventListener("change", () => {

      if (chk.value === "Nei" && chk.checked) {

        checks.forEach(other => {
          if (other !== chk) other.checked = false;
        });
      }

      if (chk.value !== "Nei" && chk.checked) {

        const nei =
          document.querySelector(
            'input[name="medicationOther"][value="Nei"]'
          );

        if (nei) nei.checked = false;
      }

      lagRapport();
    });
  });

  $("andreMedikamenterText")?.addEventListener(
    "input",
    lagRapport
  );
}

/* ======================================================
   EVENT BINDING - TOGGLECELL / SPESIALTRANSPORT
====================================================== */
function bindToggleEvents() {

  document.addEventListener("change", e => {

    if (!e.target.classList.contains("specChoice")) return;

    e.stopPropagation();

    const specName = e.target.dataset.spec;
    const checked = e.target.checked;

    document
      .querySelectorAll(
        '.specChoice[data-spec="' + specName + '"]'
      )
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

document.addEventListener("click", e => {

  const cell = e.target.closest(".specialGroup .specCell");

  if (!cell) return;

  e.preventDefault();
  e.stopPropagation();

  const input = cell.querySelector("input");

  if (!input) return;

  input.checked = !input.checked;
  cell.classList.toggle("active", input.checked);

  lagRapport();

}, true);

/* ======================================================
   EVENT BINDING - SAMLET
====================================================== */
function bindEvents() {

  bindHastegradEvents(); 
  bindFollowNeedNoneEvents();

  bindAutoGrowEvents();
  bindVitalEvents();

  bindPvkEvents();
  bindCvkEvents();
  bindTilgangerIngenEvents();

  bindUtstyrPumpeEvents();
  bindUtstyrIngenEvents();
  bindUtstyrChipEvents();

  bindSedasjonNeiEvents();
  bindPressorNeiEvents();
  bindMedicationOtherEvents();

  bindAcutePumpeEvents();

  bindSpedbarnEvents();
  bindGestasjonsalderEvents();
  bindSpedRespArbeidEvents();

  bindCaveEvents();
  bindHlrEvents();
  bindRespEvents();
  bindSmitteEvents();

  bindBinaryOptionEvents();
  bindTrachEvents();
  bindAcuteTrachEvents();
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
   EVENT BINDING - AKUTT SPRØYTEPUMPER
====================================================== */
function bindAcutePumpeEvents() {

  acutePumperAntall.addEventListener("input", () => {

    acutePumperChk.checked = !!acutePumperAntall.value;
    lagRapport();
  });

  acutePumperChk.addEventListener("change", () => {

    if (!acutePumperChk.checked) {
      acutePumperAntall.value = "";
    }

    lagRapport();
  });
}

/* ======================================================
   INIT
====================================================== */
function init() {

  resetSedRows();
  resetPressorRows();
  resetAndreInfRows();
  resetTilgangRows();
  resetUtstyrRows();

  bindEvents();

  updateSpedbarnUI();
  updateCaveUI();
  updateHlrUI();
  updateRespUI();
  updateSmitteSpes();

  handleAirwayChange();
  updateAcuteAirwayDetails();

  updateMapField();
  syncSpecMirrors();
  updateMainVisibility();
  updateTitle();
  updateTilgangUI();

  document
    .querySelectorAll(".autoGrow")
    .forEach(autoGrowTextarea);

  lagRapport();
}

init();
