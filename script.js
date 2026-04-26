// ===============================
// 後慈湖官方頁抓梯次名額完整版
// 可直接貼到 script.js
// GitHub Pages / 純前端版
// ===============================

// 官方頁網址（請自行替換最新網址）
const officialUrl =
"https://backcihu.tycg.gov.tw/select-day.aspx?d=DA08FE4346271B109515C1431C448B2874BF30BBC3BD489450D0806F1AF9C9D31B4A88E59D76FB4E";

// 畫面顯示區（index.html 需有 <div id="slotArea"></div>）
const slotArea = document.getElementById("slotArea");

// ----------------------------
// 主程式
// ----------------------------
async function loadOfficialSlots(){

    if(!slotArea) return;

    slotArea.innerHTML = "讀取官方梯次資料中...";

    try{

        const res = await fetch(officialUrl);
        const html = await res.text();

        // 解析 HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html,"text/html");

        // 取整頁文字
        const text = doc.body.innerText;

        // 找出梯次資料
        const slots = parseSlots(text);

        if(slots.length === 0){
            slotArea.innerHTML = "目前無法取得梯次資料";
            return;
        }

        renderSlots(slots);

    }catch(err){

        console.log(err);

        slotArea.innerHTML =
        "無法直接抓取官方網站（可能被 CORS 限制）";

    }

}

// ----------------------------
// 解析文字中的梯次資訊
// 範例：09:30 尚餘3名
//       10:00 額滿
// ----------------------------
function parseSlots(text){

    const lines = text.split("\n").map(v => v.trim()).filter(v => v);

    const result = [];

    lines.forEach(line => {

        const match = line.match(/(\d{2}:\d{2}).*(尚餘\s*\d+\s*名|額滿|尚可報名|可報名)/);

        if(match){

            result.push({
                time: match[1],
                status: match[2]
            });

        }

    });

    return result;
}

// ----------------------------
// 顯示卡片
// ----------------------------
function renderSlots(slots){

    let html = `
    <div style="
        font-size:28px;
        font-weight:800;
        color:#14532d;
        margin-bottom:16px;">
        官方梯次資訊
    </div>
    `;

    slots.forEach(item => {

        let color = "#198754";

        if(item.status.includes("額滿")) color = "#dc3545";
        if(item.status.includes("尚餘")) color = "#fd7e14";

        html += `
        <div style="
            background:#fff;
            border-radius:18px;
            padding:18px;
            margin-bottom:14px;
            box-shadow:0 8px 20px rgba(0,0,0,.08);
            display:flex;
            justify-content:space-between;
            align-items:center;
        ">

            <div style="
                font-size:24px;
                font-weight:800;
                color:#14532d;">
                ${item.time}
            </div>

            <div style="
                font-size:18px;
                font-weight:700;
                color:${color};">
                ${item.status}
            </div>

        </div>
        `;
    });

    slotArea.innerHTML = html;
}

// ----------------------------
// 啟動
// ----------------------------
loadOfficialSlots();