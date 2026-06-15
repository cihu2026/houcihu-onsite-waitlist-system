/*
Houcihu Onsite Waitlist System
Cloud sync helpers v14.4 Official Sessions
Designed & Developed by Abby Luo
*/

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbw63eJnsg0a70IbZXBYWktt8CCDfx0mm_MAwzMRDoxKNNvcT2FTTMpJuU8f3qfqHjo/exec";

const API_TIMEOUT = 9000;
const API_RETRY = 2;
const ADMIN_TOKEN_KEY = "houcihu_admin_token";
const ADMIN_API_KEY = "houcihu_admin_api_key";

const QUEUE_STATUS = Object.freeze({
  WAITING: "waiting",
  CALLED: "called",
  DONE: "done",
  CANCEL: "cancel"
});

const EMPTY_PUBLIC_STATUS = Object.freeze({
  ok: false,
  currentNo: "A000",
  waitingCount: 0,
  sessions: [["梯次", "開放", "名額"]],
  message: "public status unavailable"
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getAdminKey() {
  try {
    const raw = localStorage.getItem(ADMIN_TOKEN_KEY);
    const token = raw ? JSON.parse(raw) : null;
    if (token && token.auth && Date.now() < token.expire && token.apiKey) return token.apiKey;
  } catch (_) {}
  return localStorage.getItem(ADMIN_API_KEY) || "";
}

function requireAdminKey() {
  const key = getAdminKey();
  if (!key) throw new Error("missing admin key");
  return key;
}

function withAdminKey(data = {}) {
  return { ...data, key: requireAdminKey() };
}

function buildUrl(params = {}) {
  const url = new URL(WEB_APP_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });
  url.searchParams.set("t", Date.now());
  return url.toString();
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      ...options,
      signal: controller.signal
    });
    clearTimeout(timer);
    return response;
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
}

async function readResponse(response) {
  const text = await response.text();
  if (!text) return "";
  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
}

function normalizeTable(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.data)) return payload.data;
  if (payload && Array.isArray(payload.rows)) return payload.rows;
  return [];
}

function isSuccess(payload) {
  if (payload === true) return true;
  if (typeof payload === "string") return /^(ok|success|true|done)$/i.test(payload.trim());
  if (payload && typeof payload === "object") return payload.ok === true || payload.success === true || payload.status === "ok";
  return Boolean(payload);
}

async function apiGet(params = {}, retry = API_RETRY) {
  try {
    const response = await fetchWithTimeout(buildUrl(params), { method: "GET" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await readResponse(response);
  } catch (error) {
    console.warn("GET 連線失敗：", error);
    if (retry > 0) {
      await sleep(600);
      return apiGet(params, retry - 1);
    }
    return [];
  }
}

async function apiPost(data = {}, retry = API_RETRY) {
  try {
    const response = await fetchWithTimeout(WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await readResponse(response);
  } catch (error) {
    console.warn("POST 連線失敗：", error);
    if (retry > 0) {
      await sleep(600);
      return apiPost(data, retry - 1);
    }
    return "";
  }
}

async function getPublicStatus() {
  const payload = await apiPost({ action: "public" });
  if (!payload || Array.isArray(payload) || payload.success === false) return { ...EMPTY_PUBLIC_STATUS };
  return {
    ok: payload.ok === true || payload.success === true,
    currentNo: String(payload.currentNo || "A000"),
    waitingCount: Number(payload.waitingCount || 0),
    sessions: Array.isArray(payload.sessions) ? payload.sessions : EMPTY_PUBLIC_STATUS.sessions,
    updatedAt: payload.updatedAt || "",
    message: payload.message || ""
  };
}

async function cloudGet() {
  return normalizeTable(await apiGet(withAdminKey({ mode: "queue" })));
}

async function getSessions() {
  const official = await apiGet({ mode: "officialSessions" });
  const officialRows = official && Array.isArray(official.sessions) ? official.sessions : [];
  if (officialRows.length > 1) return officialRows;
  return normalizeTable(await apiGet({ mode: "sessions" }));
}

async function saveSession(no, open, cap) {
  return apiPost(withAdminKey({ action: "saveSession", no, open, cap }));
}

async function updateStatus(row, status) {
  return apiPost(withAdminKey({ action: "update", row, status }));
}

async function clearQueue() {
  return apiPost(withAdminKey({ action: "clear" }));
}

async function addQueue(number, name, phone, people, slot) {
  return apiPost({
    action: "add",
    number,
    name,
    phone,
    people,
    slot,
    status: QUEUE_STATUS.WAITING
  });
}

async function pingServer() {
  const status = await getPublicStatus();
  return Boolean(status);
}

function isOpenFlag(value) {
  if (value === true) return true;
  const text = String(value ?? "").trim().toLowerCase();
  return ["true", "1", "yes", "y", "open", "開放", "是"].includes(text);
}

function normalizeStatus(value) {
  const text = String(value || "waiting").trim().toLowerCase();
  if (["called", "done", "cancel", "waiting"].includes(text)) return text;
  return "waiting";
}

function autoSync(fn, ms = 4000) {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await fn();
    } catch (error) {
      console.warn("自動同步失敗：", error);
    } finally {
      running = false;
    }
  };
  const timer = setInterval(tick, ms);
  return { timer, tick, stop: () => clearInterval(timer) };
}

function formatLocalTime(date = new Date()) {
  return date.toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function maskPhone(phone) {
  const text = String(phone || "").replace(/\D/g, "");
  if (text.length < 7) return "***";
  return text.slice(0, 4) + "***" + text.slice(-3);
}

window.addEventListener("offline", () => {
  document.body?.classList.add("is-offline");
  console.warn("目前離線");
});

window.addEventListener("online", () => {
  document.body?.classList.remove("is-offline");
  console.info("已恢復連線");
});