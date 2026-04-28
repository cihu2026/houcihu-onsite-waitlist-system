/*
Houcihu Onsite Waitlist System
script.js v11 ENTERPRISE
Optimized by ChatGPT for Abby Luo
2026 Official Build
*/

// =======================
// 工具：解析梯次與意願
// =======================
function parseSlot(raw){

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

// =======================
// 工具：按鈕鎖定
// =======================
let systemBusy = false;

async function runSafe(fn){

if(systemBusy) return;

systemBusy = true;

try{
await fn();
}catch(e){
console.log("執行失敗",e);
alert("系統忙碌中，請稍後再試");
}finally{
systemBusy = false;
}

}

// =======================
// 扣名額（依人數）
// =======================
async function reduceCap(slotNo, people=1){

const rows = await getSessions();

for(let i=1;i<rows.length;i++){

const no = Number(rows[i][0]);
const open = rows[i][1];
let cap = Number(rows[i][2]);

if(no===Number(slotNo)){

cap = Math.max(0, cap - Number(people));

await saveSession(
no,
open,
cap
);

break;

}

}

}

// =======================
// 自動補位
// =======================
async function autoFill(targetSlot){

await runSafe(async()=>{

const rows = await cloudGet();

let bestRow = 0;
let people = 1;

// 第一優先 原梯次
for(let i=1;i<rows.length;i++){

if(rows[i][5]!=="waiting") continue;

const info =
parseSlot(rows[i][4]);

if(info.slotNo===targetSlot){

bestRow = i+1;
people = Number(rows[i][3] || 1);
break;

}

}

// 第二優先 接受其他梯次
if(bestRow===0){

for(let i=1;i<rows.length;i++){

if(rows[i][5]!=="waiting") continue;

const info =
parseSlot(rows[i][4]);

if(info.flexible){

bestRow = i+1;
people = Number(rows[i][3] || 1);
break;

}

}

}

if(bestRow===0){

alert("目前無可補位名單");
return;

}

await updateStatus(
bestRow,
"called"
);

await reduceCap(
targetSlot,
people
);

alert(
`第 ${targetSlot} 梯補位成功（${people}人）`
);

await loadAdmin();

});

}

// =======================
// 載入後台名單
// =======================
async function loadAdmin(){

const rows = await cloudGet();

const tbody =
document.getElementById("tbody");

const current =
document.getElementById("currentNo");

if(!tbody || !current) return;

if(!rows || rows.length<=1){

tbody.innerHTML =
"<tr><td colspan='8'>目前無資料</td></tr>";

current.innerText = "A000";

await renderAutoFill();
await loadSessions();

return;

}

let html = "";
let now = "A000";

for(let i=1;i<rows.length;i++){

const rowNo = i+1;

const no = rows[i][0];
const name = rows[i][1];
const phone = rows[i][2];
const people = rows[i][3];
const slot = rows[i][4];
const status = rows[i][5];

let txt="等待中";
let cls="wait";

if(status==="called"){
txt="已叫號";
cls="called";
now=no;
}
else if(status==="done"){
txt="已到場";
cls="done";
}
else if(status==="cancel"){
txt="取消";
cls="cancel";
}

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
<button class="smallbtn"
onclick="doneGuest(${rowNo})">
到場
</button>

<button class="smallbtn red"
onclick="cancelGuest(${rowNo})">
取消
</button>
</td>
</tr>
`;

}

tbody.innerHTML = html;
current.innerText = now;

await renderAutoFill();
await loadSessions();

}

// =======================
// 載入梯次管理
// =======================
async function loadSessions(){

const body =
document.getElementById("sessionBody");

if(!body) return;

const rows =
await getSessions();

let html="";

for(let i=1;i<rows.length;i++){

const no = rows[i][0];
const open = rows[i][1];
const cap = rows[i][2];

html += `
<tr>
<td>第${no}梯</td>
<td>${open ? "開放":"未開放"}</td>
<td>${cap}</td>
<td>-</td>
</tr>
`;

}

body.innerHTML = html;

}

// =======================
// 補位按鈕
// =======================
async function renderAutoFill(){

const box =
document.getElementById("autofillArea");

if(!box) return;

const rows =
await getSessions();

let html="";

for(let i=1;i<rows.length;i++){

const no = rows[i][0];
const cap = Number(rows[i][2]);

html += `
<button
class="${cap<=0?'gray':''}"
onclick="autoFill(${no})">
第${no}梯補位 (${cap})
</button>
`;

}

box.innerHTML = html;

}

// =======================
// 到場
// =======================
async function doneGuest(row){

await runSafe(async()=>{

await updateStatus(
row,
"done"
);

await loadAdmin();

});

}

// =======================
// 取消
// =======================
async function cancelGuest(row){

if(!confirm("確定取消此候補？")) return;

await runSafe(async()=>{

await updateStatus(
row,
"cancel"
);

await loadAdmin();

});

}

// =======================
// 清空
// =======================
async function clearToday(){

if(!confirm("確定清空今日名單？")) return;

await runSafe(async()=>{

await clearQueue();
await loadAdmin();

});

}

// =======================
// 下一號叫號
// =======================
async function callNextAndReload(){

await runSafe(async()=>{

const rows =
await cloudGet();

let found = false;

for(let i=1;i<rows.length;i++){

if(rows[i][5]==="waiting"){

const people =
Number(rows[i][3] || 1);

const slotNo =
parseSlot(rows[i][4]).slotNo;

await updateStatus(
i+1,
"called"
);

await reduceCap(
slotNo,
people
);

found = true;
break;

}

}

if(!found){
alert("已無等待中的候補");
}

await loadAdmin();

});

}

// =======================
// 啟動
// =======================
document.addEventListener(
"DOMContentLoaded",
function(){

loadAdmin();

if(typeof autoSync==="function"){

autoSync(
loadAdmin,
5000
);

}

}
);