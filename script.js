// ======================================
// 後慈湖 script.js v3 正式版
// 搭配 sheets.js v3 使用
// ======================================

// ======================================
// 共用工具
// ======================================
function byId(id){
return document.getElementById(id);
}

function setText(id,text){

const el = byId(id);

if(el){
el.innerText = text;
}

}

// ======================================
// 狀態文字
// ======================================
function statusText(status){

if(status==="waiting") return "等待中";
if(status==="called") return "已叫號";
if(status==="done") return "已到場";
if(status==="cancel") return "取消";

return status;

}

function statusClass(status){

if(status==="waiting") return "wait";
if(status==="called") return "called";
if(status==="done") return "done";
if(status==="cancel") return "cancel";

return "";

}

// ======================================
// admin 讀取名單
// ======================================
async function loadAdmin(){

const rows =
await cloudGet();

const tbody =
byId("tbody");

if(!tbody) return;

if(!rows || rows.length<=1){

tbody.innerHTML =
"<tr><td colspan='8'>目前無資料</td></tr>";

return;

}

let current = "A000";

tbody.innerHTML = "";

for(let i=1;i<rows.length;i++){

const rowNo = i+1;

const no = rows[i][0];
const name = rows[i][1];
const phone = rows[i][2];
const people = rows[i][3];
const slot = rows[i][4];
const status = rows[i][5];

if(status==="called"){
current = no;
}

tbody.innerHTML += `
<tr>
<td>${rowNo}</td>
<td>${no}</td>
<td>${name}</td>
<td>${phone}</td>
<td>${people}</td>
<td>${slot}</td>
<td class="${statusClass(status)}">
${statusText(status)}
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

setText("currentNo",current);

}

// ======================================
// admin 操作
// ======================================
async function doneGuest(row){

await doneNumber(row);
loadAdmin();

}

async function cancelGuest(row){

await cancelNumber(row);
loadAdmin();

}

async function callNextAndReload(){

await callNext();
loadAdmin();

}

async function clearToday(){

if(confirm("確定清空今日名單？")){

await clearQueue();
loadAdmin();

}

}

// ======================================
// screen 看板
// ======================================
async function loadScreen(){

const rows =
await cloudGet();

let current = "A000";

if(rows && rows.length>1){

for(let i=1;i<rows.length;i++){

if(rows[i][5]==="called"){
current = rows[i][0];
}

}

}

setText("currentNo",current);

}

// ======================================
// checkin 登記
// ======================================
async function submitCheckin(
nameId="name",
phoneId="phone",
peopleId="people"
){

const name =
byId(nameId).value.trim();

const phone =
byId(phoneId).value.trim();

const people =
byId(peopleId).value;

const rows =
await cloudGet();

const no =
"A" +
String(rows.length).padStart(3,"0");

const ok =
await addQueue(
no,
name,
phone,
people,
"現場"
);

if(ok){

const form =
document.querySelector("form");

if(form){
form.style.display="none";
}

const box =
byId("successBox");

if(box){
box.style.display="block";
}

setText("ticketNo",no);

}else{

alert("送出失敗");

}

}

// ======================================
// sessions 顯示
// ======================================
async function loadSessions(){

const rows =
await getSessions();

const body =
byId("sessionBody");

if(!body) return;

body.innerHTML = "";

for(let i=1;i<rows.length;i++){

const no = rows[i][0];
const open = rows[i][1];
const cap = rows[i][2];

body.innerHTML += `
<tr>
<td>第${no}梯</td>
<td>${open ? "✅":"❌"}</td>
<td>
<input
type="number"
id="cap${no}"
value="${cap}"
style="width:80px">
</td>
<td>
<button class="smallbtn"
onclick="saveCap(${no},${open})">
儲存
</button>
</td>
</tr>
`;

}

}

async function saveCap(no,open){

const cap =
byId("cap"+no).value;

await saveSession(
no,
open,
cap
);

alert("已儲存");

loadSessions();

}

// ======================================
// 自動啟動
// ======================================
document.addEventListener(
"DOMContentLoaded",
function(){

if(byId("tbody")){

loadAdmin();
autoSync(loadAdmin,3000);

}

if(byId("currentNo")
&& !byId("tbody")){

loadScreen();
autoSync(loadScreen,3000);

}

if(byId("sessionBody")){

loadSessions();

}

}
);