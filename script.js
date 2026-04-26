let db={"counter":1,"current":"A000","queue":[]};
async function init(){let c=await cloudGet();if(c&&c.counter)db=c;render();setInterval(refreshData,4000);}
async function refreshData(){let c=await cloudGet();if(c&&c.counter){db=c;render();}}
async function save(){await cloudSave(db);render();}
function render(){
let q=document.getElementById("queue");
if(q){q.innerHTML=db.queue.map(x=>`<tr><td>${x.no}</td><td>${x.name}</td><td>${x.source}</td><td>${x.count}</td></tr>`).join('')}
document.querySelectorAll(".current").forEach(x=>x.textContent=db.current);
}
async function addEntry(source){
let n=document.getElementById(source+"_name").value.trim();
let p=document.getElementById(source+"_phone").value.trim();
let c=parseInt(document.getElementById(source+"_count").value||1);
if(!n)return alert("請填姓名");
let no="A"+String(db.counter).padStart(3,"0");
db.counter++;
db.queue.push({no:no,name:n,phone:p,count:c,source:source==="self"?"QR自助":"手寫登錄"});
await save();
document.getElementById("msg").innerHTML="完成登記："+no;
}
async function nextNo(){if(db.queue.length){db.current=db.queue.shift().no;await save();}}
window.addEventListener("load",init);