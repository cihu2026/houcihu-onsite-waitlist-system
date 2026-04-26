const K="houcihu_transparent";
let db=JSON.parse(localStorage.getItem(K)||'{"counter":23,"current":15,"caps":{"3":4,"5":12,"7":8},"times":{"3":"09:45~10:00","5":"10:45~11:00","7":"12:45~13:00"},"queue":[]}');
let chosen="";
function save(){localStorage.setItem(K,JSON.stringify(db));render();}
function render(){
let g=document.getElementById("grid");
if(g){g.innerHTML=Object.keys(db.caps).map(id=>card(id)).join('')}
document.querySelectorAll(".current").forEach(x=>x.textContent="A"+String(db.current).padStart(3,"0"));
}
function card(id){let n=db.caps[id],t=db.times[id];return `<div class="slot"><h3>第${id}梯</h3><div>${t}</div><div class="ok">可候補 ${n} 位</div><button onclick="pick('${id}')">加入候補</button></div>`}
function pick(id){chosen=id;document.getElementById("form").style.display="block";document.getElementById("pick").innerText="第"+id+"梯 "+db.times[id];}
function reg(){let name=document.getElementById("name").value.trim();if(!name)return alert("請填姓名");let count=parseInt(document.getElementById("count").value||1);let no=db.counter;db.counter++;db.queue.push(no);save();let ahead=no-db.current-1; if(ahead<0)ahead=0;document.getElementById("msg").innerHTML=`您已加入候補名單<br>號碼 A${String(no).padStart(3,"0")}<br>目前叫號 A${String(db.current).padStart(3,"0")}<br>前方尚有 ${ahead} 組<br><span class='warn'>完成登記不代表保證入場，將依現場名額安排。</span>`;}
function nextNo(){db.current++;save();}
window.onload=render;