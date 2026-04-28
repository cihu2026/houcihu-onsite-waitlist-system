/*
Houcihu Onsite Waitlist System
Designed & Developed by Abby Luo
2026 Official Build | sheets.js v10.1 Stable
*/

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwMCPz4MM9IIbyLbdYeA8PlvosY6pbmOjGa3xmeUvnQv2Vmg1S4ozIOZ9O8Hq58crtv/exec";

// =======================
// 共用 GET (增加超時機制，防止手機網路轉圈圈)
// =======================
async function apiGet(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8秒沒回應就斷開

        const r = await fetch(url, {
            method: "GET",
            cache: "no-store",
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!r.ok) throw new Error("HTTP " + r.status);
        return await r.json();
    } catch (e) {
        console.log("GET 失敗 (可能網路不穩):", e);
        return [];
    }
}

// =======================
// 共用 POST
// =======================
async function apiPost(data) {
    try {
        const r = await fetch(WEB_APP_URL, {
            method: "POST",
            body: new URLSearchParams(data),
            // 確保 Google Script 能正確解析
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });

        if (!r.ok) throw new Error("HTTP " + r.status);
        return await r.text();
    } catch (e) {
        console.log("POST 失敗:", e);
        return "";
    }
}

// =======================
// 候補名單
// =======================
async function cloudGet() {
    return await apiGet(`${WEB_APP_URL}?mode=queue&t=${Date.now()}`);
}

// =======================
// 梯次資料
// =======================
async function getSessions() {
    return await apiGet(`${WEB_APP_URL}?mode=sessions&t=${Date.now()}`);
}

// =======================
// 儲存梯次
// =======================
async function saveSession(no, open, cap) {
    return await apiPost({
        action: "saveSession",
        no: no,
        open: open,
        cap: cap
    });
}

// =======================
// 更新狀態 (waiting/called/done/cancel)
// =======================
async function updateStatus(row, status) {
    return await apiPost({
        action: "update",
        row: row,
        status: status
    });
}

// =======================
// 清空今日名單
// =======================
async function clearQueue() {
    return await apiPost({ action: "clear" });
}

// =======================
// 新增候補
// =======================
async function addQueue(number, name, phone, people, slot) {
    return await apiPost({
        action: "add",
        number: number,
        name: name,
        phone: phone,
        people: people,
        slot: slot,
        status: "waiting"
    });
}

// =======================
// 智能自動同步 (防重疊版)
// =======================
function autoSync(fn, ms = 3000) {
    let isRunning = false;
    
    setInterval(async () => {
        if (isRunning) return; // 如果上一個請求還在跑，就跳過這次
        isRunning = true;
        try {
            await fn();
        } catch (e) {
            console.error("同步執行失敗", e);
        } finally {
            isRunning = false;
        }
    }, ms);
}