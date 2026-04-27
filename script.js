// =======================
// 共用後台邏輯
// =======================

async function renderAdmin(){

const data = await cloudGet();

if(!data) return;

document.querySelectorAll("#currentNo")
.forEach(el=>{
el.innerText = data.current || "A000";
});

renderTable(data.queue || []);
renderMobile(data.queue || []);

}

// =======================
// admin table
// =======================
function renderTable(queue){

const tbody =
document.getElementById("tbody");

if(!tbody) return;

if(queue.length===0){

tbody.innerHTML =
'<tr><td colspan="5">目前無資料</td></tr>';

return;
}

tbody.innerHTML = "";

queue.forEach(item=>{

tbody.innerHTML += `
<tr>
<td>${item.number}</td>
<td>${item.name}</td>
<td>${item.people}</td>
<td>${statusText(item.status)}</td>
<td>

<button onclick="doneGuest('${item.number}')">
到場
</button>

<button onclick="cancelGuest('${item.number}')">
取消
</button>

</td>
</tr>
`;

});

}

// =======================
// mobile list
// =======================
function renderMobile(queue){

const box =
document.getElementById("mobileList");

if(!box) return;

if(queue.length===0){

box.innerHTML = "目前無資料";
return;
}

box.innerHTML = "";

queue.forEach(item=>{

box.innerHTML += `
<div class="card">

<b>${item.number}</b><br>
${item.name} / ${item.people}人<br>
${statusText(item.status)}

<button onclick="doneGuest('${item.number}')">
到場
</button>

<button onclick="cancelGuest('${item.number}')">
取消
</button>

</div>
`;

});

}

// =======================
// 狀態文字
// =======================
function statusText(status){

if(status==="called") return "已叫號";
if(status==="done") return "已到場";
if(status==="cancel") return "取消";

return "等待中";
}

// =======================
// 操作
// =======================
async function doneGuest(no){
await doneNumber(no);
}

async function cancelGuest(no){
await cancelNumber(no);
}

// =======================
// 啟動
// =======================
initCloud().then(renderAdmin);
autoSync(renderAdmin,3000);
