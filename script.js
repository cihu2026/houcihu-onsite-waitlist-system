// =======================================================
// 後慈湖現場補位系統 Google Sheets 雲端同步版 script.js
// 適用：index.html / admin.html / screen.html
// GitHub Pages + Google Apps Script + Google Sheets
// =======================================================

// --------------------------------------
// 請改成你的 Apps Script Web App 網址
// --------------------------------------
const API_URL =
"https://script.google.com/macros/s/AKfycbwMCPz4MM9IIbyLbdYeA8PlvosY6pbmOjGa3xmeUvnQv2Vmg1S4ozIOZ9O8Hq58crtv/exec";

// --------------------------------------
// 共用工具
// --------------------------------------
function setText(id,val){

    const el =
    document.getElementById(id);

    if(el) el.innerText = val;
}

function nowTime(){

    const d = new Date();

    return d.getHours()
    .toString()
    .padStart(2,"0")

    + ":" +

    d.getMinutes()
    .toString()
    .padStart(2,"0");
}

function statusText(status){

    const map = {
        waiting:"等待中",
        called:"已叫號",
        done:"已完成",
        cancel:"已取消"
    };

    return map[status] || status;
}

function statusBadge(status){

    let cls = "waiting";

    if(status==="called") cls="called";
    if(status==="done") cls="done";
    if(status==="cancel") cls="cancel";

    return `
    <span class="status-pill ${cls}">
    ${statusText(status)}
    </span>
    `;
}

function maskPhone(phone){

    if(!phone) return "";

    if(phone.length <= 4) return phone;

    return phone.substring(0,4) + "****";
}

// --------------------------------------
// 取得資料
// --------------------------------------
async function fetchRows(){

    const res =
    await fetch(API_URL);

    const data =
    await res.json();

    return data;
}

// --------------------------------------
// 取得下一號碼
// --------------------------------------
async function nextNumber(){

    const rows =
    await fetchRows();

    const no =
    rows.length;

    return "A" +
    String(no)
    .padStart(3,"0");
}

// --------------------------------------
// index.html 報名功能
// --------------------------------------
function initForm(){

    const form =
    document.getElementById("queueForm");

    if(!form) return;

    form.addEventListener(
        "submit",
        async function(e){

        e.preventDefault();

        const name =
        document.getElementById("name").value.trim();

        const phone =
        document.getElementById("phone").value.trim();

        const people =
        document.getElementById("people").value;

        const slot =
        document.getElementById("slot").value;

        if(name===""){
            alert("請輸入姓名");
            return;
        }

        const number =
        await nextNumber();

        const body =
        new URLSearchParams({
            action:"add",
            number:number,
            name:name,
            phone:phone,
            people:people,
            slot:slot,
            status:"waiting",
            time:nowTime()
        });

        await fetch(API_URL,{
            method:"POST",
            body:body
        });

        alert(
            "候補成功！\n您的號碼：" +
            number
        );

        form.reset();

    });
}

// --------------------------------------
// admin.html 後台
// --------------------------------------
async function renderAdmin(){

    const tbody =
    document.getElementById("queueTable");

    if(!tbody) return;

    tbody.innerHTML =
    `<tr><td colspan="8">載入中...</td></tr>`;

    const rows =
    await fetchRows();

    tbody.innerHTML = "";

    if(rows.length <= 1){

        tbody.innerHTML =
        `<tr><td colspan="8">目前無資料</td></tr>`;

        renderStats([]);
        return;
    }

    const data =
    rows.slice(1);

    data.forEach((row,index)=>{

        const number = row[0];
        const name   = row[1];
        const phone  = row[2];
        const people = row[3];
        const slot   = row[4];
        const status = row[5];
        const time   = row[6];

        tbody.innerHTML += `
        <tr>
            <td>${number}</td>
            <td>${name}</td>
            <td>${maskPhone(phone)}</td>
            <td>${people}</td>
            <td>${slot}</td>
            <td>${time}</td>
            <td>${statusBadge(status)}</td>
            <td>

            <button
            class="mini-btn"
            onclick="updateStatus(${index+2},'called')">
            叫號
            </button>

            <button
            class="mini-btn btn-blue"
            onclick="updateStatus(${index+2},'done')">
            完成
            </button>

            <button
            class="mini-btn btn-red"
            onclick="updateStatus(${index+2},'cancel')">
            取消
            </button>

            </td>
        </tr>
        `;
    });

    renderStats(data);
}

// --------------------------------------
// 更新狀態
// row = Sheet 第幾列
// --------------------------------------
async function updateStatus(row,status){

    const body =
    new URLSearchParams({
        action:"update",
        row:row,
        status:status
    });

    await fetch(API_URL,{
        method:"POST",
        body:body
    });

    renderAdmin();
    renderScreen();
}

// --------------------------------------
// 自動叫下一位
// --------------------------------------
async function callNext(){

    const rows =
    await fetchRows();

    const data =
    rows.slice(1);

    for(let i=0;i<data.length;i++){

        if(data[i][5] === "waiting"){

            updateStatus(i+2,"called");
            return;
        }
    }

    alert("目前沒有等待名單");
}

// --------------------------------------
// 統計
// --------------------------------------
function renderStats(data){

    const waiting =
    data.filter(v=>v[5]==="waiting").length;

    const done =
    data.filter(v=>v[5]==="done").length;

    setText("waitingCount",waiting);
    setText("doneCount",done);
    setText("totalCount",data.length);
}

// --------------------------------------
// screen.html
// --------------------------------------
async function renderScreen(){

    const rows =
    await fetchRows();

    const data =
    rows.slice(1);

    const called =
    data.find(v=>v[5]==="called");

    const waiting =
    data.find(v=>v[5]==="waiting");

    setText(
        "calledNumber",
        called ? called[0] : "--"
    );

    setText(
        "nextNumber",
        waiting ? waiting[0] : "--"
    );

    setText(
        "waitingCount",
        data.filter(v=>v[5]==="waiting").length
    );

    setText(
        "totalCount",
        data.length
    );
}

// --------------------------------------
// 清空全部
// --------------------------------------
async function clearAll(){

    if(!confirm("確定清空全部資料？"))
        return;

    const body =
    new URLSearchParams({
        action:"clear"
    });

    await fetch(API_URL,{
        method:"POST",
        body:body
    });

    renderAdmin();
    renderScreen();
}

// --------------------------------------
// 自動更新
// --------------------------------------
setInterval(()=>{

    renderAdmin();
    renderScreen();

},5000);

// --------------------------------------
// 啟動
// --------------------------------------
initForm();
renderAdmin();
renderScreen();
