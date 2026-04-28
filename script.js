/*
Houcihu Onsite Waitlist System
Designed & Developed by Abby Luo
2026 Official Build

script.js v9 Final
自動補位 + 自動扣名額 + 後台載入
*/

// ===============================
// 工具：解析梯次與意願
// ===============================
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

// ===============================
// 扣名額（依人數）
// ===============================
async function reduceCap(slotNo,people=1){

const rows = await getSessions();

for(let i=1;i<rows.length;i++){

const no   = Number(rows[i][0]);
const open = rows[i][1];
let cap    = Number(rows[i][2]);

if(no===slotNo){

cap = Math.max(0,cap-Number(people));

await saveSession(
slotNo,
open,
cap
);

break;

}

}

}

// ===============================
// 自動補位
// 優先原梯次 -> 接受其他梯次
// ===============================
async function autoFill(targetSlot){

const rows = await cloudGet();

let bestRow = 0;
let people = 1;

// 第一優先：原梯次
for(let i=1;i<rows.length;i++){

if(rows[i][5]!=="waiting") continue;

const info = parseSlot(rows[i][4]);

if(info.slotNo===targetSlot){

bestRow=i+1;
people=Number(rows[i][3] || 1);
break;

}

}

// 第二優先：接受其他梯次
if(bestRow===0){

for(let i=1;i<rows.length;i++){

if(rows[i][5]!=="waiting") continue;

const info = parseSlot(rows[i][4]);

if(info.flexible){

bestRow=i+1;
people=Number(rows[i][3] || 1);
break;

}

}

}

if(bestRow===0){

alert("目前無可補位名單");
return;

}

// 更新狀態
await updateStatus(
bestRow,
"called"
);

// 扣名額（依人數）
await reduceCap(
targetSlot,
people
);

alert(
"第"+targetSlot+
"梯補位成功（"+
people+
"人）"
);

loadAdmin();

if(typeof loadSessions==="function"){
loadSessions();
}

}

// ===============================
// 後台名單載入
// ===============================
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

current.innerText="A000";
return;

}

tbody.innerHTML="";

let now="A000";

for(let i=1;i<rows.length;i++){

const rowNo=i+1;

const no     = rows[i][0];
const name   = rows[i][1];
const phone  = rows[i][2];
const people = rows[i][3];
const slot   = rows[i][4];
const status = rows[i][5];

let txt="等待中";
let cls="wait";

if(status==="called"){
txt="已叫號";
cls="called";
now=no;
}

if(status==="done"){
txt="已到場";
cls="done";
}

if(status==="cancel"){
txt="取消";
cls="cancel";
}

tbody.innerHTML += `
<tr>
<td>${rowNo}</td>
<td>${no}</td>
<td>${name}</td>
<td>${phone}</td>
<td>${people}</td>
<td>${slot}</td>
<td class="${cls}">
${txt}
</td>
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

current.innerText=now;

renderAutoFill();
loadSessions();

}

// ===============================
// 梯次表載入
// ===============================
async function loadSessions(){

const body =
document.getElementById("sessionBody");

if(!body) return;

const rows = await getSessions();

body.innerHTML="";

for(let i=1;i<rows.length;i++){

const no   = rows[i][0];
const open = rows[i][1];
const cap  = rows[i][2];

body.innerHTML += `
<tr>
<td>第${no}梯</td>
<td>${open ? "開放" : "未開放"}</td>
<td>${cap}</td>
<td>-</td>
</tr>
`;

}

}

// ===============================
// 自動補位按鈕區
// ===============================
function renderAutoFill(){

const box =
document.getElementById("autofillArea");

if(!box) return;

box.innerHTML="";

for(let i=1;i<=8;i++){

box.innerHTML += `
<button onclick="autoFill(${i})">
第${i}梯補位
</button>
`;

}

}

// ===============================
// 狀態操作
// ===============================
async function doneGuest(row){

await updateStatus(row,"done");
loadAdmin();

}

async function cancelGuest(row){

await updateStatus(row,"cancel");
loadAdmin();

}

async function clearToday(){

if(confirm("確定清空今日名單？")){

await clearQueue();
loadAdmin();

}

}

// ===============================
// 下一號叫號
// ===============================
async function callNextAndReload(){

const rows = await cloudGet();

for(let i=1;i<rows.length;i++){

if(rows[i][5]==="waiting"){

await updateStatus(
i+1,
"called"
);

break;

}

}

loadAdmin();

}

// ===============================
// 啟動
// ===============================
document.addEventListener(
"DOMContentLoaded",
function(){

loadAdmin();
autoSync(loadAdmin,3000);

}
);
