# 小綿羊上樓梯 / Sheep Stair Climb

這是一款 9:16 直式網頁遊戲。玩家控制角色左右來回移動，按住畫面集氣、放開跳躍，踩上平台往上累積樓層，掉出畫面底部後遊戲結束。

本專案使用 HTML、CSS、JavaScript 與 DOM 圖層製作，不使用 Canvas API、不使用後端、不依賴外部 CDN。

## 如何執行

直接開啟 `index.html` 即可遊玩。

建議使用最新版 Chrome、Safari、Firefox 或 Edge。手機請以直式瀏覽。

## 網頁抬頭與圖示

瀏覽器分頁標題：

`小綿羊上樓梯 │ 天品山莊出品 │ 天品集團股票代號6199`

分頁小圖示使用：

`PIC/Game assets/background/TPICON.png`

## 操作方式

主畫面點擊或觸碰 `START` 開始遊戲。

遊戲中：

- 按住畫面集氣。
- 放開滑鼠或手指跳躍。
- 桌機也可按住空白鍵集氣，放開空白鍵跳躍。
- 桌機也可按 `Enter` 暫停或繼續遊戲。
- 角色會自動左右移動，碰到牆面折返。
- 右上角按鈕可暫停與繼續。

遊戲結束後：

- `RESTART` 重新開始。
- `GO TO TIENPIN GROUP` 開新分頁前往 `https://www.tienpin.com.tw`。
- `MENU` 回主畫面。
- 底部角色會來回移動，並以 `STAY_01.png` / `STAY_02.png` 交替呈現休息呼吸效果。

## 手機支援

遊戲畫面固定為 9:16，會依螢幕大小等比縮放。頁面已設定避免觸控滑動、縮放與瀏覽器手勢干擾遊戲，也支援安全區域 `safe-area-inset`。

## 素材資料夾

主要素材位於：

- `PIC/Game assets/background/`
- `PIC/Game assets/Button/`
- `PIC/Game assets/cloud/`
- `PIC/Game assets/loor/`
- `PIC/Game assets/power/`
- `PIC/Game assets/role/`
- `sound/`

音效素材包含按鈕、開始、集氣、跳躍、落地、角色掉出畫面、掉落平台開始下落、排行榜提示、Game Over 與背景音樂。頁面會先完成遊戲圖片預載，背景音樂最後下載；手機瀏覽器需在第一次點擊或觸控後解除音訊限制並開始播放。

GitHub Pages 僅保留遊戲實際載入素材、音效與 SEO 圖片。開發參考用示意圖與舊版素材不放入線上版本，避免增加 repo 體積。

## 排行榜與資料保存

排行榜與玩家資料預設使用 `localStorage` 保存，資料只存在同一裝置、同一瀏覽器。

若已設定 Supabase，遊戲會改為雲端同步：

- 玩家第一次開啟遊戲時產生匿名 `player_device_id`，保存在瀏覽器 `localStorage`。
- 每次 Game Over 會寫入一筆 `game_attempts` 遊玩紀錄。
- 每次 Game Over 也會更新 `players` 玩家主表的最高樓層、最高紀錄時間與遊玩次數。
- 玩家進入前五名並輸入姓名後，會寫入一筆 `leaderboard_entries` 留名歷史，並同步更新 `players.player_name`。
- 主畫面排行榜會讀取 Supabase `leaderboard_entries` / `leaderboard_public` 的前五筆留名紀錄，不用 `players` 去重，避免同一玩家多次留名時前五名少於五筆。
- 個人最高紀錄會依同一瀏覽器的匿名 `player_device_id` 從 `players` / `player_best_scores` 查詢。
- 未設定 Supabase 或連線失敗時，會自動回到本機 `localStorage`。

主畫面顯示前五名。遊戲結束後若成績進入前五名，會出現輸入框，可輸入最多九個字並送出紀錄。

保存資料包含：

- 玩家姓名
- 個人最高樓層
- 最高紀錄時間
- 遊玩次數
- 總遊玩次數
- 未留名遊玩次數

## Supabase 設定

1. 在 Supabase 建立專案。
2. 到 SQL Editor 執行 `supabase-schema.sql`。
3. 到 Project Settings / API 複製 Project URL 與 anon public key。
4. 將 `supabase-config.js` 改成：

```js
window.SHEEP_SUPABASE = {
  url: "https://你的專案.supabase.co",
  anonKey: "你的 anon public key",
};
```

玩家端不保存 IP。資料以匿名 `player_device_id` 辨識同一瀏覽器玩家的最高樓層。你可直接在 Supabase Table Editor 修改、刪除、補登資料；一般查看與修改玩家姓名、最高分、遊玩次數時，請優先使用 `players` 表。

## 後台管理

後台入口有兩種：

- 在網址後加上 `?admin=1`
- 在遊戲頁面按 `Alt + Shift + A`

後台可查看、修改、新增、刪除本機玩家紀錄，也可清空本機排行榜資料。Supabase 雲端資料請直接到 Supabase Table Editor 管理。

## 後續可擴充

- 加入音量控制與靜音設定。
- 加入更多平台種類。
- 加入雲朵、角色、平台的細緻動畫。
- 串接 Supabase Auth 管理員登入，讓遊戲內後台也能管理雲端資料。
- 包裝成手機 App。

## 驗收條件

- 桌機瀏覽器可直接開啟 `index.html` 遊玩。
- 手機直式畫面可正常遊玩。
- 觸控集氣與放開跳躍正常。
- 畫面維持 9:16。
- 頁面不會因手機滑動而跑版。
- 樓層數會增加。
- 掉出畫面底部會 Game Over。
- 累積到 999F 會 Game Over。
- 前五名排行榜可顯示與保存。
- 後台可修改或刪除紀錄。
- 重新開始、回主畫面、外部網站按鈕正常。
