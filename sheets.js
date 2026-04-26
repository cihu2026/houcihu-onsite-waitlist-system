// Houcihu 雲端同步 sheets.js 完整穩定版

const WEB_APP_URL =
"https://script.google.com/macros/s/AKfycbzS19HoxvnQDDPVmO4ZG9FLZaKy9JaFREA7z_OaiXxZ-bcae185QatC16VJM0IZGNjG/exec";

/* =========================
   讀取雲端資料
========================= */
async function cloudGet() {
  try {
    const response = await fetch(WEB_APP_URL + "?t=" + Date.now(), {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("讀取失敗");
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.log("cloudGet error:", error);
    return null;
  }
}

/* =========================
   儲存雲端資料
========================= */
async function cloudSave(data) {
  try {
    const response = await fetch(WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    return true;

  } catch (error) {
    console.log("cloudSave error:", error);
    return false;
  }
}

/* =========================
   自動同步（每5秒）
========================= */
function autoSync(callback) {
  setInterval(async () => {
    const data = await cloudGet();
    if (data && callback) {
      callback(data);
    }
  }, 5000);
}

/* =========================
   初始化資料（第一次沒資料時）
========================= */
const DEFAULT_DATA = {
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

/* =========================
   雲端初始化
========================= */
async function initCloud() {
  let data = await cloudGet();

  if (!data) {
    await cloudSave(DEFAULT_DATA);
    data = DEFAULT_DATA;
  }

  return data;
}