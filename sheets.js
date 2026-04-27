```javascript
// =====================================================
// Houcihu 雲端同步 sheets.js 修正版（Apps Script 相容）
// 修復：checkin.html 無法送出
// Google Sheets + Apps Script
// =====================================================

const WEB_APP_URL =
"https://script.google.com/macros/s/AKfycbzS19HoxvnQDDPVmO4ZG9FLZaKy9JaFREA7z_OaiXxZ-bcae185QatC16VJM0IZGNjG/exec";

// =====================================================
// 系統設定
// =====================================================
const SYNC_INTERVAL = 5000;
const RETRY_LIMIT = 3;

// =====================================================
// 預設資料
// =====================================================
const DEFAULT_DATA = {
  version: 1,
  updatedAt: Date.now(),

  counter: 1,
  current: "A000",

  caps: {
    1: 50,
    3: 50,
    5: 50,
    7: 50
  },

  open: {
    1: true,
    3: true,
    5: true,
    7: true
  },

  used: {
    1: 0,
    3: 0,
    5: 0,
    7: 0
  },

  queue: []
};

// =====================================================
// 工具
// =====================================================
function sleep(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
}

function deepClone(obj){
  return JSON.parse(JSON.stringify(obj));
}

// =====================================================
// 讀取雲端資料
// =====================================================
async function cloudGet(retry = 0){

  try{

    const response = await fetch(
      WEB_APP_URL + "?t=" + Date.now(),
      {
        method:"GET",
        cache:"no-store"
      }
    );

    if(!response.ok){
      throw new Error("讀取失敗");
    }

    const data = await response.json();

    if(!data || typeof data !== "object"){
      throw new Error("資料格式錯誤");
    }

    return data;

  }catch(error){

    console.log("cloudGet error:", error);

    if(retry < RETRY_LIMIT){
      await sleep(1000);
      return await cloudGet(retry + 1);
    }

    return null;
  }
}

// =====================================================
// 儲存雲端資料（改成 Apps Script 最穩格式）
// =====================================================
async function cloudSave(data, retry = 0){

  try{

    data.updatedAt = Date.now();
    data.version = (data.version || 1) + 1;

    const response = await fetch(WEB_APP_URL, {
      method:"POST",
      headers:{
        "Content-Type":
        "application/x-www-form-urlencoded"
      },
      body:new URLSearchParams({
        data: JSON.stringify(data)
      })
    });

    if(!response.ok){
      throw new Error("儲存失敗");
    }

    return true;

  }catch(error){

    console.log("cloudSave error:", error);

    if(retry < RETRY_LIMIT){
      await sleep(1000);
      return await cloudSave(data, retry + 1);
    }

    return false;
  }
}

// =====================================================
// 局部更新
// =====================================================
async function cloudPatch(callback){

  const current = await cloudGet();

  if(!current) return false;

  const newData = deepClone(current);

  callback(newData);

  return await cloudSave(newData);
}

// =====================================================
// 自動同步
// =====================================================
let syncTimer = null;
let lastVersion = 0;

function autoSync(callback, interval = SYNC_INTERVAL){

  if(syncTimer) clearInterval(syncTimer);

  syncTimer = setInterval(async()=>{

    const data = await cloudGet();

    if(!data) return;

    if(data.version !== lastVersion){

      lastVersion = data.version;

      if(callback) callback(data);
    }

  }, interval);
}

// =====================================================
// 初始化
// =====================================================
async function initCloud(){

  let data = await cloudGet();

  if(!data){

    await cloudSave(DEFAULT_DATA);
    data = DEFAULT_DATA;
  }

  lastVersion = data.version || 1;

  return data;
}

// =====================================================
// 號碼產生
// =====================================================
function makeNumber(counter){
  return "A" + String(counter).padStart(3,"0");
}

// =====================================================
// 新增候補
// =====================================================
async function addQueue(name, people, slot){

  return await cloudPatch(data=>{

    const number =
      makeNumber(data.counter);

    data.queue.push({
      number:number,
      name:name,
      people:people,
      slot:slot,
      status:"waiting",
      time:new Date().toLocaleTimeString()
    });

    data.counter++;

  });
}

// =====================================================
// 下一號叫號
// =====================================================
async function callNext(){

  return await cloudPatch(data=>{

    const next =
      data.queue.find(
        item => item.status === "waiting"
      );

    if(!next) return;

    next.status = "called";
    data.current = next.number;

  });
}

// =====================================================
// 到場
// =====================================================
async function doneNumber(number){

  return await cloudPatch(data=>{

    const row =
      data.queue.find(
        item => item.number === number
      );

    if(row) row.status = "done";

  });
}

// =====================================================
// 取消
// =====================================================
async function cancelNumber(number){

  return await cloudPatch(data=>{

    const row =
      data.queue.find(
        item => item.number === number
      );

    if(row) row.status = "cancel";

  });
}

// =====================================================
// 清空
// =====================================================
async function clearQueue(){

  return await cloudPatch(data=>{

    data.queue = [];
    data.current = "A000";
    data.counter = 1;

    data.used = {
      1:0,
      3:0,
      5:0,
      7:0
    };

  });
}

// =====================================================
// 手動刷新
// =====================================================
async function refreshNow(callback){

  const data = await cloudGet();

  if(data && callback){
    callback(data);
  }
}
```
