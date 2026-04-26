// script.js
// 後慈湖候補系統 v2

const STORAGE_KEY = "houcihu_waitlist_v2";

let state = {
  current: "A000",
  queue: [],
  missed: [],
  finished: [],
  counter: 1
};

// 初始化
loadData();
render();

// ======================
// 基本功能
// ======================

function loadData() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) state = JSON.parse(data);
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function formatNo(num) {
  return "A" + String(num).padStart(3, "0");
}

// ======================
// 新增候補
// ======================

function addGuest() {
  const name = document.getElementById("guestName")?.value.trim() || "現場旅客";
  const count = parseInt(document.getElementById("guestCount")?.value || "1");
  const phone = document.getElementById("guestPhone")?.value.trim() || "";

  const item = {
    no: formatNo(state.counter),
    name,
    count,
    phone,
    status: "等待中",
    time: new Date().toLocaleTimeString("zh-TW")
  };

  state.queue.push(item);
  state.counter++;

  clearForm();
  saveData();

  alert(`已新增候補：${item.no}`);
}

function clearForm() {
  if (document.getElementById("guestName"))
    document.getElementById("guestName").value = "";

  if (document.getElementById("guestCount"))
    document.getElementById("guestCount").value = 1;

  if (document.getElementById("guestPhone"))
    document.getElementById("guestPhone").value = "";
}

// ======================
// 叫號流程
// ======================

function callNext() {
  if (state.queue.length === 0) {
    alert("目前無候補名單");
    return;
  }

  const next = state.queue[0];
  next.status = "叫號中";
  state.current = next.no;

  saveData();
}

function markMissed() {
  if (state.queue.length === 0) return;

  const item = state.queue.shift();
  item.status = "過號";
  state.missed.push(item);

  if (state.queue.length > 0) {
    state.current = state.queue[0].no;
    state.queue[0].status = "叫號中";
  }

  saveData();
}

function markDone() {
  if (state.queue.length === 0) return;

  const item = state.queue.shift();
  item.status = "已入園";
  state.finished.push(item);

  if (state.queue.length > 0) {
    state.current = state.queue[0].no;
    state.queue[0].status = "叫號中";
  }

  saveData();
}

// ======================
// 清空資料
// ======================

function resetToday() {
  const ok = confirm("確定清空今日全部資料？");
  if (!ok) return;

  state = {
    current: "A000",
    queue: [],
    missed: [],
    finished: [],
    counter: 1
  };

  saveData();
}

// ======================
// 匯出資料
// ======================

function exportData() {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "houcihu_waitlist.json";
  a.click();
}

// ======================
// 畫面更新
// ======================

function render() {

  // admin / screen 共用
  setText("currentNo", state.current);
  setText("waitingCount", state.queue.length);

  // screen next no
  if (document.getElementById("nextNo")) {
    const next = state.queue[0]?.no || "---";
    setText("nextNo", next);
  }

  // 過號名單
  if (document.getElementById("missedList")) {
    if (state.missed.length === 0) {
      setText("missedList", "無");
    } else {
      document.getElementById("missedList").innerHTML =
        state.missed.map(x => x.no).join(" 、 ");
    }
  }

  // admin table
  const table = document.getElementById("queueTable");
  if (table) {
    if (state.queue.length === 0) {
      table.innerHTML = `<tr><td colspan="4">尚無資料</td></tr>`;
    } else {
      table.innerHTML = state.queue.map(item => `
        <tr>
          <td>${item.no}</td>
          <td>${item.name}</td>
          <td>${item.count}</td>
          <td>${item.status}</td>
        </tr>
      `).join("");
    }
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// 每3秒同步更新（多分頁）
window.addEventListener("storage", loadAndRender);
setInterval(loadAndRender, 3000);

function loadAndRender() {
  loadData();
  render();
}