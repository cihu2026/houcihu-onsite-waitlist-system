// ===============================
// Google Sheets 雲端同步版
// 請改成你的 Apps Script 網址
// ===============================
const WEB_APP_URL =
"https://script.google.com/macros/s/你的網址/exec";

// ===============================
const DEFAULT_DATA = {
counter:1,
current:"A000",
queue:[]
};

// ===============================
async function cloudGet(){

try{

const res =
await fetch(WEB_APP_URL + "?t=" + Date.now());

return await res.json();

}catch(e){

console.log(e);
return null;

}

}

// ===============================
async function cloudSave(data){

try{

await fetch(WEB_APP_URL,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(data)
});

return true;

}catch(e){

console.log(e);
return false;

}

}

// ===============================
async function initCloud(){

let data = await cloudGet();

if(!data){

await cloudSave(DEFAULT_DATA);
data = DEFAULT_DATA;

}

return data;
}

// ===============================
function autoSync(callback,sec=3000){

setInterval(async()=>{

const data = await cloudGet();

if(data) callback(data);

},sec);

}

// ===============================
async function cloudPatch(fn){

const data = await cloudGet();

if(!data) return false;

fn(data);

return await cloudSave(data);

}

// ===============================
async function addQueue(name,people,slot){

return await cloudPatch(data=>{

const no =
"A" +
String(data.counter)
.padStart(3,"0");

data.queue.push({
number:no,
name:name,
people:people,
slot:slot,
status:"waiting",
time:new Date().toLocaleTimeString()
});

data.counter++;

});

}

// ===============================
async function callNext(){

return await cloudPatch(data=>{

const row =
data.queue.find(
v=>v.status==="waiting"
);

if(row){

row.status="called";
data.current=row.number;

}

});

}

// ===============================
async function doneNumber(no){

return await cloudPatch(data=>{

const row =
data.queue.find(v=>v.number===no);

if(row) row.status="done";

});

}

// ===============================
async function cancelNumber(no){

return await cloudPatch(data=>{

const row =
data.queue.find(v=>v.number===no);

if(row) row.status="cancel";

});

}
