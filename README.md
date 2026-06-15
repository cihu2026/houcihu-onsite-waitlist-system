# 後慈湖現場候補叫號系統 v14 Field Pro

提供後慈湖園區現場候補旅客之數位化管理方案，整合候補登記、即時叫號、梯次控管、手機作業、雲端同步與公開看板，提升現場服務效率與旅客體驗。

---

## 專案簡介

本系統以 GitHub Pages 前端頁面搭配 Google Apps Script / Google Sheets 作為雲端資料來源，適用於現場服務櫃台、工作人員手機、旅客自助登記、入口資訊看板與即時梯次查詢。

v14 重點為整體介面一致化、手機操作優化、後台叫號真正同步雲端、梯次補位流程整理、表格報表輸出與看板可讀性提升。

---

## 系統特色

- QR Code 現場候補登記
- 旅客自行填寫姓名、電話、人數與希望梯次
- 工作人員後台管理候補名單
- 手機版大按鈕快速叫號與到場標記
- 電視／櫃台即時叫號看板
- 即時梯次剩餘名額顯示
- Google Sheets 雲端同步
- CSV 報表下載
- GitHub Pages 免費部署

---

## 系統頁面

| 檔案名稱 | 功能說明 |
|---|---|
| `index.html` | 系統入口首頁 |
| `visitor.html` | 旅客服務首頁 |
| `checkin.html` | 現場候補登記 |
| `admin-login.html` | 後台登入 |
| `admin.html` | 管理後台、叫號、補位、報表 |
| `mobile.html` | 手機版現場管理 |
| `screen.html` | 即時叫號看板 |
| `status.html` | 即時梯次資訊 |
| `calendar.html` | 營運資訊與休園日曆 |
| `theme.css` | 全站共用視覺樣式 |
| `sheets.js` | Google Apps Script / Sheets 雲端同步 |
| `script.js` | 後台與手機版操作邏輯 |

---

## Demo

GitHub Pages：

https://cihu2026.github.io/houcihu-onsite-waitlist-system/

---

## 技術架構

- HTML
- CSS
- JavaScript
- Google Apps Script
- Google Sheets
- GitHub Pages

---

## v14 優化內容

### 介面美化

建立 `theme.css` 共用設計系統，統一按鈕、卡片、表格、看板、手機版與色彩語彙，讓旅客端、後台端與看板端視覺一致。

### 手機友善

手機管理頁改為現場大按鈕配置，適合櫃台、雨天或移動作業快速點選。

### 叫號同步

後台「下一號叫號」會真正更新 Google Sheets 狀態為 `called`，並同步扣除該梯次剩餘名額，讓 `screen.html`、`status.html`、`visitor.html` 可同步顯示目前叫號。

### 候補登記修正

候補登記頁修正人數判斷，10 人以上改由現場人員協助；手機號碼格式檢查與重複登記提醒也重新整理。

### 報表與補位

後台支援 CSV 匯出，並提供梯次補位功能：優先補同梯次旅客，其次補可接受其他梯次者。

---

## 使用情境

適用於：

- 景區現場補位管理
- 候補叫號系統
- 活動報到排隊
- 名額釋出管理
- 志工櫃台現場作業
- 旅客資訊看板

---

## 注意事項

現場遞補不代表一定有名額，實際入場資格仍依現場名額與工作人員安排為準。

登入頁目前為前端簡易登入保護，適合作為現場操作分流；若未來要提高安全性，建議改為後端驗證或 Google 帳號權限控管。

---

## 維護資訊

Designed, Developed and Maintained by Abby Luo.

Developer: Abby Luo  
Production Version: v14 Field Pro
