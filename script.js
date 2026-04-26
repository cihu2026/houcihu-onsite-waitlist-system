// ======================================
// 後慈湖現場補位系統 完整版 script.js
// 適用：index.html / admin.html / screen.html
// 純前端 GitHub Pages 版
// localStorage 儲存
// ======================================

// ------------------------------
// 基本設定
// ------------------------------
const STORAGE_KEY = "houcihu_waitlist_data";
const CALLED_KEY = "houcihu_called_data";

// 官方網址（如失效可自行更換）
const officialUrl =
"https://backcihu.tycg.gov.tw/select-day.aspx?d=DA08FE4346271B109515C1431C448B2874BF30BBC3BD489450D0806F1AF9C9D31B4A88E59D76FB4E";

// ------------------------------
// 讀取 / 儲存
// ------------------------------
function getList(){
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveList(list){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getCalled(){
    return JSON.parse(localStorage.getItem(CALLED_KEY)) || null;
}

function saveCalled(data){
    localStorage.setItem(CALLED_KEY, JSON.stringify(data));
}

// ------------------------------
// 產生號碼
// ------------------------------
function generateNumber(){

    let list = getList();
    let next = list.length + 1;

    return "A" + String(next).padStart(3,"0");
}

// ------------------------------
// 報名功能（index.html）
// ------------------------------
function initForm(){

    const form = document.getElementById("queueForm");

    if(!form) return;

    form.addEventListener("submit", function(e){

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
            number: generateNumber(),
            name: name,
            phone: phone,
            people: people,
            slot: slot,
            status: "waiting",
            time: nowTime()
        };

        list.push(item);

        saveList(list);

        alert(
            "候補成功！\n" +
            "您的號碼：" + item.number
        );

        form.reset();

    });
}

// ------------------------------
// 現在時間
// ------------------------------
function nowTime(){

    const d = new Date();

    return d.getHours().toString().padStart(2,"0")
    + ":" +
    d.getMinutes().toString().padStart(2,"0");
}

// ------------------------------
// 管理後台（admin.html）
// ------------------------------
function renderAdmin(){

    const tbody =
    document.getElementById("queueTable");

    if(!tbody) return;

    let list = getList();

    tbody.innerHTML = "";

    if(list.length === 0){

        tbody.innerHTML =
        `<tr><td colspan="8">目前無候補資料</td></tr>`;

        return;
    }

    list.forEach((item,index)=>{

        tbody.innerHTML += `
        <tr>
            <td>${item.number}</td>
            <td>${item.name}</td>
            <td>${maskPhone(item.phone)}</td>
            <td>${item.people}</td>
            <td>${item.slot}</td>
            <td>${item.time}</td>
            <td>${statusText(item.status)}</td>
            <td>
                <button onclick="callQueue(${index})">叫號</button>
                <button onclick="doneQueue(${index})">完成</button>
                <button onclick="removeQueue(${index})">取消</button>
            </td>
        </tr>
        `;
    });

    renderStats();
}

// ------------------------------
// 電話遮罩
// ------------------------------
function maskPhone(phone){

    if(phone.length < 4) return phone;

    return phone.substring(0,4) + "****";
}

// ------------------------------
// 狀態文字
// ------------------------------
function statusText(status){

    if(status === "waiting") return "等待中";
    if(status === "called") return "已叫號";
    if(status === "done") return "已完成";
    if(status === "cancel") return "已取消";

    return status;
}

// ------------------------------
// 叫號
// ------------------------------
function callQueue(index){

    let list = getList();

    list[index].status = "called";

    saveList(list);
    saveCalled(list[index]);

    renderAdmin();
    renderScreen();
}

// ------------------------------
// 完成
// ------------------------------
function doneQueue(index){

    let list = getList();

    list[index].status = "done";

    saveList(list);

    renderAdmin();
}

// ------------------------------
// 取消
// ------------------------------
function removeQueue(index){

    let list = getList();

    list[index].status = "cancel";

    saveList(list);

    renderAdmin();
}

// ------------------------------
// 自動叫下一位
// ------------------------------
function callNext(){

    let list = getList();

    const index =
    list.findIndex(item =>
        item.status === "waiting"
    );

    if(index === -1){
        alert("沒有等待名單");
        return;
    }

    callQueue(index);
}

// ------------------------------
// 統計資料
// ------------------------------
function renderStats(){

    const list = getList();

    const waiting =
    list.filter(v=>v.status==="waiting").length;

    const done =
    list.filter(v=>v.status==="done").length;

    const total = list.length;

    setText("waitingCount", waiting);
    setText("doneCount", done);
    setText("totalCount", total);
}

// ------------------------------
// 叫號畫面（screen.html）
// ------------------------------
function renderScreen(){

    const calledBox =
    document.getElementById("calledNumber");

    if(!calledBox) return;

    const data = getCalled();

    if(data){
        calledBox.innerText = data.number;
    }else{
        calledBox.innerText = "--";
    }

    const list = getList();

    const next =
    list.find(v=>v.status==="waiting");

    setText("nextNumber",
        next ? next.number : "--"
    );

    const waiting =
    list.filter(v=>v.status==="waiting").length;

    setText("waitingCount", waiting);
}

// ------------------------------
// 共用文字更新
// ------------------------------
function setText(id,value){

    const el = document.getElementById(id);

    if(el){
        el.innerText = value;
    }
}

// ------------------------------
// 清空資料
// ------------------------------
function clearAll(){

    if(!confirm("確定清空全部資料？")) return;

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CALLED_KEY);

    renderAdmin();
    renderScreen();
}

// ------------------------------
// 官方梯次資料抓取
// ------------------------------
async function loadOfficialSlots(){

    const area =
    document.getElementById("slotArea");

    if(!area) return;

    area.innerHTML = "讀取官方梯次資料中...";

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

        if(slots.length === 0){

            area.innerHTML =
            "目前無法取得官方資料";

            return;
        }

        renderSlots(slots);

    }catch(e){

        area.innerHTML =
        "⚠ 無法直接抓取官方網站（可能跨站限制）";
    }
}

// ------------------------------
// 梯次解析
// ------------------------------
function parseSlots(text){

    const lines =
    text.split("\n")
    .map(v=>v.trim())
    .filter(v=>v);

    let result = [];

    lines.forEach(line=>{

        const m =
        line.match(/(\d{2}:\d{2}).*(尚餘\s*\d+\s*名|額滿|可報名|尚可報名)/);

        if(m){

            result.push({
                time:m[1],
                status:m[2]
            });
        }
    });

    return result;
}

// ------------------------------
// 梯次畫面
// ------------------------------
function renderSlots(slots){

    const area =
    document.getElementById("slotArea");

    let html = "";

    slots.forEach(item=>{

        let color = "#198754";

        if(item.status.includes("額滿"))
            color = "#dc3545";

        if(item.status.includes("尚餘"))
            color = "#fd7e14";

        html += `
        <div class="slot-card">
            <div class="slot-time">
                ${item.time}
            </div>
            <div class="slot-status"
            style="color:${color}">
                ${item.status}
            </div>
        </div>
        `;
    });

    area.innerHTML = html;
}

// ------------------------------
// 啟動
// ------------------------------
initForm();
renderAdmin();
renderScreen();
loadOfficialSlots();

// screen 每5秒更新
setInterval(renderScreen,5000);