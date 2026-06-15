/*
Houcihu Onsite Waitlist System
Admin operation helpers v14 Field Pro
Designed & Developed by Abby Luo
*/

let systemBusy = false;
let latestRows = [];
let latestSessions = [];
let lastCalledNo = "A000";

function $(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parsePeople(value) {
  const n = parseInt(String(value ?? "1").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parseSlot(raw) {
  const text = String(raw || "");
  const [slotText = "", flexText = ""] = text.split("｜");
  const match = slotText.match(/\d+/);
  return {
    slotNo: match ? Number(match[0]) : 0,
    slotText: slotText || "未指定",
    flexible: flexText.includes("接受其他梯次"),
    flexText: flexText || "未填寫"
  };
}

function statusText(status) {
  const s = normalizeStatus(status);
  if (s === "called") return "已叫號";
  if (s === "done") return "已到場";
  if (s === "cancel") return "取消";
  return "等待中";
}

function statusBadge(status) {
  const s = normalizeStatus(status);
  return `<span class="badge ${s}">${statusText(s)}</span>`;
}

function setBusy(value, text = "處理中...") {
  systemBusy = value;
  document.querySelectorAll("button[data-lock='true']").forEach(button => {
    button.disabled = value;
    if (value) {
      button.dataset.originalText = button.innerText;
      button.innerText = text;
    } else if (button.dataset.originalText) {
      button.innerText = button.dataset.originalText;
      delete button.dataset.originalText;
    }
  });
}

function toast(message, type = "dark") {
  let box = $("toastBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "toastBox";
    box.className = "toast";
    document.body.appendChild(box);
  }
  box.textContent = message;
  box.style.background = type === "danger" ? "#cf2f2f" : type === "ok" ? "#155f34" : "#172617";
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 2200);
}

async function runSafe(fn, message = "處理中...") {
  if (systemBusy) return;
  setBusy(true, message);
  try {
    await fn();
  } catch (error) {
    console.error("執行失敗：", error);
    toast("系統忙碌或連線不穩，請稍後再試", "danger");
  } finally {
    setBusy(false);
  }
}

function findLastCalled(rows) {
  let current = "A000";
  for (let i = rows.length - 1; i >= 1; i--) {
    if (normalizeStatus(rows[i][5]) === "called") {
      current = rows[i][0] || "A000";
      break;
    }
  }
  return current;
}

function getQueueStats(rows) {
  const stats = { total: 0, waiting: 0, called: 0, done: 0, cancel: 0 };
  for (let i = 1; i < rows.length; i++) {
    const s = normalizeStatus(rows[i][5]);
    stats.total++;
    if (s === "waiting") stats.waiting++;
    if (s === "called") stats.called++;
    if (s === "done") stats.done++;
    if (s === "cancel") stats.cancel++;
  }
  return stats;
}

function renderKpis(stats) {
  if ($("kpiTotal")) $("kpiTotal").innerText = stats.total;
  if ($("kpiWaiting")) $("kpiWaiting").innerText = stats.waiting;
  if ($("kpiCalled")) $("kpiCalled").innerText = stats.called;
  if ($("kpiDone")) $("kpiDone").innerText = stats.done;
  if ($("kpiCancel")) $("kpiCancel").innerText = stats.cancel;
}

function renderCurrentNo(no) {
  document.querySelectorAll("#currentNo,#mobileCurrentNo").forEach(el => {
    if (el.innerText !== no) {
      el.classList.remove("flash");
      void el.offsetWidth;
      el.classList.add("flash");
    }
    el.innerText = no;
  });
  lastCalledNo = no;
}

function renderTable(rows) {
  const tbody = $("tbody");
  if (!tbody) return;

  if (!rows || rows.length <= 1) {
    tbody.innerHTML = "<tr><td colspan='8'>目前無候補資料</td></tr>";
    return;
  }

  const query = ($("searchBox")?.value || "").trim().toLowerCase();
  let html = "";

  for (let i = 1; i < rows.length; i++) {
    const rowNo = i + 1;
    const no = rows[i][0] || "";
    const name = rows[i][1] || "";
    const phone = rows[i][2] || "";
    const people = rows[i][3] || "1";
    const slot = rows[i][4] || "-";
    const status = normalizeStatus(rows[i][5]);
    const rowText = `${no} ${name} ${phone} ${people} ${slot} ${statusText(status)}`.toLowerCase();
    if (query && !rowText.includes(query)) continue;

    html += `
      <tr>
        <td>${rowNo}</td>
        <td><b>${escapeHtml(no)}</b></td>
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(phone)}</td>
        <td>${escapeHtml(people)}</td>
        <td>${escapeHtml(slot)}</td>
        <td>${statusBadge(status)}</td>
        <td>
          <div class="row-actions">
            <button class="smallbtn blue" onclick="markCalled(${rowNo})">叫號</button>
            <button class="smallbtn" onclick="doneGuest(${rowNo})">到場</button>
            <button class="smallbtn red" onclick="cancelGuest(${rowNo})">取消</button>
          </div>
        </td>
      </tr>`;
  }

  tbody.innerHTML = html || "<tr><td colspan='8'>查無符合資料</td></tr>";
}

function renderMobileList(rows) {
  const box = $("listBox");
  if (!box) return;

  if (!rows || rows.length <= 1) {
    box.innerHTML = "<div class='muted'>目前無候補名單</div>";
    return;
  }

  let html = "";
  for (let i = 1; i < rows.length; i++) {
    const status = normalizeStatus(rows[i][5]);
    if (!["waiting", "called"].includes(status)) continue;

    const rowNo = i + 1;
    const no = rows[i][0] || "";
    const name = rows[i][1] || "";
    const people = rows[i][3] || "1";
    const slot = rows[i][4] || "";

    html += `
      <div class="list-item">
        <div>
          <div class="list-no">${escapeHtml(no)}</div>
          <div class="list-meta">${escapeHtml(name)}・${escapeHtml(people)}人</div>
          <div class="list-meta">${escapeHtml(slot)}</div>
          ${statusBadge(status)}
        </div>
        <div class="row-actions">
          <button class="smallbtn blue" onclick="markCalled(${rowNo})">叫號</button>
          <button class="smallbtn" onclick="doneGuest(${rowNo})">到場</button>
          <button class="smallbtn red" onclick="cancelGuest(${rowNo})">取消</button>
        </div>
      </div>`;
  }

  box.innerHTML = html || "<div class='muted'>目前無等待中名單</div>";
}

function renderSessionCards(sessions) {
  const grid = $("sessionGrid");
  if (!grid) return;

  if (!sessions || sessions.length <= 1) {
    grid.innerHTML = "<div class='muted'>尚無梯次資料</div>";
    return;
  }

  let html = "";
  for (let i = 1; i < sessions.length; i++) {
    const no = sessions[i][0];
    const open = isOpenFlag(sessions[i][1]);
    const cap = Number(sessions[i][2] || 0);
    let text = "未開放";
    let cls = "grayText";
    if (open && cap <= 0) { text = "額滿候補"; cls = "redText"; }
    else if (open && cap <= 3) { text = `剩 ${cap} 位`; cls = "orangeText"; }
    else if (open) { text = `可遞補 ${cap} 位`; cls = "greenText"; }

    html += `
      <div class="slot-card">
        <h3>第 ${escapeHtml(no)} 梯</h3>
        <div class="state ${cls}">${text}</div>
        <button class="smallbtn block" onclick="autoFill(${Number(no)})">此梯補位</button>
      </div>`;
  }
  grid.innerHTML = html;
}

function renderSessionTable(sessions) {
  const body = $("sessionBody");
  if (!body) return;

  let html = "";
  for (let i = 1; i < sessions.length; i++) {
    const no = sessions[i][0];
    const open = isOpenFlag(sessions[i][1]);
    const cap = Number(sessions[i][2] || 0);
    html += `
      <tr>
        <td>第 ${escapeHtml(no)} 梯</td>
        <td>${open ? "<span class='badge open'>開放</span>" : "<span class='badge closed'>未開放</span>"}</td>
        <td><b>${cap}</b></td>
        <td><button class="smallbtn" onclick="autoFill(${Number(no)})">補位</button></td>
      </tr>`;
  }
  body.innerHTML = html || "<tr><td colspan='4'>尚無梯次資料</td></tr>";
}

async function reduceCap(slotNo, people = 1) {
  if (!slotNo) return;
  const sessions = latestSessions.length ? latestSessions : await getSessions();
  const count = parsePeople(people);

  for (let i = 1; i < sessions.length; i++) {
    const no = Number(sessions[i][0]);
    if (no !== Number(slotNo)) continue;
    const open = sessions[i][1];
    const cap = Math.max(0, Number(sessions[i][2] || 0) - count);
    await saveSession(no, open, cap);
    break;
  }
}

function voiceCall(no = lastCalledNo) {
  try {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(`${no}號旅客，請至服務櫃台`);
    msg.lang = "zh-TW";
    msg.rate = .92;
    speechSynthesis.speak(msg);
  } catch (error) {
    console.warn("語音叫號失敗：", error);
  }
}

async function loadAdmin() {
  const [rows, sessions] = await Promise.all([cloudGet(), getSessions()]);
  latestRows = rows;
  latestSessions = sessions;

  const current = findLastCalled(rows);
  const stats = getQueueStats(rows);
  renderCurrentNo(current);
  renderKpis(stats);
  renderTable(rows);
  renderMobileList(rows);
  renderSessionCards(sessions);
  renderSessionTable(sessions);

  if ($("syncTime")) $("syncTime").innerText = `最後同步 ${formatLocalTime()}`;
}

async function markCalled(rowNo) {
  await runSafe(async () => {
    const row = latestRows[rowNo - 1];
    const no = row?.[0] || "A000";
    const people = parsePeople(row?.[3]);
    const slotNo = parseSlot(row?.[4]).slotNo;
    await updateStatus(rowNo, "called");
    await reduceCap(slotNo, people);
    toast(`${no} 已叫號`, "ok");
    await loadAdmin();
    voiceCall(no);
  }, "叫號中...");
}

async function callNextAndReload() {
  await runSafe(async () => {
    const rows = await cloudGet();
    latestRows = rows;

    for (let i = 1; i < rows.length; i++) {
      if (normalizeStatus(rows[i][5]) === "waiting") {
        await markCalled(i + 1);
        return;
      }
    }
    toast("已無等待中的候補", "danger");
  }, "叫號中...");
}

async function doneGuest(rowNo) {
  await runSafe(async () => {
    await updateStatus(rowNo, "done");
    toast("已標記到場", "ok");
    await loadAdmin();
  }, "更新中...");
}

async function cancelGuest(rowNo) {
  if (!confirm("確定取消此候補？")) return;
  await runSafe(async () => {
    await updateStatus(rowNo, "cancel");
    toast("已取消候補", "ok");
    await loadAdmin();
  }, "取消中...");
}

async function clearToday() {
  if (!confirm("確定清空今日候補名單？此動作會同步到雲端。")) return;
  await runSafe(async () => {
    await clearQueue();
    toast("今日名單已清空", "ok");
    await loadAdmin();
  }, "清空中...");
}

async function autoFill(targetSlot) {
  await runSafe(async () => {
    const rows = await cloudGet();
    let chosenRow = 0;

    for (let i = 1; i < rows.length; i++) {
      if (normalizeStatus(rows[i][5]) !== "waiting") continue;
      if (parseSlot(rows[i][4]).slotNo === Number(targetSlot)) {
        chosenRow = i + 1;
        break;
      }
    }

    if (!chosenRow) {
      for (let i = 1; i < rows.length; i++) {
        if (normalizeStatus(rows[i][5]) !== "waiting") continue;
        if (parseSlot(rows[i][4]).flexible) {
          chosenRow = i + 1;
          break;
        }
      }
    }

    if (!chosenRow) {
      toast("目前沒有可補位名單", "danger");
      return;
    }

    const row = rows[chosenRow - 1];
    await updateStatus(chosenRow, "called");
    await reduceCap(targetSlot, parsePeople(row?.[3]));
    toast(`第 ${targetSlot} 梯已補位 ${row?.[0] || ""}`, "ok");
    await loadAdmin();
    voiceCall(row?.[0] || "A000");
  }, "補位中...");
}

function exportCSV() {
  if (!latestRows || latestRows.length <= 1) {
    toast("目前無資料可匯出", "danger");
    return;
  }

  const csvRows = [["號碼", "姓名", "電話", "人數", "梯次", "狀態"]];
  for (let i = 1; i < latestRows.length; i++) {
    csvRows.push([
      latestRows[i][0] || "",
      latestRows[i][1] || "",
      latestRows[i][2] || "",
      latestRows[i][3] || "",
      latestRows[i][4] || "",
      statusText(latestRows[i][5])
    ]);
  }

  const csv = "\ufeff" + csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `後慈湖候補名單_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function logout() {
  localStorage.removeItem("houcihu_admin_token");
  localStorage.removeItem("houcihu_admin_login");
  location.href = "admin-login.html";
}

window.loadAdmin = loadAdmin;
window.loadMobile = loadAdmin;
window.callNextAndReload = callNextAndReload;
window.voiceCall = voiceCall;
window.doneGuest = doneGuest;
window.cancelGuest = cancelGuest;
window.clearToday = clearToday;
window.autoFill = autoFill;
window.exportCSV = exportCSV;
window.logout = logout;

document.addEventListener("DOMContentLoaded", () => {
  if ($("searchBox")) {
    $("searchBox").addEventListener("input", () => renderTable(latestRows));
  }

  if ($("tbody") || $("listBox") || $("sessionGrid")) {
    loadAdmin();
    if (typeof autoSync === "function") autoSync(loadAdmin, 5000);
  }
});
