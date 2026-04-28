/*
Houcihu Onsite Waitlist System - v9.1 Optimized
Designed & Developed by Abby Luo
2026 Official Build
*/

// --- 工具：解析梯次與意願 ---
function parseSlot(raw) {
    raw = String(raw || "");
    const parts = raw.split("｜");
    const slotText = parts[0] || "";
    const flexText = parts[1] || "";
    const match = slotText.match(/\d+/);
    return {
        slotNo: match ? Number(match[0]) : 0,
        slotText: slotText,
        flexible: flexText.includes("接受其他梯次")
    };
}

// --- 扣名額（依人數）---
async function reduceCap(slotNo, people = 1) {
    const rows = await getSessions();
    for (let i = 1; i < rows.length; i++) {
        const no = Number(rows[i][0]);
        const open = rows[i][1];
        let cap = Number(rows[i][2]);
        if (no === Number(slotNo)) {
            cap = Math.max(0, cap - Number(people));
            await saveSession(no, open, cap);
            break;
        }
    }
}

// --- 自動補位邏輯 ---
async function autoFill(targetSlot) {
    const rows = await cloudGet();
    let bestRow = 0;
    let people = 1;

    // 1. 優先：原梯次
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][5] !== "waiting") continue;
        const info = parseSlot(rows[i][4]);
        if (info.slotNo === targetSlot) {
            bestRow = i + 1;
            people = Number(rows[i][3] || 1);
            break;
        }
    }

    // 2. 次要：接受其他梯次
    if (bestRow === 0) {
        for (let i = 1; i < rows.length; i++) {
            if (rows[i][5] !== "waiting") continue;
            const info = parseSlot(rows[i][4]);
            if (info.flexible) {
                bestRow = i + 1;
                people = Number(rows[i][3] || 1);
                break;
            }
        }
    }

    if (bestRow === 0) {
        alert("目前無可補位名單");
        return;
    }

    await updateStatus(bestRow, "called");
    await reduceCap(targetSlot, people);
    alert(`第 ${targetSlot} 梯補位成功（${people} 人）`);
    loadAdmin();
}

// --- 後台名單載入 (效能優化版) ---
async function loadAdmin() {
    const rows = await cloudGet();
    const tbody = document.getElementById("tbody");
    const current = document.getElementById("currentNo");
    if (!tbody || !current) return;

    if (!rows || rows.length <= 1) {
        tbody.innerHTML = "<tr><td colspan='8'>目前無資料</td></tr>";
        current.innerText = "A000";
        return;
    }

    let html = ""; // 使用字串累積，避免手機端閃爍
    let now = "A000";

    for (let i = 1; i < rows.length; i++) {
        const rowNo = i + 1;
        const [no, name, phone, people, slot, status] = rows[i];
        let txt = "等待中", cls = "wait";

        if (status === "called") { txt = "已叫號"; cls = "called"; now = no; }
        else if (status === "done") { txt = "已到場"; cls = "done"; }
        else if (status === "cancel") { txt = "取消"; cls = "cancel"; }

        html += `
        <tr>
            <td>${rowNo}</td>
            <td>${no}</td>
            <td>${name}</td>
            <td>${phone}</td>
            <td>${people}</td>
            <td>${slot}</td>
            <td class="${cls}">${txt}</td>
            <td>
                <button class="smallbtn" onclick="doneGuest(${rowNo})">到場</button>
                <button class="smallbtn red" onclick="cancelGuest(${rowNo})">取消</button>
            </td>
        </tr>`;
    }
    tbody.innerHTML = html;
    current.innerText = now;

    renderAutoFill(); // 同步更新補位按鈕
    loadSessions();   // 同步更新梯次表
}

// --- 梯次表載入 ---
async function loadSessions() {
    const body = document.getElementById("sessionBody");
    if (!body) return;
    const rows = await getSessions();
    let html = "";
    for (let i = 1; i < rows.length; i++) {
        const [no, open, cap] = rows[i];
        html += `
        <tr>
            <td>第${no}梯</td>
            <td>${open ? "開放" : "未開放"}</td>
            <td>${cap}</td>
            <td>-</td>
        </tr>`;
    }
    body.innerHTML = html;
}

// --- 自動補位按鈕區 (改為動態生成) ---
async function renderAutoFill() {
    const box = document.getElementById("autofillArea");
    if (!box) return;
    const sessions = await getSessions(); 
    let html = "";
    for (let i = 1; i < sessions.length; i++) {
        const no = sessions[i][0];
        const cap = sessions[i][2];
        const btnClass = cap > 0 ? "" : "gray";
        html += `<button class="${btnClass}" onclick="autoFill(${no})">第${no}梯補位 (${cap})</button>`;
    }
    box.innerHTML = html;
}

// --- 狀態操作 ---
async function doneGuest(row) {
    await updateStatus(row, "done");
    loadAdmin();
}

async function cancelGuest(row) {
    if (!confirm("確定取消此候補？")) return;
    await updateStatus(row, "cancel");
    loadAdmin();
}

async function clearToday() {
    if (confirm("🚨 注意：確定要清空今日所有名單嗎？")) {
        await clearQueue();
        loadAdmin();
    }
}

// --- 下一號叫號 (同步扣名額版) ---
async function callNextAndReload() {
    const rows = await cloudGet();
    let found = false;
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][5] === "waiting") {
            const people = rows[i][3];
            const slotNo = parseSlot(rows[i][4]).slotNo;
            
            await updateStatus(i + 1, "called");
            await reduceCap(slotNo, people); // 叫號同步扣名額
            found = true;
            break;
        }
    }
    if (!found) alert("已無等待中的候補");
    loadAdmin();
}

// --- 啟動與防連點防護 ---
let isBusy = false;
async function syncWrapper() {
    if (isBusy) return;
    isBusy = true;
    await loadAdmin();
    isBusy = false;
}

document.addEventListener("DOMContentLoaded", () => {
    syncWrapper();
    if (typeof autoSync === "function") {
        autoSync(syncWrapper, 5000); // 5秒同步一次，適合手機熱點
    }
});