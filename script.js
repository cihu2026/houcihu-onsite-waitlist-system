const STORAGE_KEY="houcihu_premium";
const sessions={"1":{time:"08:45~09:00",cap:0},"3":{time:"09:45~10:00",cap:6},"5":{time:"10:45~11:00",cap:18},"7":{time:"12:45~13:00",cap:-1}};
let state=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"counter":1,"queue":[],"current":"A000"}');
let chosen="";
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));render();}
function card(id){let s=sessions[id]; if(s.cap===0)return `<div class="slot full"><h3>第${id}梯</h3><div class="time">${s.time}</div><div class="status">已額滿</div><button class="gray">無法登記</button></div>`; if(s.cap<0)return `<div class="slot wait"><h3>第${id}梯</h3><div class="time">${s.time}</div><div class="status">尚未開放</div><button class="gray">請稍候</button></div>`; return `<div class="slot open"><h3>第${id}梯</h3><div class="time">${s.time}</div><div class="status">剩餘 ${s.cap} 位</div><button onclick="pick('${id}')">立即登記</button></div>`}
function render(){let g=document.getElementById("grid"); if(g)g.innerHTML=Object.keys(sessions).map(card).join(''); let c=document.getElementById("currentNo"); if(c)c.textContent=state.current;}
function pick(id){chosen=id;document.getElementById("formCard").classList.remove("hidden");document.getElementById("pickText").innerHTML="第"+id+"梯 "+sessions[id].time;window.scrollTo({top:document.body.scrollHeight,behavior:"smooth"});}
function submitForm(){let n=document.getElementById("guestName").value.trim();let p=document.getElementById("guestPhone").value.trim();let cnt=parseInt(document.getElementById("guestCount").value||1);if(!n||!p)return alert("請填姓名電話");if(sessions[chosen].cap<cnt)return alert("剩餘名額不足");let no="A"+String(state.counter).padStart(3,"0");state.queue.push({no:no,name:n});state.counter++;sessions[chosen].cap-=cnt;save();document.getElementById("msg").innerHTML="登記成功｜號碼 "+no;document.getElementById("formCard").classList.add("hidden");}
window.addEventListener("load",render);
