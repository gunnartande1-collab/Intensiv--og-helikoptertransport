/* ======================================================
   DOM ELEMENTER
====================================================== */
const $=id=>document.getElementById(id);
const pageTitle=$("pageTitle"),mainContent=$("mainContent"),acuteTop=$("acuteTop"),fullTop=$("fullTop"),acuteBottom=$("acuteBottom"),fullBottom=$("fullBottom"),transportWrap=$("transportWrap"),spedbarnExtraWrap=$("spedbarnExtraWrap"),rapport=$("rapport"),vektLabel=$("vektLabel"),copyMsg=$("copyMsg");
const spontO2Wrap=$("spontO2Wrap"),highFlowWrap=$("highFlowWrap"),nivWrap=$("nivWrap"),intubWrap=$("intubWrap"),trachWrap=$("trachWrap"),trO2=$("tr_o2"),trVent=$("tr_vent"),trachO2Wrap=$("trachO2Wrap"),trachVentWrap=$("trachVentWrap");
const acuteSpontO2Wrap=$("acuteSpontO2Wrap"),acuteHighFlowWrap=$("acuteHighFlowWrap"),acuteNivWrap=$("acuteNivWrap"),acuteIntubWrap=$("acuteIntubWrap"),acuteTrachWrap=$("acuteTrachWrap"),acuteTrachO2Wrap=$("acuteTrachO2Wrap"),acuteTrachVentWrap=$("acuteTrachVentWrap");
const caveTextWrap=$("caveTextWrap"),caveText=$("caveText"),smitteSpesWrap=$("smitteSpesWrap"),smitteSpes=$("smitteSpes");
const sedDynamicBody=$("sedDynamicBody"),pressorDynamicBody=$("pressorDynamicBody"),andreInfBody=$("andreInfBody"),tilgangerDynamicBody=$("tilgangerDynamicBody"),drenAnnetContainer=$("dren_annet_container");
const pvkChk=$("til_pvk"),pvkAntall=$("pvkAntall"),utstPumperChk=$("utst_pumper"),utstPumperAntall=$("utstPumperAntall"),acutePumperChk=$("acutePumperChk"),acutePumperAntall=$("acutePumperAntall");
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
function updateTitle(){pageTitle.textContent=getBinaryValue("transport")==="Kuvøse"?"KUVØSETRANSPORT":"INTENSIVTRANSPORT"}
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

  if ($("til_cvk").checked) {
    out.push("CVK");
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

function buildFullAirwayLine() {
  const main = getBinaryValue("airwayMain");

  if (!main) return "";

  if (main === "Spontan uten O₂") {
    return "Luftveier: Spontan uten O₂";
  }

  if (main === "Spontan med O₂") {
    const l = clean($("spontO2Liter").value);

    return l
      ? "Luftveier: Spontan med O₂, antall liter O₂ " + l
      : "Luftveier: Spontan med O₂";
  }

  if (main === "Spontant med high flow") {
    const p = ["Luftveier: Spontant med high flow"];
    const f = clean($("highFlowFio2").value);
    const fl = clean($("highFlowFlow").value);

    if (f) p.push("Fio2 " + f);
    if (fl) p.push("Flow " + fl + " liter/min");

    return p.join(", ");
  }

  if (main === "NIV (CPAP/BiPAP)") {
    const p = ["Luftveier: NIV"];
    const f = clean($("nivFio2").value);

    if (f) p.push("Fio2 " + f);

    return p.join(", ");
  }

  if (main === "Intubert") {
    const p = ["Luftveier: Intubert"];
    const f = clean($("intubFio2").value);
    const pe = clean($("intubPeep").value);
    const t = clean($("intubTopp").value);

    if (f) p.push("Fio2 " + f);
    if (pe) p.push("Peep " + pe);
    if (t) p.push("Topptrykk med peep " + t);

    return p.join(", ");
  }

  if (main === "Trakeostomi") {
    const p = ["Luftveier: Trakeostomi"];
    const sel = [];

    document.querySelectorAll(".trachOpt").forEach(cb => {
      if (cb.checked) {
        sel.push(cb.dataset.name);
      }
    });

    if (sel.length) p.push(sel.join(", "));

    const l = clean($("trachO2Liter").value);
    const f = clean($("trachVentFio2").value);
    const pe = clean($("trachVentPeep").value);
    const t = clean($("trachVentTopp").value);

    if (l) p.push("Antall liter O₂ " + l);
    if (f) p.push("Fio2 " + f);
    if (pe) p.push("Peep " + pe);
    if (t) p.push("Topptrykk med peep " + t);

    return p.join(", ");
  }

  return "";
}
function buildAcuteAirwayLines() {

  const airway = getBinaryValue("acuteAirway");

  if (!airway) {
    return [];
  }

  if (airway === "Spontan uten O₂") {
    return ["Luftveier: Spontan uten O₂"];
  }

  if (airway === "Spontan med O₂") {

    const l =
      clean($("acuteSpontO2Liter").value) ||
      clean($("spontO2Liter").value);

    return [
      l
        ? "Luftveier: Spontan med O₂, antall liter O₂ " + l
        : "Luftveier: Spontan med O₂"
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

    if (f) p.push("Fio2 " + f);
    if (pe) p.push("Peep " + pe);
    if (t) p.push("Topptrykk med peep " + t);

    return [p.join(", ")];
  }

  if (airway === "Trakeostomi") {

    const p = ["Luftveier: Trakeostomi"];
    const sel = [];

    document
      .querySelectorAll(".acuteTrachOpt,.trachOpt")
      .forEach(cb => {

        if (
          cb.checked &&
          !sel.includes(cb.dataset.name)
        ) {
          sel.push(cb.dataset.name);
        }
      });

    if (sel.length) {
      p.push(sel.join(", "));
    }

    const l =
      clean($("acuteTrachO2Liter").value) ||
      clean($("trachO2Liter").value);

    const f =
      clean($("acuteTrachVentFio2").value) ||
      clean($("trachVentFio2").value);

    const pe =
      clean($("acuteTrachVentPeep").value) ||
      clean($("trachVentPeep").value);

    const t =
      clean($("acuteTrachVentTopp").value) ||
      clean($("trachVentTopp").value);

    if (l) p.push("Antall liter O₂ " + l);
    if (f) p.push("Fio2 " + f);
    if (pe) p.push("Peep " + pe);
    if (t) p.push("Topptrykk med peep " + t);

    return [p.join(", ")];
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
        ? "Infusjonspumper -" + n + "stk"
        : "Infusjonspumper"
    );
  }

  if ($("utst_arterie").checked) {
    out.push("Arteriekran");
  }

  if ($("dren_thorax").checked) {
    out.push("Thoraxdren");
  }

  if ($("dren_vent").checked) {
    out.push("Ventrikkelsonde");
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
/* ======================================================
   UI OPPDATERING
====================================================== */
function updateSpedbarnUI(){const val=getSpedbarnValue();setHidden(spedbarnExtraWrap,val!=="Ja");setHidden(transportWrap,val!=="Ja");vektLabel.textContent=val==="Ja"?"Vekt (gram)":"Vekt (kg)";updateTitle()}
function updateCaveUI(){const val=getCaveValue();setHidden(caveTextWrap,val!=="Ja");if(val!=="Ja")caveText.value=""}
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
function handleVitalInput(evt){const id=evt.target.id;if(id==="rf"){const digits=normalizeNumericField(evt.target,3);if(digits.length>=3)focusNextField(id)}else if(id==="spo2"){const digits=normalizeNumericField(evt.target,3,100);if(digits.length>=3)focusNextField(id)}else if(id==="puls"){const digits=normalizeNumericField(evt.target,3);if(digits.length>=3)focusNextField(id)}else if(id==="btSys"){const digits=normalizeNumericField(evt.target,3);if(digits.length>=3)focusNextField(id)}else if(id==="btDia"){const digits=normalizeNumericField(evt.target,3);if(digits.length>=3)focusNextField(id)}else if(id==="map"){const digits=normalizeNumericField(evt.target,3);if(digits.length>=3)focusNextField(id)}else if(id==="temp"){const r=normalizeDecimalField(evt.target,2,1,','); // allow xx,x
  // advance only when a decimal digit is present (e.g., 36,5)
  if(r.dec.length>=1)focusNextField(id)}}
function handleVitalSpace(evt){if(evt.key!==" ")return;const id=evt.target.id;let digits=(evt.target.value||"").replace(/\D/g,"");if(id==="temp"){const r=(evt.target.value||"").replace('.',',').split(',');digits=r[0]||''}const mins={rf:1,spo2:1,puls:1,btSys:1,btDia:1,map:1,temp:1}[id];if(mins==null||digits.length<mins)return;evt.preventDefault();focusNextField(id)}
function updateSmitteSpes(){const base=document.querySelector(".smitteBase:checked"),blod=$("sm_blod");const show=!!(base&&base.dataset.name!=="Ingen kjente")||blod.checked;setHidden(smitteSpesWrap,!show);if(!show)smitteSpes.value=""}
function refreshTrachDeps(){setHidden(trachO2Wrap,!trO2?.checked);setHidden(trachVentWrap,!trVent?.checked);if(!trO2?.checked)$("trachO2Liter").value="";if(!trVent?.checked)["trachVentFio2","trachVentPeep","trachVentTopp"].forEach(id=>$(id).value="")}
function handleAirwayChange(){const v=getBinaryValue("airwayMain");[spontO2Wrap,highFlowWrap,nivWrap,intubWrap,trachWrap].forEach(el=>setHidden(el,true));if(v==="Spontan med O₂")setHidden(spontO2Wrap,false);else if(v==="Spontant med high flow")setHidden(highFlowWrap,false);else if(v==="NIV (CPAP/BiPAP)")setHidden(nivWrap,false);else if(v==="Intubert")setHidden(intubWrap,false);else if(v==="Trakeostomi")setHidden(trachWrap,false);refreshTrachDeps()}
function updateAcuteAirwayDetails(){const a=getBinaryValue("acuteAirway");[acuteSpontO2Wrap,acuteHighFlowWrap,acuteNivWrap,acuteIntubWrap,acuteTrachWrap,acuteTrachO2Wrap,acuteTrachVentWrap].forEach(el=>setHidden(el,true));if(a==="Spontan med O₂"&&(clean($("acuteSpontO2Liter").value)||clean($("spontO2Liter").value)))setHidden(acuteSpontO2Wrap,false);if(a==="Spontant med high flow"&&(clean($("acuteHighFlowFio2").value)||clean($("acuteHighFlowFlow").value)||clean($("highFlowFio2").value)||clean($("highFlowFlow").value)))setHidden(acuteHighFlowWrap,false);if(a==="NIV (CPAP/BiPAP)"&&(clean($("acuteNivFio2").value)||clean($("nivFio2").value)))setHidden(acuteNivWrap,false);if(a==="Intubert"&&(clean($("acuteIntubFio2").value)||clean($("acuteIntubPeep").value)||clean($("acuteIntubTopp").value)||clean($("intubFio2").value)||clean($("intubPeep").value)||clean($("intubTopp").value)))setHidden(acuteIntubWrap,false);if(a==="Trakeostomi"){setHidden(acuteTrachWrap,false);if($("acute_tr_o2").checked||$("tr_o2").checked||clean($("acuteTrachO2Liter").value)||clean($("trachO2Liter").value))setHidden(acuteTrachO2Wrap,false);if($("acute_tr_vent").checked||$("tr_vent").checked||clean($("acuteTrachVentFio2").value)||clean($("acuteTrachVentPeep").value)||clean($("acuteTrachVentTopp").value)||clean($("trachVentFio2").value)||clean($("trachVentPeep").value)||clean($("trachVentTopp").value))setHidden(acuteTrachVentWrap,false)}}
function copyVal(from,to){if(clean($(from).value)&&!clean($(to).value))$(to).value=$(from).value}
function syncAcuteToFull(){copyVal("acuteHovedproblem","hovedproblem");const a=getBinaryValue("acuteAirway");if(a&&!getBinaryValue("airwayMain"))setBinaryValue("airwayMain",a);[["acuteSpontO2Liter","spontO2Liter"],["acuteHighFlowFio2","highFlowFio2"],["acuteHighFlowFlow","highFlowFlow"],["acuteNivFio2","nivFio2"],["acuteIntubFio2","intubFio2"],["acuteIntubPeep","intubPeep"],["acuteIntubTopp","intubTopp"],["acuteTrachO2Liter","trachO2Liter"],["acuteTrachVentFio2","trachVentFio2"],["acuteTrachVentPeep","trachVentPeep"],["acuteTrachVentTopp","trachVentTopp"],["acuteRekNavn","rekNavn"],["acuteRekTlf","rekTlf"]].forEach(x=>copyVal(...x));if($("acute_tr_spont").checked)$("tr_spont").checked=true;if($("acute_tr_o2").checked)$("tr_o2").checked=true;if($("acute_tr_vent").checked)$("tr_vent").checked=true;if(clean(acutePumperAntall.value)&&!clean(utstPumperAntall.value)){utstPumperAntall.value=acutePumperAntall.value;utstPumperChk.checked=true}}
function syncFullToAcute(){copyVal("hovedproblem","acuteHovedproblem");const a=getBinaryValue("airwayMain");if(a&&!getBinaryValue("acuteAirway"))setBinaryValue("acuteAirway",a);[["spontO2Liter","acuteSpontO2Liter"],["highFlowFio2","acuteHighFlowFio2"],["highFlowFlow","acuteHighFlowFlow"],["nivFio2","acuteNivFio2"],["intubFio2","acuteIntubFio2"],["intubPeep","acuteIntubPeep"],["intubTopp","acuteIntubTopp"],["trachO2Liter","acuteTrachO2Liter"],["trachVentFio2","acuteTrachVentFio2"],["trachVentPeep","acuteTrachVentPeep"],["trachVentTopp","acuteTrachVentTopp"],["rekNavn","acuteRekNavn"],["rekTlf","acuteRekTlf"]].forEach(x=>copyVal(...x));if($("tr_spont").checked)$("acute_tr_spont").checked=true;if($("tr_o2").checked)$("acute_tr_o2").checked=true;if($("tr_vent").checked)$("acute_tr_vent").checked=true;if(clean(utstPumperAntall.value)&&!clean(acutePumperAntall.value)){acutePumperAntall.value=utstPumperAntall.value;acutePumperChk.checked=true}updateAcuteAirwayDetails()}
function syncVisibleSharedFieldsBeforeSwitch(){if(forrigeHastegrad==="Akutt"&&valgtHastegrad!=="Akutt")syncAcuteToFull();else if(forrigeHastegrad!=="Akutt"&&valgtHastegrad==="Akutt")syncFullToAcute()}
function updateMainVisibility(){const h=getBinaryValue("hast");setHidden(mainContent,!h);if(!h){rapport.value="";return}const acute=isAcute();setHidden(acuteTop,!acute);setHidden(acuteBottom,!acute);setHidden(fullTop,acute);setHidden(fullBottom,acute);acute?updateAcuteAirwayDetails():handleAirwayChange();updateTitle()}
/* ======================================================
   EVENT BINDING
====================================================== */
function bindHastegradEvents() {

  document
    .querySelectorAll(".hasteBtn")
    .forEach(btn =>
      btn.addEventListener("click", () => {

        forrigeHastegrad = valgtHastegrad;
        valgtHastegrad = btn.dataset.haste;

        syncVisibleSharedFieldsBeforeSwitch();

        document
          .querySelectorAll(".hasteBtn")
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

  pvkAntall.addEventListener("change", () => {
    pvkChk.checked = !!pvkAntall.value;
    lagRapport();
  });

  pvkChk.addEventListener("change", () => {

    if (!pvkChk.checked) {
      pvkAntall.value = "";
    }

    lagRapport();
  });
}

function bindUtstyrPumpeEvents() {

  utstPumperAntall.addEventListener("change", () => {
    utstPumperChk.checked = !!utstPumperAntall.value;
    lagRapport();
  });

  utstPumperChk.addEventListener("change", () => {

    if (!utstPumperChk.checked) {
      utstPumperAntall.value = "";
    }

    lagRapport();
  });
}

function bindAcutePumpeEvents() {

  acutePumperAntall.addEventListener("change", () => {
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

if (master) {
  if (master.type === "radio") {
    master.checked = true;
  } else {
    master.checked = !master.checked;
  }

  if (master.classList.contains("trachOpt")) {
    refreshTrachDeps();
  }

  if (master.classList.contains("acuteTrachOpt")) {
    updateAcuteAirwayDetails();
  }

  lagRapport();
    }
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

  document
    .querySelectorAll(".caveRadio")
    .forEach(r =>
      r.addEventListener("change", () => {

        updateCaveUI();
        lagRapport();
      })
    );
}

function bindBinaryOptionEvents() {

  document
    .querySelectorAll(".binOpt")
    .forEach(chk =>

      chk.addEventListener("change", () => {

        const g = chk.dataset.group;

        if (chk.checked) {

          document
            .querySelectorAll('.binOpt[data-group="' + g + '"]')
            .forEach(o => {

              if (o !== chk) {
                o.checked = false;
              }
            });
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
      })
    );
}

function bindTrachEvents() {

  document
    .querySelectorAll(".trachOpt")
    .forEach(cb =>
      cb.addEventListener("change", () => {

        refreshTrachDeps();
        lagRapport();
      })
    );
}

function bindAcuteTrachEvents() {

  document
    .querySelectorAll(".acuteTrachOpt")
    .forEach(cb =>
      cb.addEventListener("change", () => {

        updateAcuteAirwayDetails();
        lagRapport();
      })
    );
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


function bindEvents() {

  bindHastegradEvents();
  bindAutoGrowEvents();
  bindVitalEvents();

  bindPvkEvents();
  bindUtstyrPumpeEvents();
  bindAcutePumpeEvents();

  bindSpedbarnEvents();
  bindCaveEvents();
  bindSmitteEvents();

  bindBinaryOptionEvents();

  bindTrachEvents();
  bindAcuteTrachEvents();

  bindAcuteAirwayInputEvents();
  bindToggleEvents();
}

/* ======================================================
   DYNAMISKE FELTER
====================================================== */
function cleanupDynamicTextRows(container,textClass,checkboxClass){
  const rows=Array.from(container.querySelectorAll(".dynamicRow"));
  const blanks=rows.filter(row=>{
    const txt=row.querySelector("."+textClass);
    const chk=row.querySelector("."+checkboxClass);
    const val=clean(txt?.value);
    return !val && (!chk || !chk.checked);
  });
  if(blanks.length<=1) return;
  blanks.slice(0,-1).forEach(row=>row.remove());
}
function addDynamicTextRow(container,placeholder,checkboxClass,textClass){
  const row=document.createElement("div");
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
function addSedRow(){addDynamicTextRow(sedDynamicBody,"Sedativ","sedDynChk","sedText")}function ensureSedBlankRow(){ensureBlankByClass("sedText",addSedRow)}function resetSedRows(){sedDynamicBody.innerHTML="";addSedRow()}
function addPressorRow(){addDynamicTextRow(pressorDynamicBody,"Pressor","pressorDynChk","pressorText")}function ensurePressorBlankRow(){ensureBlankByClass("pressorText",addPressorRow)}function resetPressorRows(){pressorDynamicBody.innerHTML="";addPressorRow()}
function addAndreInfRow(){addDynamicTextRow(andreInfBody,"Medikament/infusjon","andreInfChk","andreInfText")}function ensureAndreInfBlankRow(){ensureBlankByClass("andreInfText",addAndreInfRow)}function resetAndreInfRows(){andreInfBody.innerHTML="";addAndreInfRow();addAndreInfRow()}
function addTilgangRow(){const row=document.createElement("tr");row.innerHTML='<td><div class="dynamicRow"><input type="checkbox" class="chk tilgangDynChk"><input type="text" class="tilgangText" placeholder="Annen tilgang"></div></td>';tilgangerDynamicBody.appendChild(row);const chk=row.querySelector(".tilgangDynChk"),txt=row.querySelector(".tilgangText");txt.addEventListener("input",()=>{chk.checked=!!clean(txt.value);ensureTilgangBlankRow();lagRapport()});chk.addEventListener("change",lagRapport)}
function ensureTilgangBlankRow(){const texts=Array.from(document.querySelectorAll(".tilgangText"));if(!texts.length||!texts.some(t=>!clean(t.value)))addTilgangRow()}
function resetTilgangRows(){tilgangerDynamicBody.innerHTML="";addTilgangRow()}
function addDrenAnnetField(){const row=document.createElement("div");row.className="dynamicRow";row.innerHTML='<input type="checkbox" class="chk drenAnnetChk"><input type="text" class="drenAnnetText" placeholder="Beskriv utstyr">';const cb=row.querySelector(".drenAnnetChk"),txt=row.querySelector(".drenAnnetText");txt.addEventListener("input",()=>{cb.checked=!!clean(txt.value);ensureDrenAnnetBlankField();lagRapport()});cb.addEventListener("change",lagRapport);drenAnnetContainer.appendChild(row)}
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

  const sped = buildSpedbarnLine();
  if (sped) lines.push(sped);

  if (getSpedbarnValue() === "Ja") {
    addTransportform(lines);
  }

  if (isAcute()) {
    buildAcuteReport(lines);
  } else {
    buildFullReport(lines);
  }

  rapport.value = lines.join("\n");
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

    andre: collectDynamicTexts(
      ".andreInfText",
      ".andreInfChk"
    )
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

  buildAcuteAirwayLines().forEach(l => {
    lines.push(l);
  });

  addMedicationSections(lines);

  if (acutePumperChk.checked) {
    lines.push(
      "Antall infusjonspumper: " +
      (clean(acutePumperAntall.value) || "ikke oppgitt")
    );
  }

  buildCaveLines().forEach(l => lines.push(l));
  buildSmitteLines().forEach(l => lines.push(l));

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

  const airway = buildFullAirwayLine();

  if (airway) {
    lines.push(airway);
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

  buildCaveLines().forEach(l => lines.push(l));
  buildSmitteLines().forEach(l => lines.push(l));

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
function init() {

  bindEvents();

  resetSedRows();
  resetPressorRows();
  resetAndreInfRows();
  resetTilgangRows();
  resetDrenAnnetFields();

  updateSpedbarnUI();
  updateCaveUI();
  updateSmitteSpes();

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