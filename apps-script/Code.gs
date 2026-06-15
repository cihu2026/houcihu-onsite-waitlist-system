// ========================================
// 後慈湖 Apps Script v14.3 Privacy Guard 正式營運版
// Designed & Developed by Abby Luo
// 候補名單 + 梯次管理 + 公開頁去識別 + 後台金鑰 + 防重複 + 備份 + Log
// ========================================

const SHEET_ID = "10mz5p9sLFPshiw8Fj9PwAqABK8f1a9en9rJkBMJNVBI";

const MAIN_SHEET    = "waitlist";
const SESSION_SHEET = "sessions";
const BACKUP_SHEET  = "backup";
const LOG_SHEET     = "log";

// 後台金鑰請到 Apps Script：專案設定 → 指令碼屬性，新增 ADMIN_KEY。
// 不建議把正式密碼寫在公開 GitHub 或前端 HTML 裡。
function adminKey_(){
  return String(PropertiesService.getScriptProperties().getProperty("ADMIN_KEY") || "").trim();
}

function isAdmin_(e){
  const key = String((e && e.parameter && e.parameter.key) || "").trim();
  const saved = adminKey_();
  return saved !== "" && key !== "" && key === saved;
}

function ss(){
  return SpreadsheetApp.openById(SHEET_ID);
}

function json(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function todayKey(){
  return Utilities.formatDate(new Date(), "Asia/Taipei", "yyyyMMdd");
}

function nowText(){
  return Utilities.formatDate(new Date(), "Asia/Taipei", "yyyy/MM/dd HH:mm:ss");
}

function getSheet(name, headers){
  let sh = ss().getSheetByName(name);
  if(!sh){
    sh = ss().insertSheet(name);
    if(headers && headers.length) sh.appendRow(headers);
  }
  return sh;
}

function getMainSheet(){
  const sh = getSheet(MAIN_SHEET, ["號碼","姓名","電話","人數","梯次","狀態","時間","日期鍵"]);
  const headers = sh.getRange(1,1,1,8).getValues()[0];
  const required = ["號碼","姓名","電話","人數","梯次","狀態","時間","日期鍵"];
  let changed = false;
  for(let i=0;i<required.length;i++){
    if(String(headers[i] || "") !== required[i]){
      sh.getRange(1,i+1).setValue(required[i]);
      changed = true;
    }
  }
  if(changed) writeLog("HEADER", "waitlist header repaired");
  return sh;
}

function getSessionSheet(){
  const sh = getSheet(SESSION_SHEET, ["梯次","開放","名額"]);
  if(sh.getLastRow() === 1){
    for(let i=1;i<=8;i++) sh.appendRow([i,true,50]);
  }
  return sh;
}

function getBackupSheet(){
  return getSheet(BACKUP_SHEET, ["備份時間","資料"]);
}

function getLogSheet(){
  return getSheet(LOG_SHEET, ["時間","動作","內容"]);
}

function writeLog(action, msg){
  getLogSheet().appendRow([nowText(), action, msg]);
}

function normalizeStatus_(value){
  const s = String(value || "waiting").trim().toLowerCase();
  return ["waiting","called","done","cancel"].indexOf(s) >= 0 ? s : "waiting";
}

function getQueueRows_(){
  return getMainSheet().getDataRange().getValues();
}

function getSessionsRows_(){
  return getSessionSheet().getDataRange().getValues();
}

// 公開資訊：只回傳號碼、等待組數、梯次名額；不回傳姓名、電話。
function publicStatus(){
  const rows = getQueueRows_();
  const sessions = getSessionsRows_();
  let currentNo = "A000";
  let waitingCount = 0;
  for(let i=1;i<rows.length;i++){
    const status = normalizeStatus_(rows[i][5]);
    if(status === "waiting") waitingCount++;
    if(status === "called") currentNo = String(rows[i][0] || "A000");
  }
  return json({
    success:true,
    ok:true,
    currentNo:currentNo,
    waitingCount:waitingCount,
    sessions:sessions,
    updatedAt:nowText()
  });
}

function unauthorized_(){
  return json({success:false, ok:false, message:"unauthorized"});
}

function doGet(e){
  const mode = String((e.parameter.mode || "public")).toLowerCase();

  if(mode === "public") return publicStatus();
  if(mode === "sessions") return json(getSessionsRows_());

  if(mode === "queue"){
    if(!isAdmin_(e)) return unauthorized_();
    return json(getQueueRows_());
  }

  if(mode === "log"){
    if(!isAdmin_(e)) return unauthorized_();
    return json(getLogSheet().getDataRange().getValues());
  }

  return publicStatus();
}

function doPost(e){
  const action = String((e.parameter.action || "")).toLowerCase();

  if(action === "public") return publicStatus();
  if(action === "add") return addQueue(e);

  if(["update","clear","savesession","backup"].indexOf(action) >= 0 && !isAdmin_(e)){
    return unauthorized_();
  }

  if(action === "update") return updateStatus(e);
  if(action === "clear") return clearQueue();
  if(action === "savesession") return saveSession(e);
  if(action === "backup") return backupNow();

  return json({success:false, message:"unknown action"});
}

function addQueue(e){
  const lock = LockService.getScriptLock();
  lock.waitLock(8000);
  try{
    const sh = getMainSheet();
    const name = String(e.parameter.name || "").trim();
    const phone = String(e.parameter.phone || "").replace(/\D/g, "").trim();
    const people = Number(e.parameter.people || 1);
    const slot = String(e.parameter.slot || "").trim();

    if(name === "") return json({success:false, message:"name required"});
    if(!/^09\d{8}$/.test(phone)) return json({success:false, message:"phone invalid"});
    if(!Number.isFinite(people) || people <= 0 || people >= 10) return json({success:false, message:"people invalid"});
    if(slot === "") return json({success:false, message:"slot required"});

    const rows = sh.getDataRange().getValues();
    const key = todayKey();

    for(let i=1;i<rows.length;i++){
      if(String(rows[i][2]) === phone && String(rows[i][7]) === key && normalizeStatus_(rows[i][5]) !== "cancel"){
        return json({success:false, message:"today duplicate"});
      }
    }

    let maxNo = 0;
    for(let i=1;i<rows.length;i++){
      const n = Number(String(rows[i][0] || "").replace(/[^0-9]/g, ""));
      if(n > maxNo) maxNo = n;
    }
    const number = "A" + String(maxNo + 1).padStart(3,"0");

    sh.appendRow([number, name, phone, people, slot, "waiting", nowText(), key]);
    writeLog("ADD", number + " " + name);
    return json({success:true, ok:true, number:number});
  }catch(err){
    writeLog("ERROR", "ADD " + err.message);
    return json({success:false, message:err.message});
  }finally{
    try{ lock.releaseLock(); }catch(_){ }
  }
}

function updateStatus(e){
  const row = Number(e.parameter.row);
  const status = normalizeStatus_(e.parameter.status || "waiting");
  if(row >= 2){
    getMainSheet().getRange(row,6).setValue(status);
    writeLog("STATUS", "row " + row + " => " + status);
  }
  return json({success:true, ok:true});
}

function clearQueue(){
  backupNow();
  const sh = getMainSheet();
  const last = sh.getLastRow();
  if(last > 1) sh.deleteRows(2, last-1);
  writeLog("CLEAR", "queue reset");
  return json({success:true, ok:true});
}

function backupNow(){
  const data = getMainSheet().getDataRange().getValues();
  getBackupSheet().appendRow([nowText(), JSON.stringify(data)]);
  writeLog("BACKUP", "saved");
  return json({success:true, ok:true});
}

function saveSession(e){
  const no = Number(e.parameter.no);
  const open = String(e.parameter.open).toLowerCase() === "true";
  const cap = Math.max(0, Number(e.parameter.cap || 0));
  const sh = getSessionSheet();
  const rows = sh.getDataRange().getValues();
  let targetRow = 0;

  for(let i=1;i<rows.length;i++){
    if(Number(rows[i][0]) === no){ targetRow = i + 1; break; }
  }

  if(targetRow === 0){
    sh.appendRow([no, open, cap]);
  }else{
    sh.getRange(targetRow,1,1,3).setValues([[no, open, cap]]);
  }

  writeLog("SESSION", "第" + no + "梯 名額:" + cap);
  return json({success:true, ok:true});
}

function autoDailyReset(){
  clearQueue();
}
