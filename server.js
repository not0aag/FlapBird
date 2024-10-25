const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.static("public"));
app.use("/imagefiles", express.static(path.join(__dirname, "public", "imagefiles")));
app.use("/audiofiles", express.static(path.join(__dirname, "public", "audiofiles")));

const wordsCache = {
  fruits: [],
  vegetables: [],
  animals: [],
  colors: []
};

const audioFileMap = {
  अ: "1.a", आ: "2.aa", इ: "3.i.", ई: "4.ii", उ: "5.u", ऊ: "6.oo", ए: "7.e", ऐ: "8.ai", ओ: "9.o", औ: "10.au",
  क: "14.ka", ख: "15.kha", ग: "16.ga", घ: "17.gha", ङ: "18.nga", च: "19.cha", छ: "20.chha", ज: "21.ja",
  झ: "22.jha", ञ: "23.nja", ट: "24.ta", ठ: "25.tha", ड: "26.da", ढ: "27.dha", ण: "28.na", त: "29.ta",
  थ: "30.tha", द: "31.da", ध: "32.dha", न: "33.na", प: "34.pa", फ: "35.pha", ब: "36.ba", भ: "37.bha",
  म: "38.ma", य: "39.ya", र: "40.ra", ल: "41.la", व: "42.wa", श: "43.sha", ष: "44.shha", स: "45.sa",
  ह: "46.ha", क्ष: "47.ksh", त्र: "48.tra", ज्ञ: "49.gya", श्र: "50.sra", "ं": "11.un", "ः": "12.uh",
  "ृ": "13.ri", "ा": "matra_aa", "ि": "matra_i", "ी": "matra_ii", "ु": "matra_u", "ू": "matra_uu",
  "े": "matra_e", "ै": "matra_ai", "ो": "matra_o", "ौ": "matra_au", "्": "halant"
};

async function loadWordsData() {
  try {
    const categories = ["fruits", "vegetables", "animals", "colors"];
    for (const category of categories) {
      const filePath = path.join(__dirname, "public", "data", `${category}.json`);
      try {
        const data = await fs.readFile(filePath, "utf8");
        wordsCache[category] = JSON.parse(data)[category] || [];
      } catch (error) {
        console.error(`Error loading ${category}.json:`, error);
      }
    }
  } catch (error) {
    console.error("Error in loadWordsData:", error);
  }
}

app.get("/api/words", (req, res) => {
  const category = req.query.category;
  if (category && wordsCache[category]) {
    res.json(wordsCache[category]);
  } else {
    res.status(400).json({ error: "Invalid category" });
  }
});

app.get("/api/audio", async (req, res) => {
  const { char, word } = req.query;
  
  try {
    if (word) {
      const formattedWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      const audioPath = path.join(__dirname, "public", "audiofiles", "combinedwords", `${formattedWord}.mp3`);
      try {
        await fs.access(audioPath);
        res.sendFile(audioPath);
      } catch (error) {
        res.status(404).json({ error: "Word audio not found" });
      }
    } else if (char) {
      const fileName = audioFileMap[char];
      if (!fileName) {
        res.status(404).json({ error: "Character audio not found" });
        return;
      }

      let audioPath;
      if (["ा", "ि", "ी", "ु", "ू", "े", "ै", "ो", "ौ", "्"].includes(char)) {
        audioPath = path.join(__dirname, "public", "audiofiles", "combinedwords", "consonants", `${fileName}.mp3`);
      } else {
        audioPath = path.join(__dirname, "public", "audiofiles", `${fileName}.mp3`);
      }

      try {
        await fs.access(audioPath);
        res.sendFile(audioPath);
      } catch {
        res.status(404).json({ error: "Audio file not found" });
      }
    } else {
      res.status(400).json({ error: "Invalid request" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/categories", (_, res) => {
  res.json(Object.keys(wordsCache).filter(category => wordsCache[category].length > 0));
});

loadWordsData();

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});