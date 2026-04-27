// script.js v3 最終穩定版

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

if(current){
current.innerText="A000";
}

return;

}

tbody.innerHTML="";

let now = "A000";

for(let i=1;i<rows.length;i++){

const rowNo = i+1;

const no     = rows[i][0];
const name   = rows[i][1];
const phone  = rows[i][2];
const people = rows[i][3];
const slot   = rows[i][4];
const status = rows[i][5];

let txt = "等待中";

if(status==="called"){
txt="已叫號";
now=no;
}

if(status==="done"){
txt="已到場";
}

if(status==="cancel"){
txt="取消";
}

tbody.innerHTML += `
<tr>
<td>${rowNo}</td>
<td>${no}</td>
<td>${name}</td>
<td>${phone}</td>
<td>${people}</td>
<td>${slot}</td>
<td>${txt}</td>
<td>

<button onclick="doneGuest(${rowNo})">
到場
</button>

<button onclick="cancelGuest(${rowNo})">
取消
</button>

</td>
</tr>
`;

}

if(current){
current.innerText = now;
}

}

// ========================
// 梯次管理
// ========================
async function loadSessions(){

const rows = await getSessions();

const body =
document.getElementById("sessionBody");

if(!body) return;

body.innerHTML="";

for(let i=1;i<rows.length;i++){

const no   = rows[i][0];
const open = rows[i][1];
const cap  = rows[i][2];

body.innerHTML += `
<tr>

<td>第${no}梯</td>

<td>
${open ? "開放":"未開放"}
</td>

<td>
<input
type="number"
id="cap${no}"
value="${cap}"
style="width:80px">
</td>

<td>
<button onclick="saveCap(${no},${open})">
儲存
</button>
</td>

</tr>
`;

}

}

async function saveCap(no,open){

const cap =
document.getElementById(
"cap"+no
).value;

await saveSession(
no,
open,
cap
);

alert("第"+no+"梯已儲存");

loadSessions();

}

// ========================
// 狀態操作
// ========================
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

async function clearToday(){

if(confirm("確定清空今日名單？")){

await clearQueue();

loadAdmin();

}

}

// ========================
// 啟動
// ========================
document.addEventListener(
"DOMContentLoaded",
function(){

if(document.getElementById("tbody")){

loadAdmin();
loadSessions();

autoSync(
loadAdmin,
3000
);

}

}
);