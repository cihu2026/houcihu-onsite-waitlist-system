# 後慈湖現場候補叫號系統 v14.7 Privacy Guard

提供後慈湖園區現場候補旅客之數位化管理方案，整合候補登記、即時叫號、梯次控管、手機作業、雲端同步、公開看板與去識別化營運儀表板。

---

## 專案簡介

本系統以 GitHub Pages 前端頁面搭配 Google Apps Script / Google Sheets 作為雲端資料來源，適用於現場服務櫃台、工作人員手機、旅客自助登記、入口資訊看板與即時梯次查詢。

v14.7 重點為 Privacy Guard：公開頁只顯示叫號、等待組數與梯次資訊；完整候補名單、姓名與電話僅限後台金鑰驗證後查看。

---

## GitHub Pages

https://cihu2026.github.io/houcihu-onsite-waitlist-system/

---

## 系統頁面

| 檔案名稱 | 功能說明 | 權限層級 |
|---|---|---|
| `index.html` | 系統入口首頁 | 公開去識別 |
| `visitor.html` | 旅客服務首頁 | 公開去識別 |
| `checkin.html` | 現場候補登記 | 公開填寫 |
| `status.html` | 即時梯次資訊 | 公開去識別 |
| `screen.html` | 即時叫號看板 | 公開去識別 |
| `dashboard.html` | 智慧營運儀表板 | 公開去識別 |
| `report.html` | 公開報表 | 公開去識別 |
| `calendar.html` | 營運資訊與休園日曆 | 公開 |
| `admin-login.html` | 後台登入 | 需 ADMIN_KEY |
| `admin.html` | 管理後台、叫號、補位、報表 | 需 ADMIN_KEY |
| `mobile.html` | 手機版現場管理 | 需 ADMIN_KEY |
| `sheets.js` | Google Apps Script / Sheets 雲端同步 | 共用 API helper |
| `script.js` | 後台與手機版操作邏輯 | 後台使用 |
| `apps-script/Code.gs` | Apps Script 後端正式版 | 需貼到 Apps Script 部署 |

---

## 隱私與安全設計

- 公開頁使用 `getPublicStatus()`，只顯示目前叫號、等待組數與梯次資訊。
- `mode=queue` 完整候補名單需通過 Apps Script 指令碼屬性 `ADMIN_KEY`。
- 旅客登記頁含個資告知文字。
- 後台登入會先驗證 `ADMIN_KEY`，錯誤不會進入後台。
- 公開報表與營運儀表板已改為去識別化，不再讀取完整姓名與電話。

---

## Apps Script 部署提醒

1. 將 `apps-script/Code.gs` 內容貼到 Apps Script 專案。
2. 到 Apps Script「專案設定 → 指令碼屬性」新增或確認：`ADMIN_KEY`。
3. 按「部署 → 管理部署作業 → 編輯 → 新版本 → 部署」。
4. 測試 `/exec?mode=queue` 未帶 key 應回傳 `unauthorized`。

---

## 技術架構

- HTML
- CSS
- JavaScript
- Google Apps Script
- Google Sheets
- GitHub Pages

---

Designed & Developed by Abby Luo
