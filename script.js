const STORAGE_KEY="houcihu_v71";
const sessions={"1":{time:"08:45~09:00",cap:0},"3":{time:"09:45~10:00",cap:6},"5":{time:"10:45~11:00",cap:18},"7":{time:"12:45~13:00",cap:-1}};
let state=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"counter":1,"queue":[],"current":"A000"}');
let chosen="";
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));render(); if(window.syncToSheets)syncToSheets({state:state,sessions:sessions});}
function render(){
let tb=document.getElementById("slotTable");
if(tb){tb.innerHTML=Object.keys(sessions).map(id=>row(id)).join('')}
let c=document.getElementById("currentNo"); if(c)c.textContent=state.current;
}
function row(id){let s=sessions[id]; if(s.cap===0)return `<tr><td>${id}</td><td>${s.time}</td><td>已額滿</td><td>-</td></tr>`; if(s.cap<0)return `<tr><td>${id}</td><td>${s.time}</td><td>尚未開放</td><td>-</td></tr>`; return `<tr><td>${id}</td><td>${s.time}</td><td>剩 ${s.cap} 位</td><td><button onclick="pick('${id}')">登記</button></td></tr>`}
function pick(id){chosen=id;document.getElementById("sessionText").innerHTML="第"+id+"梯 "+sessions[id].time;document.getElementById("formCard").classList.remove("hidden")}
function submitForm(){let n=document.getElementById("guestName").value.trim();let p=document.getElementById("guestPhone").value.trim();let c=parseInt(document.getElementById("guestCount").value||1);if(!n||!p){alert("請填姓名電話");return;}if(sessions[chosen].cap<c){alert("剩餘名額不足");return;}let no="A"+String(state.counter).padStart(3,"0");state.queue.push({no:no,session:chosen,name:n,phone:p,count:c});state.counter++;sessions[chosen].cap-=c;save();document.getElementById("msg").innerHTML="登記成功｜號碼 "+no;document.getElementById("formCard").classList.add("hidden");}
window.addEventListener("load",render);