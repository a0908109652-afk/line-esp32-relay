const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');

const app = express();

const config = {
  channelAccessToken: process.env.LINE_ACCESS_TOKEN,
  channelSecret: process.env.LINE_SECRET,
};

const ESP32_IP = process.env.ESP32_IP; // 你的ESP32 IP

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

// Line Webhook
app.post('/webhook', line.middleware(config), async (req, res) => {
  res.status(200).end(); // 先回應Line避免timeout

  const events = req.body.events;
  for (const event of events) {
    if (event.type !== 'message' || event.message.type !== 'text') continue;

    const msg = event.message.text.trim();
    const replyToken = event.replyToken;
    let replyMsg = '';

    // 傳送指令給ESP32
    try {
      await axios.get(`http://${ESP32_IP}/cmd?v=${msg}`, { timeout: 5000 });

      // 根據指令回覆說明
      if (msg === '1')      replyMsg = '✅ LED 亮燈';
      else if (msg === '0') replyMsg = '✅ LED 閃爍';
      else if (msg === '2') replyMsg = '✅ LED 由暗到亮';
      else if (msg === '4') replyMsg = '✅ LED 由亮到暗';
      else                  replyMsg = `⚠️ 未知指令：${msg}`;

    } catch (err) {
      replyMsg = '❌ ESP32 連線失敗，請確認網路';
    }

    await client.replyMessage({
      replyToken,
      messages: [{ type: 'text', text: replyMsg }]
    });
  }
});

// 健康檢查
app.get('/', (req, res) => res.send('Line ESP32 Relay OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
