// script.js v8 自動扣名額版
// 在 v7 基礎上升級：補位成功後自動扣梯次名額

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
// 扣名額
// ===============================
async function reduceCap(slotNo){

const rows = await getSessions();

for(let i=1;i<rows.length;i++){

const no   = Number(rows[i][0]);
const open = rows[i][1];
let cap    = Number(rows[i][2]);

if(no===slotNo){

cap = Math.max(0,cap-1);

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
// 自動補位（升級版）
// ===============================
async function autoFill(targetSlot){

const rows = await cloudGet();

let bestRow = 0;

// 第一層：同梯次 waiting
for(let i=1;i<rows.length;i++){

if(rows[i][5]!=="waiting") continue;

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

if(rows[i][5]!=="waiting") continue;

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

// 叫號
await updateStatus(
bestRow,
"called"
);

// 自動扣名額
await reduceCap(targetSlot);

alert("第"+targetSlot+"梯 已補位成功，名額已扣除");

loadAdmin();

if(typeof loadSessions==="function"){
loadSessions();
}

}

// ===============================
// 下一號叫號（一般版）
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