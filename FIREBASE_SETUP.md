# Firebase 設定指南

## 設定步驟

### 1. 建立 Firebase 專案
1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「建立專案」
3. 輸入專案名稱並按照步驟完成建立

### 2. 啟用 Realtime Database
1. 在 Firebase Console 中選擇您的專案
2. 在左側選單中選擇「Realtime Database」
3. 點擊「建立資料庫」
4. 選擇「以測試模式開始」(或根據需求設定安全規則)

### 3. 取得專案配置資訊
1. 在 Firebase Console 中，點擊專案設定 (齒輪圖示)
2. 在「一般」頁籤中，找到「您的應用程式」區域
3. 點擊「</> 網頁」圖示新增應用程式
4. 複製配置物件

### 4. 更新配置檔案
編輯 `firebase-config.js` 檔案，將配置資訊填入：

```javascript
const firebaseConfig = {
    apiKey: "您的API金鑰",
    authDomain: "您的專案ID.firebaseapp.com", 
    databaseURL: "https://您的專案ID-default-rtdb.firebaseio.com/",
    projectId: "您的專案ID",
    storageBucket: "您的專案ID.appspot.com",
    messagingSenderId: "您的發送者ID",
    appId: "您的應用程式ID"
};
```

### 5. 資料庫結構
資料將會以下列格式儲存在 Realtime Database 中：

```json
{
  "mat_presses": {
    "-NxXxXxXxXxXxXxX": {
      "timestamp": "2025/11/11 上午10:30:15",
      "groupId": "A",
      "matNumber": 1,
      "date": "2025-11-11T02:30:15.123Z",
      "sessionId": "session_1699677015123_abc123def"
    }
  }
}
```

## 安全規則 (建議)

在 Firebase Console 的 Realtime Database 規則頁面中，設定以下規則：

```json
{
  "rules": {
    "mat_presses": {
      ".read": true,
      ".write": true,
      "$pushId": {
        ".validate": "newData.hasChildren(['timestamp', 'groupId', 'matNumber', 'date', 'sessionId'])"
      }
    }
  }
}
```

## 使用方式

1. 確保已完成上述設定
2. 在網頁中放置地墊並按下
3. 每次按下都會同時記錄到本地介面和 Firebase Realtime Database
4. 可以在 Firebase Console 中即時查看資料

## 注意事項

- `firebase-config.js` 檔案已加入 `.gitignore`，不會被推送到 GitHub
- 如果 Firebase 連線失敗，系統仍會正常運作，只是不會上傳資料
- 建議在生產環境中設定更嚴格的安全規則
- 每個會話會有獨特的 sessionId 來區分不同的使用階段

## 故障排除

1. **Firebase SDK 載入失敗**：檢查網路連線和 CDN 連結
2. **配置錯誤**：確認 `firebase-config.js` 中的所有資訊正確
3. **權限拒絕**：檢查 Realtime Database 的安全規則設定
4. **CORS 錯誤**：確保在支援的網域下執行，或使用本地服務器