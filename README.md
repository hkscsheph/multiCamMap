# multiCamMap - AI 感測器融合：多來源三角定位系統 (RTSP & YOLOv8 支援版)

[在 StackBlitz 下一代編輯器中編輯 ⚡️](https://stackblitz.com/~/github.com/hkscsheph/multiCamMap)

這是一個基於瀏覽器的 AI 實驗專案，利用 TensorFlow.js 實現即時的多來源攝影機感測器融合與目標定位。此版本擴展了對 RTSP 串流的支援，並引入了 YOLOv8 Nano 模型以提升偵測精確度。

## 專案簡介

本專案展示如何透過多路影片串流（如 RTSP/MJPEG IP 攝影機、Webcam 或螢幕共享），結合 AI 物件偵測技術，在 2D 地圖上精確計算並標定目標物（如：人）的位置。系統採用射線投射三角定位法，支援 $N$ 台攝影機的感測器融合。

## 核心功能

- **雙 AI 引擎切換**：
  - **COCO-SSD**：輕量級、快速，適合多數瀏覽器環境。
  - **YOLOv8 Nano**：高精確度、邊框緊湊，提供更穩定的定位效果（按需載入）。
- **多來源支援**：
  - **RTSP IP 攝影機**：支援 `rtsp://` 協議，透過後端 Proxy 自動轉碼（需 `ffmpeg`）。
  - **MJPEG IP 攝影機**：支援標準 HTTP MJPEG 串流。
  - **Webcam & 螢幕共享**：支援本機裝置與視窗擷取。
- **動態攝影機管理**：點擊 「➕」 即可動態新增攝影機，無上限擴展。
- **進階校準模式 (Calibration)**：
  - **單點校準 (CALIB)**：快速設定攝影機角度。
  - **兩點自動校準 (AUTO)**：自動計算並同步攝影機的 FOV 與角度。
- **配置匯入/匯出**：
  - **📋 複製配置**：一鍵將目前的攝影機佈局匯出為 JSON。
  - **📥 匯入配置**：快速恢復先前的佈局與參數設定。
- **高能見度模式 (🔆)**：增強地圖射線與標記的對比度，便於除錯與展示。

## 技術棧

- **前端**：HTML5, CSS3, JavaScript (ES6+)
- **AI 框架**：TensorFlow.js (@tensorflow/tfjs)
- **模型**：COCO-SSD, YOLOv8 Nano
- **後端 Proxy**：Node.js, Express, fluent-ffmpeg
- **工具**：servor (開發伺服器)

## 快速開始

1. **安裝依賴** (系統需安裝 `ffmpeg`)：
   ```bash
   npm install
   ```

2. **啟動後端 Proxy** (若需支援 RTSP)：
   ```bash
   node proxy.js
   ```

3. **啟動開發伺服器**：
   ```bash
   npm start
   ```

4. **操作流程**：
   - **配置 AI**：在右側 Config 面板選擇 **AI ENGINE**。
   - **新增來源**：點擊 「➕」 新增攝影機，選擇來源類型並輸入 URL。
   - **連線**：點擊各攝影機卡片中的 「CONNECT」。
   - **佈局**：在地圖上拖曳攝影機調整位置，拖曳周圍滑鼠調整旋轉角度。
   - **精準定位**：使用 「CALIB」 或 「AUTO」 進行空間校準。

## 注意事項

- **RTSP 延遲**：轉碼過程會產生輕微延遲，建議在同區域網路下使用。
- **座標映射**：系統已針對 high-DPI 與 `object-fit: contain` 進行優化，確保 AI 邊框與影像完美重合。
- **瀏覽器權限**：使用 Webcam 或螢幕共享時需授權媒體存取權限。
