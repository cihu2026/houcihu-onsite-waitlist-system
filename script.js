// script.js v7 補位版
// 後慈湖 自動補位邏輯版

// ===============================
// 工具：解析梯次與意願
// ===============================
function parseSlot(raw){

raw = String(raw || "");

const parts = raw.split("｜");

const slotText = parts[0] || "";
const flexText = parts[1] || "";

const match =
slotText.match(/\d+/);

const slotNo =
match ? Number(match[0]) : 0;

const flexible =
flexText.includes("接受其他梯次");

return {
slotNo,
slotText,
flexible
};

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

if(!tbody) return;

if(!rows || rows.length<=1){

tbody.innerHTML =
"<tr><td colspan='8'>目前無資料</td></tr>";

if(current) current.innerText="A000";

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
<td style="line-height:1.6;">
${String(slot).replace("｜","<br>")}
</td>
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

if(current) current.innerText=now;

renderAutoFillButtons();

}

// ===============================
// 自動補位按鈕
// ===============================
function renderAutoFillButtons(){

const area =
document.getElementById("autofillArea");

if(!area) return;

area.innerHTML="";

for(let i=1;i<=8;i++){

area.innerHTML += `
<button class="smallbtn"
onclick="autoFill(${i})">
第${i}梯補位
</button>
`;

}

}

// ===============================
// 自動補位邏輯
// ===============================
async function autoFill(targetSlot){

const rows = await cloudGet();

let bestRow = 0;

// 第一層：同梯次 waiting
for(let i=1;i<rows.length;i++){

if(rows[i][5]!=="waiting")
continue;

const info =
parseSlot(rows[i][4]);

if(info.slotNo===targetSlot){

bestRow=i+1;
break;

}

}

// 第二層：接受其他梯次
if(bestRow===0){

for(let i=1;i<rows.length;i++){

if(rows[i][5]!=="waiting")
continue;

const info =
parseSlot(rows[i][4]);

if(info.flexible){

bestRow=i+1;
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

alert("第"+targetSlot+"梯 已自動叫號");

loadAdmin();

}

// ===============================
// 一般叫號
// ===============================
async function callNextAndReload(){

const rows =
await cloudGet();

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
async function doneGuest(row){

await updateStatus(
row,
"done"
);

loadAdmin();

}

async function cancelGuest(row){

await updateStatus(
row,
"cancel"
);

loadAdmin();

}

async function clearToday(){

if(confirm("確定清空今日名單？")){

await clearQueue();
loadAdmin();

}

}

// ===============================
// 啟動
// ===============================
document.addEventListener(
"DOMContentLoaded",
function(){

if(document.getElementById("tbody")){

loadAdmin();

autoSync(
loadAdmin,
3000
);

}

});