const K="houcihu_chaos";
let db=JSON.parse(localStorage.getItem(K)||'{"counter":1,"current":"A000","caps":{"3":4,"5":12,"7":8},"times":{"3":"09:45~10:00","5":"10:45~11:00","7":"12:45~13:00"}}');
let pickId="";
function save(){localStorage.setItem(K,JSON.stringify(db));render();}
function render(){
let g=document.getElementById("grid");
if(g){g.innerHTML=Object.keys(db.caps).map(id=>card(id)).join('')}
document.querySelectorAll(".current").forEach(x=>x.textContent=db.current);
}
function card(id){let n=db.caps[id];let t=db.times[id]; if(n<=0)return `<div class="slot"><h3>第${id}梯</h3><div>${t}</div><div class="full">已額滿</div></div>`; return `<div class="slot"><h3>第${id}梯</h3><div>${t}</div><div class="ok">可遞補 ${n} 位</div><button onclick="choose('${id}')">立即登記</button></div>`}
function choose(id){pickId=id;document.getElementById("form").style.display="block";document.getElementById("pick").innerText="第"+id+"梯 "+db.times[id];}
function reg(){let n=document.getElementById("name").value.trim();if(!n)return alert("請填姓名");let c=parseInt(document.getElementById("count").value||1);if(db.caps[pickId]<c)return alert("名額不足");let no="A"+String(db.counter).padStart(3,"0");db.counter++;db.caps[pickId]-=c;save();document.getElementById("msg").innerHTML="登記成功："+no;}
function nextNo(){db.current="A"+String(db.counter-1).padStart(3,"0");save();}
window.onload=render;