const WEB_APP_URL="https://script.google.com/macros/s/AKfycbzS19HoxvnQDDPVmO4ZG9FLZaKy9JaFREA7z_OaiXxZ-bcae185QatC16VJM0IZGNjG/exec";
async function cloudGet(){try{let r=await fetch(WEB_APP_URL);return await r.json();}catch(e){return null}}
async function cloudSave(data){try{await fetch(WEB_APP_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});}catch(e){}}
