const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const port = 3001;

// CORSを有効にする
//app.use(cors());
app.use(cors({ origin: true, credentials: true }));

app.use(express.json());

app.get("/get-jrct-data", async (req, res) => {
  try {
    const response = await axios.get(
      `https://jrct.niph.go.jp/latest-detail/${req.query.jrctNumber}`
    );
    res.json(response.data);
  } catch (error) {
    console.error("エラー:", error.message);
    res.status(500).json({ error: "内部サーバーエラー" });
  }
});

app.listen(port, () => {
  console.log(`サーバーが http://localhost:${port} で実行中`);
});
