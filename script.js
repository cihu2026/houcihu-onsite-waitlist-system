// script.js v3

async function loadAdmin(){

const rows=await cloudGet();

const tbody =
document.getElementById("tbody");

const current =
document.getElementById("currentNo");

if(!rows || rows.length<=1){
tbody.innerHTML="<tr><td>目前無資料</td></tr>";
return;
}

tbody.innerHTML="";

let now="A000";

for(let i=1;i<rows.length;i++){

const r=i+1;

const no=rows[i][0];
const name=rows[i][1];
const people=rows[i][3];
const status=rows[i][5];

if(status==="called"){
now=no;
}

tbody.innerHTML += `
<tr>
<td>${no}</td>
<td>${name}</td>
<td>${people}人</td>
<td>${status}</td>
</tr>
`;

}

current.innerText=now;

}

async function loadSessions(){

const rows=await getSessions();

const body=
document.getElementById("sessionBody");

body.innerHTML="";

for(let i=1;i<rows.length;i++){

const no=rows[i][0];
const open=rows[i][1];
const cap=rows[i][2];

body.innerHTML += `
<tr>
<td>第${no}梯</td>
<td>${open?"開放":"未開放"}</td>
<td>${cap}</td>
</tr>
`;

}

}

async function callNextAndReload(){

const rows=await cloudGet();

for(let i=1;i<rows.length;i++){

if(rows[i][5]==="waiting"){

await updateStatus(i+1,"called");
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

document.addEventListener(
"DOMContentLoaded",
function(){

if(document.getElementById("tbody")){
loadAdmin();
loadSessions();
autoSync(loadAdmin,3000);
}

});