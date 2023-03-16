const express = require("express");
const bodyParser = require("body-parser");
const linebot = require("linebot");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const bot = linebot({
  channelId: process.env.LINE_CHANNEL_ID,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

app.post("/webhook", bodyParser.json(), async (req, res) => {
  const signature = req.headers["x-line-signature"];
  if (!bot.validateSignature(JSON.stringify(req.body), signature)) {
    return res.status(400).send("Invalid signature");
  }

  const events = req.body.events;
  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      const userMessage = event.message.text;

      // GPT-4へのリクエストを作成
      const response = await axios.post(
        "https://api.openai.com/v1/engines/davinci-codex/completions",
        {
          prompt: `User: ${userMessage}\nAI: `,
          max_tokens: 50,
          n: 1,
          stop: null,
          temperature: 0.5,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );

      const aiReply = response.data.choices[0].text.trim();

      // LINEチャットボットからの応答を送信
      await bot.replyMessage(event.replyToken, {
        type: "text",
        text: aiReply,
      });
    }
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
