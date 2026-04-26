const K="houcihu_cloud_final";
let db={"counter":1,"current":"A000","queue":[],"caps":{"3":6,"5":18,"7":0},"times":{"3":"09:45~10:00","5":"10:45~11:00","7":"12:45~13:00"}};
let chosen="";
async function init(){let c=await cloudGet(); if(c&&c.counter)db=c; render(); setInterval(syncRefresh,5000);}
async function syncRefresh(){let c=await cloudGet(); if(c&&c.counter){db=c; render();}}
async function save(){await cloudSave(db); render();}
function render(){
let g=document.getElementById("grid");
if(g){g.innerHTML=Object.keys(db.caps).map(id=>card(id)).join('')}
let t=document.getElementById("tb");
if(t){t.innerHTML=Object.keys(db.caps).map(id=>`<tr><td>${id}</td><td><input type="number" value="${db.caps[id]}" onkeydown="if(event.key==='Enter')setCap('${id}',this.value)"></td></tr>`).join('')}
document.querySelectorAll(".current").forEach(x=>x.textContent=db.current);
}
function card(id){let n=db.caps[id],time=db.times[id]; if(n<=0)return `<div class="slot"><h3>第${id}梯</h3><div>${time}</div><div class="full">已額滿</div></div>`; return `<div class="slot"><h3>第${id}梯</h3><div>${time}</div><div class="ok">剩 ${n} 位</div><button onclick="pick('${id}')">立即登記</button></div>`}
function pick(id){chosen=id;document.getElementById("form").classList.remove("hidden");document.getElementById("pick").innerText="第"+id+"梯 "+db.times[id];}
async function submitForm(){let n=document.getElementById("name").value.trim();let p=document.getElementById("phone").value.trim();let c=parseInt(document.getElementById("count").value||1);if(!n||!p)return alert("請填姓名電話");if(db.caps[chosen]<c)return alert("剩餘不足");let no="A"+String(db.counter).padStart(3,"0");db.queue.push({no:no,name:n,phone:p,count:c,session:chosen});db.counter++;db.caps[chosen]-=c;await save();document.getElementById("msg").innerHTML="登記成功｜"+no;}
async function setCap(id,v){v=parseInt(v);if(isNaN(v)||v<0)return;db.caps[id]=v;await save();}
async function nextNo(){if(db.queue.length){db.current=db.queue.shift().no;await save();}}
window.addEventListener("load",init);