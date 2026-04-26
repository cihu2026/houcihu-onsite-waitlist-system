// 後慈湖現場補位系統 script.js
// 純前端版（localStorage）
// 適用 index.html / admin.html / screen.html

const STORAGE_KEY = "houcihu_waitlist";
const CALL_KEY = "houcihu_called";

// ----------------------------
// 初始化
// ----------------------------
function getList() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveList(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getCalled() {
    return JSON.parse(localStorage.getItem(CALL_KEY)) || null;
}

function saveCalled(data) {
    localStorage.setItem(CALL_KEY, JSON.stringify(data));
}

// ----------------------------
// 產生號碼
// ----------------------------
function generateNumber(list) {
    const next = list.length + 1;
    return "A" + String(next).padStart(3, "0");
}

// ----------------------------
// 新增候補（index.html）
// ----------------------------
function addQueue(name, phone, people, slot) {
    let list = getList();

    const item = {
        number: generateNumber(list),
        name: name,
        phone: phone,
        people: people,
        slot: slot,
        time: new Date().toLocaleTimeString(),
        status: "waiting"
    };

    list.push(item);
    saveList(list);

    return item;
}

// ----------------------------
// index.html 表單送出
// ----------------------------
const queueForm = document.getElementById("queueForm");

if (queueForm) {
    queueForm.addEventListener("submit", function(e) {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const phone = document.getElementById("phone").value;
        const people = document.getElementById("people").value;
        const slot = document.getElementById("slot").value;

        const result = addQueue(name, phone, people, slot);

        alert("報名成功！您的候補號碼：" + result.number);

        queueForm.reset();
    });
}

// ----------------------------
// admin.html 渲染名單
// ----------------------------
function renderAdmin() {
    const tableBody = document.getElementById("queueTable");

    if (!tableBody) return;

    let list = getList();

    tableBody.innerHTML = "";

    list.forEach((item, index) => {

        tableBody.innerHTML += `
        <tr>
            <td>${item.number}</td>
            <td>${item.name}</td>
            <td>${item.phone}</td>
            <td>${item.people}</td>
            <td>${item.slot}</td>
            <td>${item.time}</td>
            <td>${item.status}</td>
            <td>
                <button onclick="callQueue(${index})">叫號</button>
                <button onclick="removeQueue(${index})">取消</button>
            </td>
        </tr>
        `;
    });
}

// ----------------------------
// 叫號
// ----------------------------
function callQueue(index) {
    let list = getList();

    list[index].status = "called";
    saveList(list);
    saveCalled(list[index]);

    renderAdmin();
    renderScreen();
}

// ----------------------------
// 取消
// ----------------------------
function removeQueue(index) {
    let list = getList();

    list.splice(index, 1);

    saveList(list);
    renderAdmin();
}

// ----------------------------
// 自動叫下一位
// ----------------------------
function callNext() {
    let list = getList();

    const next = list.find(item => item.status === "waiting");

    if (!next) {
        alert("目前沒有等待名單");
        return;
    }

    next.status = "called";

    saveList(list);
    saveCalled(next);

    renderAdmin();
    renderScreen();
}

// ----------------------------
// screen.html 顯示目前叫號
// ----------------------------
function renderScreen() {
    const calledBox = document.getElementById("calledNumber");

    if (!calledBox) return;

    const data = getCalled();

    if (data) {
        calledBox.innerText = data.number;
    } else {
        calledBox.innerText = "--";
    }
}

// ----------------------------
// 清空資料（測試用）
// ----------------------------
function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CALL_KEY);

    renderAdmin();
    renderScreen();
}

// ----------------------------
// 啟動
// ----------------------------
renderAdmin();
renderScreen();