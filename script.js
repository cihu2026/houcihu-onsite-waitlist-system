// Houcihu 候補透明版 script.js（雲端同步正式版）

let db = {};
let chosen = "";

/* =========================
   啟動
========================= */
window.onload = async function () {
  db = await initCloud();
  render();

  autoSync((cloudData) => {
    db = cloudData;
    render();
  });
};

/* =========================
   儲存
========================= */
async function save() {
  await cloudSave(db);
  render();
}

/* =========================
   畫面更新
========================= */
function render() {

  // 候補梯次卡片
  const g = document.getElementById("grid");

  if (g) {
    g.innerHTML = Object.keys(db.caps)
      .filter(id => db.open[id] === true)
      .map(id => card(id))
      .join("");
  }

  // 目前叫號
  document.querySelectorAll(".current").forEach(el => {
    el.textContent = db.current;
  });

}

/* =========================
   梯次卡片
========================= */
function card(id) {

  let remain = db.caps[id] - db.used[id];
  if (remain < 0) remain = 0;

  return `
  <div class="slot">
    <h3>第${id}梯</h3>
    <div>${db.times[id]}</div>
    <div class="ok">可候補 ${remain} 位</div>
    <button onclick="pick('${id}')">加入候補</button>
  </div>
  `;
}

/* =========================
   選擇梯次
========================= */
function pick(id) {
  chosen = id;

  document.getElementById("form").style.display = "block";
  document.getElementById("pick").innerText =
    "第" + id + "梯 " + db.times[id];
}

/* =========================
   客人登記
========================= */
async function reg() {

  let name =
    document.getElementById("name").value.trim();

  if (!name) {
    alert("請填姓名");
    return;
  }

  let count =
    parseInt(document.getElementById("count").value || 1);

  let remain = db.caps[chosen] - db.used[chosen];

  if (count > remain) {
    alert("剩餘名額不足");
    return;
  }

  let no = db.counter;

  db.counter++;
  db.used[chosen] += count;

  db.queue.push({
    no: "A" + String(no).padStart(3, "0"),
    name: name,
    count: count,
    session: chosen
  });

  await save();

  let ahead = no - parseInt(db.current.replace("A","")) - 1;
  if (ahead < 0) ahead = 0;

  document.getElementById("msg").innerHTML = `
  您已加入候補名單<br>
  號碼 A${String(no).padStart(3, "0")}<br>
  目前叫號 ${db.current}<br>
  前方尚有 ${ahead} 組<br>
  <span class="warn">
  完成登記不代表保證入場，將依現場名額安排
  </span>
  `;
}

/* =========================
   下一號（後台）
========================= */
async function nextNo() {

  if (db.queue.length > 0) {
    db.current = db.queue[0].no;
    db.queue.shift();
  } else {
    let num =
      parseInt(db.current.replace("A","")) + 1;

    db.current =
      "A" + String(num).padStart(3, "0");
  }

  await save();
}

/* =========================
   修改名額（後台）
========================= */
async function saveCap(id) {

  let val =
    parseInt(document.getElementById("cap" + id).value);

  if (isNaN(val)) {
    alert("請輸入正確數字");
    return;
  }

  db.caps[id] = val;

  await save();
}

/* =========================
   開關梯次（後台）
========================= */
async function toggleSession(id) {

  db.open[id] = !db.open[id];

  await save();
}