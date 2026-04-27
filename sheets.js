// sheets.js v3

const WEB_APP_URL =
"https://script.google.com/macros/s/AKfycbwMCPz4MM9IIbyLbdYeA8PlvosY6pbmOjGa3xmeUvnQv2Vmg1S4ozIOZ9O8Hq58crtv/exec";

async function cloudGet(){
const r=await fetch(WEB_APP_URL+"?mode=queue&t="+Date.now());
return await r.json();
}

async function getSessions(){
const r=await fetch(WEB_APP_URL+"?mode=sessions&t="+Date.now());
return await r.json();
}

async function saveSession(no,open,cap){
await fetch(WEB_APP_URL,{
method:"POST",
body:new URLSearchParams({
action:"saveSession",
no:no,
open:open,
cap:cap
})
});
}

async function updateStatus(row,status){
await fetch(WEB_APP_URL,{
method:"POST",
body:new URLSearchParams({
action:"update",
row:row,
status:status
})
});
}

async function clearQueue(){
await fetch(WEB_APP_URL,{
method:"POST",
body:new URLSearchParams({
action:"clear"
})
});
}

function autoSync(fn,ms=3000){
setInterval(fn,ms);
}