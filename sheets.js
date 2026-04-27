// sheets.js v8 最終穩定版
// 後慈湖 雲端同步 API

const WEB_APP_URL =
"https://script.google.com/macros/s/AKfycbwMCPz4MM9IIbyLbdYeA8PlvosY6pbmOjGa3xmeUvnQv2Vmg1S4ozIOZ9O8Hq58crtv/exec";

// =======================
// 共用 fetch
// =======================
async function apiGet(url){

try{

const r = await fetch(url,{
method:"GET",
cache:"no-store"
});

return await r.json();

}catch(e){

console.log("GET失敗",e);
return [];

}

}

async function apiPost(data){

try{

const r = await fetch(
WEB_APP_URL,
{
method:"POST",
body:new URLSearchParams(data)
});

return await r.text();

}catch(e){

console.log("POST失敗",e);
return "";

}

}

// =======================
// 候補名單
// =======================
async function cloudGet(){

return await apiGet(
WEB_APP_URL+
"?mode=queue&t="+Date.now()
);

}

// =======================
// 梯次資料
// =======================
async function getSessions(){

return await apiGet(
WEB_APP_URL+
"?mode=sessions&t="+Date.now()
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
// 清空名單
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
// 自動同步
// =======================
function autoSync(
fn,
ms=3000
){

setInterval(
fn,
ms
);

}