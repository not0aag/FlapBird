const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Serve static files from the public directory (includes data and audiofiles)
app.use(express.static(path.join(__dirname, "public")));

let wordsCache = {
  fruits: [],
  vegetables: [],
  animals: [],
  colors: [],
};

const audioFileMap = {
  अ: "1.a",
  आ: "2.aa",
  इ: "3.i.",
  ई: "4.ii",
  उ: "5.u",
  ऊ: "6.oo",
  ए: "7.e",
  ऐ: "8.ai",
  ओ: "9.o",
  औ: "10.au",
  क: "14.ka",
  ख: "15.kha",
  ग: "16.ga",
  घ: "17.gha",
  ङ: "18.nga",
  च: "19.cha",
  छ: "20.chha",
  ज: "21.ja",
  झ: "22.jha",
  ञ: "23.nja",
  ट: "24.ta",
  ठ: "25.tha",
  ड: "26.da",
  ढ: "27.dha",
  ण: "28.na",
  त: "29.ta",
  थ: "30.tha",
  द: "31.da",
  ध: "32.dha",
  न: "33.na",
  प: "34.pa",
  फ: "35.pha",
  ब: "36.ba",
  भ: "37.bha",
  म: "38.ma",
  य: "39.ya",
  र: "40.ra",
  ल: "41.la",
  व: "42.wa",
  श: "43.sha",
  ष: "44.shha",
  स: "45.sa",
  ह: "46.ha",
  क्ष: "47.ksh",
  त्र: "48.tra",
  ज्ञ: "49.gya",
  श्र: "50.sra",
  "ं": "11.un",
  "ः": "12.uh",
  "ृ": "13.ri",
  "ा": "matra_aa",
  "ि": "matra_i",
  "ी": "matra_ii",
  "ु": "matra_u",
  "ू": "matra_uu",
  "े": "matra_e",
  "ै": "matra_ai",
  "ो": "matra_o",
  "ौ": "matra_au",
  "्": "halant",
};

// Load words data from the public/data directory
async function loadWordsData() {
  const dataDir = path.join(__dirname, "public", "data"); // Update to use the public directory
  try {
    const files = await fs.readdir(dataDir);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const category = file.replace(".json", "");
        const filePath = path.join(dataDir, file);
        try {
          const data = await fs.readFile(filePath, "utf8");
          const jsonData = JSON.parse(data);
          wordsCache[category] = jsonData[category] || [];
        } catch (error) {
          wordsCache[category] = [];
        }
      }
    }
  } catch (error) {
    wordsCache = {
      fruits: [],
      vegetables: [],
      animals: [],
      colors: [],
    };
  }
}

// Endpoint to get words by category
app.get("/words", (req, res) => {
  const category = req.query.category;
  if (category && wordsCache[category]) {
    res.json(wordsCache[category]);
  } else {
    res.status(400).json({ error: "Invalid category" });
  }
});

// Serve audio files based on the character or word
app.get("/audio", async (req, res) => {
  const char = req.query.char;
  const word = req.query.word;

  try {
    if (word) {
      const audioPath = path.join(
        __dirname,
        "public",
        "audiofiles",
        "combinedwords",
        `${word}.mp3`
      );
      try {
        await fs.access(audioPath);
        res.set("Content-Type", "audio/mpeg");
        res.set("Accept-Ranges", "bytes");
        res.sendFile(audioPath);
        return;
      } catch {
        const audioFiles = [];
        for (const char of word) {
          if (audioFileMap[char]) {
            audioFiles.push(`${audioFileMap[char]}.mp3`);
          }
        }
        res.json({ files: audioFiles });
      }
    } else if (char) {
      let audioFileName = audioFileMap[char]
        ? `${audioFileMap[char]}.mp3`
        : null;
      if (!audioFileName) {
        res
          .status(404)
          .json({ error: "Audio file not found for the given character" });
        return;
      }

      let audioPath;
      if (["ा", "ि", "ी", "ु", "ू", "े", "ै", "ो", "ौ", "्"].includes(char)) {
        audioPath = path.join(
          __dirname,
          "public",
          "audiofiles",
          "combinedwords",
          "consonants",
          audioFileName
        );
      } else {
        audioPath = path.join(__dirname, "public", "audiofiles", audioFileName);
      }

      try {
        await fs.access(audioPath);
        res.set("Content-Type", "audio/mpeg");
        res.set("Accept-Ranges", "bytes");
        res.sendFile(audioPath);
      } catch (error) {
        res.status(404).json({ error: "Audio file not found" });
      }
    } else {
      res.status(400).json({ error: "Invalid character or word" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error processing audio" });
  }
});

// Endpoint to list available categories
app.get("/categories", (req, res) => {
  const categories = Object.keys(wordsCache).filter(
    (category) => wordsCache[category].length > 0
  );
  res.json(categories);
});

// Endpoint to get the audio file map
app.get("/audio-map", (req, res) => {
  res.json(audioFileMap);
});

// Load data on server start
loadWordsData();

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
