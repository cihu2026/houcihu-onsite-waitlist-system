// sheets.js
// 後慈湖候補系統 v2
// GitHub Pages + Google Sheet 正式版

const WEB_APP_URL =
"https://script.google.com/macros/s/AKfycbzS19HoxvnQDDPVmO4ZG9FLZaKy9JaFREA7z_OaiXxZ-bcae185QatC16VJM0IZGNjG/exec";

// =====================================
// 雲端同步：上傳資料
// =====================================

async function syncToSheets(state) {
  try {
    await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(state),
      headers: {
        "Content-Type": "application/json"
      }
    });

    console.log("同步成功");

  } catch (error) {
    console.error("同步失敗", error);
  }
}

// =====================================
// 雲端同步：抓資料
// =====================================

async function loadFromSheets() {
  try {
    const res = await fetch(WEB_APP_URL);
    const data = await res.json();

    if (data) {
      state = data;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(state)
      );
      render();
    }

  } catch (error) {
    console.error("讀取失敗", error);
  }
}

// =====================================
// 接管 saveData()
// =====================================

if (typeof saveData === "function") {

  const oldSave = saveData;

  saveData = function () {
    oldSave();
    syncToSheets(state);
  };
}

// =====================================
// 啟動
// =====================================

window.addEventListener("load", () => {

  loadFromSheets();

  // 每5秒更新一次
  setInterval(loadFromSheets, 5000);

});