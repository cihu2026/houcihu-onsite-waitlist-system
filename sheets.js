// ======================================
// 後慈湖 sheets.js v3 雲端同步版
// 候補名單 + 梯次設定 sessions
// ======================================

const WEB_APP_URL =
"https://script.google.com/macros/s/AKfycbwMCPz4MM9IIbyLbdYeA8PlvosY6pbmOjGa3xmeUvnQv2Vmg1S4ozIOZ9O8Hq58crtv/exec";

// ======================================
// 讀取候補名單
// ======================================
async function cloudGet(){

try{

const res =
await fetch(
WEB_APP_URL +
"?mode=queue&t=" +
Date.now()
);

return await res.json();

}catch(e){

console.log(e);
return [];

}

}

// ======================================
// 讀取梯次設定
// ======================================
async function getSessions(){

try{

const res =
await fetch(
WEB_APP_URL +
"?mode=sessions&t=" +
Date.now()
);

return await res.json();

}catch(e){

console.log(e);
return [];

}

}

// ======================================
// 儲存梯次設定
// ======================================
async function saveSession(
no,
open,
cap
){

try{

const res =
await fetch(WEB_APP_URL,{

method:"POST",

body:new URLSearchParams({
action:"saveSession",
no:no,
open:open,
cap:cap
})

});

return res.ok;

}catch(e){

console.log(e);
return false;

}

}

// ======================================
// 新增候補
// ======================================
async function addQueue(
number,
name,
phone,
people,
slot
){

try{

const res =
await fetch(WEB_APP_URL,{

method:"POST",

body:new URLSearchParams({
action:"add",
number:number,
name:name,
phone:phone,
people:people,
slot:slot,
status:"waiting"
})

});

return res.ok;

}catch(e){

console.log(e);
return false;

}

}

// ======================================
// 更新狀態
// ======================================
async function updateStatus(
row,
status
){

try{

const res =
await fetch(WEB_APP_URL,{

method:"POST",

body:new URLSearchParams({
action:"update",
row:row,
status:status
})

});

return res.ok;

}catch(e){

console.log(e);
return false;

}

}

// ======================================
// 到場
// ======================================
async function doneNumber(row){

return await updateStatus(
row,
"done"
);

}

// ======================================
// 取消
// ======================================
async function cancelNumber(row){

return await updateStatus(
row,
"cancel"
);

}

// ======================================
// 下一號叫號
// ======================================
async function callNext(){

const rows =
await cloudGet();

for(let i=1;i<rows.length;i++){

if(rows[i][5]==="waiting"){

await updateStatus(
i+1,
"called"
);

return true;

}

}

return false;

}

// ======================================
// 清空候補名單
// ======================================
async function clearQueue(){

try{

const res =
await fetch(WEB_APP_URL,{

method:"POST",

body:new URLSearchParams({
action:"clear"
})

});

return res.ok;

}catch(e){

console.log(e);
return false;

}

}

// ======================================
// 自動同步
// ======================================
function autoSync(
callback,
ms=3000
){

setInterval(async()=>{

const data =
await cloudGet();

if(callback){
callback(data);
}

},ms);

}