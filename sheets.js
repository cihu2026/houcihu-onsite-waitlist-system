/*
Houcihu Onsite Waitlist System
Designed & Developed by Abby Luo
2026 Official Build | sheets.js v11 ENTERPRISE
*/

const WEB_APP_URL =
"https://script.google.com/macros/s/AKfycbwMCPz4MM9IIbyLbdYeA8PlvosY6pbmOjGa3xmeUvnQv2Vmg1S4ozIOZ9O8Hq58crtv/exec";

// =======================
// 共用設定
// =======================
const API_TIMEOUT = 8000;
const API_RETRY = 1;

// =======================
// 延遲工具
// =======================
function sleep(ms){
return new Promise(r=>setTimeout(r,ms));
}

// =======================
// fetch timeout
// =======================
async function fetchWithTimeout(
url,
options={}
){

const controller =
new AbortController();

const timer =
setTimeout(
()=>controller.abort(),
API_TIMEOUT
);

try{

const res =
await fetch(
url,
{
...options,
signal:controller.signal
}
);

clearTimeout(timer);

return res;

}catch(e){

clearTimeout(timer);
throw e;

}

}

// =======================
// JSON 安全解析
// =======================
async function safeJson(res){

try{
return await res.json();
}catch(e){
return [];
}

}

// =======================
// Text 安全解析
// =======================
async function safeText(res){

try{
return await res.text();
}catch(e){
return "";
}

}

// =======================
// GET
// =======================
async function apiGet(
url,
retry=API_RETRY
){

try{

const res =
await fetchWithTimeout(
url,
{
method:"GET",
cache:"no-store"
}
);

if(!res.ok){
throw new Error(
"HTTP "+res.status
);
}

return await safeJson(res);

}catch(e){

console.log(
"GET失敗:",
e
);

if(retry>0){

await sleep(800);

return await apiGet(
url,
retry-1
);

}

return [];

}

}

// =======================
// POST
// =======================
async function apiPost(
data,
retry=API_RETRY
){

try{

const res =
await fetchWithTimeout(
WEB_APP_URL,
{
method:"POST",
headers:{
"Content-Type":
"application/x-www-form-urlencoded"
},
body:new URLSearchParams(data)
}
);

if(!res.ok){
throw new Error(
"HTTP "+res.status
);
}

// 先試 json
try{
return await res.json();
}catch(e){
return await safeText(res);
}

}catch(e){

console.log(
"POST失敗:",
e
);

if(retry>0){

await sleep(800);

return await apiPost(
data,
retry-1
);

}

return "";

}

}

// =======================
// 候補名單
// =======================
async function cloudGet(){

return await apiGet(
WEB_APP_URL+
"?mode=queue&t="+
Date.now()
);

}

// =======================
// 梯次資料
// =======================
async function getSessions(){

return await apiGet(
WEB_APP_URL+
"?mode=sessions&t="+
Date.now()
);

}

// =======================
// 儲存梯次
// =======================
async function saveSession(
no,
open,
cap
){

return await apiPost({
action:"saveSession",
no:no,
open:open,
cap:cap
});

}

// =======================
// 更新狀態
// waiting/called/done/cancel
// =======================
async function updateStatus(
row,
status
){

return await apiPost({
action:"update",
row:row,
status:status
});

}

// =======================
// 清空今日名單
// =======================
async function clearQueue(){

return await apiPost({
action:"clear"
});

}

// =======================
// 新增候補
// =======================
async function addQueue(
number,
name,
phone,
people,
slot
){

return await apiPost({
action:"add",
number:number,
name:name,
phone:phone,
people:people,
slot:slot,
status:"waiting"
});

}

// =======================
// 健康檢查
// =======================
async function pingServer(){

const r =
await apiGet(
WEB_APP_URL+
"?mode=queue&t="+
Date.now()
);

return Array.isArray(r);

}

// =======================
// 自動同步（防重疊）
// =======================
function autoSync(
fn,
ms=3000
){

let running=false;

setInterval(
async()=>{

if(running) return;

running=true;

try{

await fn();

}catch(e){

console.log(
"同步失敗:",
e
);

}finally{

running=false;

}

},
ms
);

}

// =======================
// 離線提醒
// =======================
window.addEventListener(
"offline",
function(){

console.log(
"目前離線"
);

}
);

window.addEventListener(
"online",
function(){

console.log(
"已恢復連線"
);

}
);