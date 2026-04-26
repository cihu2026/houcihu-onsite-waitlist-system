// 直接取代你原本 script.js 裡的 setStatus()

async function setStatus(i, status) {

  let item = db.queue[i];
  if (!item) return;

  let oldStatus = item.status || "等待中";
  let session = item.session;
  let count = parseInt(item.count || 1);

  /* =========================
     需要補回名額的狀態
  ========================= */
  const returnStatus = ["取消", "未到場", "過號"];

  /* =========================
     若第一次變成取消類狀態
     自動補回名額
  ========================= */
  if (
    returnStatus.includes(status) &&
    !returnStatus.includes(oldStatus)
  ) {

    if (db.used && db.used[session] != null) {
      db.used[session] -= count;

      if (db.used[session] < 0) {
        db.used[session] = 0;
      }
    }

  }

  /* =========================
     若從取消改回有效狀態
     再扣回名額
  ========================= */
  if (
    !returnStatus.includes(status) &&
    returnStatus.includes(oldStatus)
  ) {

    if (db.used && db.used[session] != null) {
      db.used[session] += count;
    }

  }

  /* =========================
     更新狀態
  ========================= */
  item.status = status;

  await save();

  if (typeof renderQueue === "function") {
    renderQueue();
  }

  if (typeof render === "function") {
    render();
  }
}