const WEB_APP_URL =
"https://script.google.com/macros/s/AKfycbwMCPz4MM9IIbyLbdYeA8PlvosY6pbmOjGa3xmeUvnQv2Vmg1S4ozIOZ9O8Hq58crtv/exec";

// 讀取資料
async function cloudGet(){

  const res = await fetch(
    WEB_APP_URL + "?t=" + Date.now()
  );

  return await res.json();
}

// 新增候補
async function addQueue(name, people, slot){

  const rows = await cloudGet();

  const no =
    "A" +
    String(rows.length).padStart(3,"0");

  const res = await fetch(WEB_APP_URL,{
    method:"POST",
    body:new URLSearchParams({
      action:"add",
      number:no,
      name:name,
      phone:"",
      people:people,
      slot:slot,
      status:"waiting"
    })
  });

  return res.ok;
}

// 更新狀態
async function updateStatus(row,status){

  const res = await fetch(WEB_APP_URL,{
    method:"POST",
    body:new URLSearchParams({
      action:"update",
      row:row,
      status:status
    })
  });

  return res.ok;
}

// 到場
async function doneNumber(row){
  return await updateStatus(row,"done");
}

// 取消
async function cancelNumber(row){
  return await updateStatus(row,"cancel");
}

// 叫號
async function callNext(){

  const rows = await cloudGet();

  for(let i=1;i<rows.length;i++){

    if(rows[i][5]==="waiting"){

      await updateStatus(i+1,"called");
      return true;
    }
  }

  return false;
}

// 清空
async function clearQueue(){

  const res = await fetch(WEB_APP_URL,{
    method:"POST",
    body:new URLSearchParams({
      action:"clear"
    })
  });

  return res.ok;
}

// 自動同步
function autoSync(callback,ms=3000){

  setInterval(async()=>{

    const data = await cloudGet();

    if(callback) callback(data);

  },ms);
}
