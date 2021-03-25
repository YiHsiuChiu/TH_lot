# TH_lot

## 專案名稱
Tokenized Hardware Lot Provider

## 專案功能
以樹梅派模擬停車場中智慧停車繳費充電柱

## 安裝方法
***需於raspberry pi上安裝***

```
git clone https://github.com/YiHsiuChiu/TH_lot.git
cd TH_lot
npm install
```

## 執行方法
1. 設定mqtt broker之url
2. 將樹梅派gpio 4(pin 7)拉出接一5v led正極
3. 輸入sudo node TH_lot.js
