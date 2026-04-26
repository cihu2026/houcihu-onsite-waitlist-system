// =====================================================
// 後慈湖現場補位系統 script.js v2 完整版
// 適用：index.html / admin.html / screen.html
// GitHub Pages 純前端版
// =====================================================

// -------------------------
// 基本設定
// -------------------------
const STORAGE_KEY = "houcihu_waitlist_data_v2";
const CALLED_KEY  = "houcihu_called_data_v2";

const officialUrl =
"https://backcihu.tycg.gov.tw/select-day.aspx?d=DA08FE4346271B109515C1431C448B2874BF30BBC3BD489450D0806F1AF9C9D31B4A88E59D76FB4E";

// -------------------------
// 共用資料
// -------------------------
function getList(){
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveList(list){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getCalled(){
    return JSON.parse(localStorage.getItem(CALLED_KEY)) || null;
}

function saveCalled(item){
    localStorage.setItem(CALLED_KEY, JSON.stringify(item));
}

// -------------------------
// 工具
// -------------------------
function nowTime(){
    const d = new Date();

    return d.getHours().toString().padStart(2,"0")
    + ":" +
    d.getMinutes().toString().padStart(2,"0");
}

function nextNumber(){

    const list = getList();

    const max = list.length + 1;

    return "A" + String(max).padStart(3,"0");
}

function setText(id,val){

    const el = document.getElementById(id);

    if(el) el.innerText = val;
}

function maskPhone(phone){

    if(!phone) return "";

    if(phone.length <= 4) return phone;

    return phone.substring(0,4) + "****";
}

// -------------------------
// 報名功能（index）
// -------------------------
function initForm(){

    const form =
    document.getElementById("queueForm");

    if(!form) return;

    form.addEventListener("submit",function(e){

        e.preventDefault();

        const name =
        document.getElementById("name").value.trim();

        const phone =
        document.getElementById("phone").value.trim();

        const people =
        document.getElementById("people").value;

        const slot =
        document.getElementById("slot").value;

        if(name === ""){
            alert("請輸入姓名");
            return;
        }

        let list = getList();

        const item = {
            id: Date.now(),
            number: nextNumber(),
            name,
            phone,
            people,
            slot,
            time: nowTime(),
            status: "waiting"
        };

        list.push(item);

        saveList(list);

        alert(
            "候補成功！\n" +
            "號碼：" + item.number
        );

        form.reset();
    });
}

// -------------------------
// Admin 後台
// -------------------------
function renderAdmin(){

    const tbody =
    document.getElementById("queueTable");

    if(!tbody) return;

    const filterSlot =
    document.getElementById("filterSlot")?.value || "";

    const keyword =
    document.getElementById("searchInput")?.value.trim() || "";

    let list = getList();

    // 篩梯次
    if(filterSlot){
        list = list.filter(v=>v.slot===filterSlot);
    }

    // 搜尋
    if(keyword){
        list = list.filter(v =>
            v.name.includes(keyword) ||
            v.number.includes(keyword)
        );
    }

    tbody.innerHTML = "";

    if(list.length === 0){

        tbody.innerHTML =
        `<tr><td colspan="8">查無資料</td></tr>`;

        renderStats();
        return;
    }

    list.forEach(item=>{

        const realIndex =
        getList().findIndex(v=>v.id===item.id);

        tbody.innerHTML += `
        <tr>
            <td>${item.number}</td>
            <td>${item.name}</td>
            <td>${maskPhone(item.phone)}</td>
            <td>${item.people}</td>
            <td>${item.slot}</td>
            <td>${item.time}</td>
            <td>${statusBadge(item.status)}</td>
            <td>
                <button class="mini-btn"
                onclick="callQueue(${realIndex})">
                叫號
                </button>

                <button class="mini-btn btn-blue"
                onclick="doneQueue(${realIndex})">
                完成
                </button>

                <button class="mini-btn btn-red"
                onclick="cancelQueue(${realIndex})">
                取消
                </button>
            </td>
        </tr>
        `;
    });

    renderStats();
}

function statusBadge(status){

    const map = {
        waiting:["等待中","waiting"],
        called:["已叫號","called"],
        done:["已完成","done"],
        cancel:["已取消","cancel"]
    };

    const t = map[status] || [status,"waiting"];

    return `
    <span class="status-pill ${t[1]}">
    ${t[0]}
    </span>
    `;
}

// -------------------------
// 狀態操作
// -------------------------
function callQueue(index){

    let list = getList();

    list[index].status = "called";

    saveList(list);
    saveCalled(list[index]);

    playBeep();

    renderAdmin();
    renderScreen();
}

function doneQueue(index){

    let list = getList();

    list[index].status = "done";

    saveList(list);

    renderAdmin();
}

function cancelQueue(index){

    let list = getList();

    list[index].status = "cancel";

    saveList(list);

    renderAdmin();
}

function callNext(){

    let list = getList();

    const idx =
    list.findIndex(v=>v.status==="waiting");

    if(idx === -1){
        alert("目前沒有等待名單");
        return;
    }

    callQueue(idx);
}

// -------------------------
// 統計
// -------------------------
function renderStats(){

    const list = getList();

    const waiting =
    list.filter(v=>v.status==="waiting").length;

    const done =
    list.filter(v=>v.status==="done").length;

    setText("waitingCount",waiting);
    setText("doneCount",done);
    setText("totalCount",list.length);
}

// -------------------------
// Screen 畫面
// -------------------------
function renderScreen(){

    const current =
    getCalled();

    setText(
        "calledNumber",
        current ? current.number : "--"
    );

    const list = getList();

    const next =
    list.find(v=>v.status==="waiting");

    setText(
        "nextNumber",
        next ? next.number : "--"
    );

    const waiting =
    list.filter(v=>v.status==="waiting").length;

    setText("waitingCount",waiting);
    setText("totalCount",list.length);
}

// -------------------------
// 搜尋事件
// -------------------------
function bindSearch(){

    const input =
    document.getElementById("searchInput");

    const filter =
    document.getElementById("filterSlot");

    if(input){
        input.addEventListener(
            "input",
            renderAdmin
        );
    }

    if(filter){
        filter.addEventListener(
            "change",
            renderAdmin
        );
    }
}

// -------------------------
// 清空資料
// -------------------------
function clearAll(){

    if(!confirm("確定清空所有候補資料？"))
        return;

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CALLED_KEY);

    renderAdmin();
    renderScreen();
}

// -------------------------
// 匯出 CSV
// -------------------------
function exportCSV(){

    const list = getList();

    let csv =
    "號碼,姓名,電話,人數,梯次,時間,狀態\n";

    list.forEach(v=>{

        csv +=
        `${v.number},${v.name},${v.phone},${v.people},${v.slot},${v.time},${v.status}\n`;
    });

    const blob =
    new Blob([csv],{
        type:"text/csv;charset=utf-8;"
    });

    const a =
    document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = "後慈湖候補名單.csv";
    a.click();
}

// -------------------------
// 音效
// -------------------------
function playBeep(){

    try{

        const ctx =
        new(window.AudioContext ||
        window.webkitAudioContext)();

        const osc =
        ctx.createOscillator();

        osc.type = "sine";
        osc.frequency.value = 880;

        osc.connect(ctx.destination);
        osc.start();

        osc.stop(
            ctx.currentTime + 0.2
        );

    }catch(e){}
}

// -------------------------
// 官方梯次資訊
// -------------------------
async function loadOfficialSlots(){

    const area =
    document.getElementById("slotArea");

    if(!area) return;

    area.innerHTML = "讀取官方梯次資訊中...";

    try{

        const res =
        await fetch(officialUrl);

        const html =
        await res.text();

        const parser =
        new DOMParser();

        const doc =
        parser.parseFromString(
            html,"text/html"
        );

        const text =
        doc.body.innerText;

        const slots =
        parseSlots(text);

        if(slots.length===0){

            area.innerHTML =
            "目前無法取得資料";

            return;
        }

        renderSlots(slots);

    }catch(e){

        area.innerHTML =
        "⚠ 無法抓取官方資料";
    }
}

function parseSlots(text){

    const lines =
    text.split("\n")
    .map(v=>v.trim())
    .filter(v=>v);

    let arr = [];

    lines.forEach(line=>{

        const m =
        line.match(
        /(\d{2}:\d{2}).*(尚餘\s*\d+\s*名|額滿|可報名|尚可報名)/
        );

        if(m){

            arr.push({
                time:m[1],
                status:m[2]
            });
        }
    });

    return arr;
}

function renderSlots(slots){

    const area =
    document.getElementById("slotArea");

    let html = "";

    slots.forEach(v=>{

        let color = "#198754";

        if(v.status.includes("額滿"))
            color="#dc3545";

        if(v.status.includes("尚餘"))
            color="#fd7e14";

        html += `
        <div class="slot-card">
            <div class="slot-time">
                ${v.time}
            </div>
            <div class="slot-status"
            style="color:${color}">
                ${v.status}
            </div>
        </div>
        `;
    });

    area.innerHTML = html;
}

// -------------------------
// 啟動
// -------------------------
initForm();
bindSearch();
renderAdmin();
renderScreen();
renderStats();
loadOfficialSlots();

// screen 自動刷新
setInterval(()=>{
    renderScreen();
},3000);