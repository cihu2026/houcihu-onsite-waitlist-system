/*
Houcihu Onsite Waitlist System
script-hotfix.js v14.1
Fixes next-call flow to avoid nested runSafe calls.
*/

window.callNextAndReload = async function callNextAndReloadFixed(){
  await runSafe(async () => {
    const rows = await cloudGet();
    latestRows = rows;

    for(let i = 1; i < rows.length; i++){
      if(normalizeStatus(rows[i][5]) !== "waiting") continue;

      const rowNo = i + 1;
      const row = rows[i];
      const no = row?.[0] || "A000";
      const people = parsePeople(row?.[3]);
      const slotNo = parseSlot(row?.[4]).slotNo;

      await updateStatus(rowNo, "called");
      await reduceCap(slotNo, people);
      toast(`${no} 已叫號`, "ok");
      await loadAdmin();
      voiceCall(no);
      return;
    }

    toast("已無等待中的候補", "danger");
  }, "叫號中...");
};
