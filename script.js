const STORAGE_KEY="houcihu_typed_quota";
let state=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{"current":"A000","caps":{"1":50,"3":50,"5":50,"7":50},"used":{"1":0,"3":0,"5":0,"7":0}}');
const info={"1":"08:45~09:00","3":"09:45~10:00","5":"10:45~11:00","7":"12:45~13:00"};
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));render();}
function remain(id){return state.caps[id]-state.used[id]}
function render(){
let tb=document.getElementById("tb");
if(tb){tb.innerHTML=Object.keys(info).map(id=>`<tr><td>${id}</td><td>${info[id]}</td><td><input type="number" value="${state.caps[id]}" onkeydown="if(event.key==='Enter')setCap('${id}',this.value)"></td><td>${state.used[id]}</td><td>${remain(id)}</td><td><button onclick="setCap('${id}',prompt('輸入名額',state.caps[id]))">修改</button></td></tr>`).join('')}
let c=document.getElementById("currentNo"); if(c)c.textContent=state.current;
}
function setCap(id,v){v=parseInt(v); if(isNaN(v)||v<0){alert("請輸入正確數字");return;} state.caps[id]=v; save();}
window.addEventListener("load",render);
