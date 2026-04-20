# multiCamMap - AI 感測器融合：多來源三鏡頭三角定位系統 (MJPEG 支援版)

[在 StackBlitz 下一代編輯器中編輯 ⚡️](https://stackblitz.com/~/github.com/hkscsheph/multiCamMap)

這是一個基於瀏覽器的 AI 實驗專案，利用 TensorFlow.js 和 COCO-SSD 模型實現即時的多來源攝影機感測器融合與目標定位。此 `mjpeg` 分支擴展了系統功能，使其能夠處理多種影片來源，包括 IP 攝影機。

## 專案簡介

本專案展示如何透過三路不同的影片串流（如 IP 攝影機、Webcam 或螢幕共享），結合 AI 物件偵測技術，在 2D 地圖上精確計算並標定目標物（如：人）的位置。系統採用「三向射線投射三角定位法」（3-Way Raycast Triangulation），只有當三台攝影機同時確認目標位置時，系統才會在情報地圖上標記目標。

## 核心功能

- **多來源支援**：
  - **MJPEG IP 攝影機**：支援透過 HTTP URL 接入標準 MJPEG 串流。
  - **Webcam**：支援裝置內建或外接的 Web 攝影機。
  - **螢幕共享 (Screen Share)**：支援將瀏覽器視窗或整個螢幕作為輸入來源。
- **即時 AI 偵測**：使用 TensorFlow.js 驅動的 COCO-SSD 模型，即時識別影片中的人物。
- **彈性配置界面**：新增攝影機來源配置面板，可針對每一路攝影機獨立選擇來源類型並輸入 MJPEG 網址。
- **三鏡頭三角定位**：透過演算法計算三條觀測射線的交點，實現高精度的目標定位。
- **互動式校準**：使用者可以在地圖上拖曳與旋轉攝影機圖示，即時校準攝影機的空間佈局。

## 技術棧

- **前端**：HTML5, CSS3, JavaScript (ES6+)
- **AI 框架**：TensorFlow.js (@tensorflow/tfjs)
- **模型**：COCO-SSD (@tensorflow-models/coco-ssd)
- **開發工具**：servor (輕量級開發伺服器)

## 快速開始

1. **安裝依賴**：
   ```bash
   npm install
   ```

2. **啟動開發伺服器**：
   ```bash
   npm start
   ```

3. **操作說明**：
   - 在頁面頂端的「Camera Source Configuration」面板配置各攝影機來源。
   - 若選擇 **MJPEG**，請輸入完整的串流網址（如：`http://192.168.1.100:8080/stream`）。
   - 點擊「CONNECT CAMERAS」或切換來源類型以啟動連接。
   - 在左側地圖中，拖曳攝影機圓點調整位置，在周圍拖曳滑鼠調整拍攝角度。
   - 當系統同時偵測到目標，地圖上將會出現 🐟 標記。

## 注意事項

- 使用 MJPEG 來源時，請確保攝影機支援 CORS 或與網頁同源，否則 AI 模型可能無法讀取像素數據。
- 本專案建議至少配置三路來源以達到最佳三角定位效果。
- 確保瀏覽器已獲取必要的媒體存取權限。
