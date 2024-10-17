const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static('public'));

let wordsCache = {
  fruits: [],
  vegetables: [],
  animals: [],
  colors: []
};

const audioFileMap = {
  'अ': '1.a', 'आ': '2.aa', 'इ': '3.i.', 'ई': '4.ii', 'उ': '5.u', 'ऊ': '6.oo', 'ए': '7.e', 'ऐ': '8.ai', 'ओ': '9.o', 'औ': '10.au',
  'क': '14.ka', 'ख': '15.kha', 'ग': '16.ga', 'घ': '17.gha', 'ङ': '18.nga', 'च': '19.cha', 'छ': '20.chha', 'ज': '21.ja',
  'झ': '22.jha', 'ञ': '23.nja', 'ट': '24.ta', 'ठ': '25.tha', 'ड': '26.da', 'ढ': '27.dha', 'ण': '28.na', 'त': '29.ta',
  'थ': '30.tha', 'द': '31.da', 'ध': '32.dha', 'न': '33.na', 'प': '34.pa', 'फ': '35.pha', 'ब': '36.ba', 'भ': '37.bha',
  'म': '38.ma', 'य': '39.ya', 'र': '40.ra', 'ल': '41.la', 'व': '42.wa', 'श': '43.sha', 'ष': '44.shha', 'स': '45.sa',
  'ह': '46.ha', 'क्ष': '47.ksh', 'त्र': '48.tra', 'ज्ञ': '49.gya', 'श्र': '50.sra', 'ं': '11.un', 'ः': '12.uh', 'ृ': '13.ri',
  'ा': '2.aa', 'ि': '3.i.', 'ी': '4.ii', 'ु': '5.u', 'ू': '6.oo', 'े': '7.e', 'ै': '8.ai', 'ो': '9.o', 'ौ': '10.au'
};

const combinedWordsAudioPath = 'C:\\Users\\alena\\flappysanskrit\\FlapBird\\audiofiles\\combinedwords\\';

async function loadWordsData() {
  const dataDir = path.join(__dirname, 'data');
  try {
    const files = await fs.readdir(dataDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const category = file.replace('.json', '');
        const filePath = path.join(dataDir, file);
        try {
          const data = await fs.readFile(filePath, 'utf8');
          const jsonData = JSON.parse(data);
          wordsCache[category] = jsonData[category] || [];
          console.log(`Loaded ${category}: ${wordsCache[category].length} words`);
        } catch (error) {
          console.error(`Error loading ${file}:`, error);
          wordsCache[category] = [];
        }
      }
    }
  } catch (error) {
    console.error('Error reading data directory:', error);
  }
}

app.get('/words', (req, res) => {
  const category = req.query.category;
  if (category && wordsCache[category]) {
    res.json(wordsCache[category]);
  } else {
    res.status(400).json({ error: 'Invalid category' });
  }
});

app.get('/audio', async (req, res) => {
  const char = req.query.char;
  const word = req.query.word;
  
  try {
    if (word) {
      const audioPath = path.join(combinedWordsAudioPath, `${word}.mp3`);
      if (await fs.access(audioPath).then(() => true).catch(() => false)) {
        res.sendFile(audioPath);
      } else {
        const audioFiles = [];
        for (const char of word) {
          if (audioFileMap[char]) {
            audioFiles.push(`${audioFileMap[char]}.mp3`);
          }
        }
        res.json({ files: audioFiles });
      }
    } else if (char && audioFileMap[char]) {
      const audioFileName = `${audioFileMap[char]}.mp3`;
      const audioPath = path.join(__dirname, 'audiofiles', audioFileName);
      res.sendFile(audioPath);
    } else {
      res.status(400).json({ error: 'Invalid character or word' });
    }
  } catch (error) {
    console.error('Error serving audio:', error);
    res.status(500).json({ error: 'Error processing audio' });
  }
});

app.get('/categories', (req, res) => {
  const categories = Object.keys(wordsCache).filter(category => wordsCache[category].length > 0);
  res.json(categories);
});

async function startServer() {
  await loadWordsData();
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Loaded categories:', Object.keys(wordsCache).filter(category => wordsCache[category].length > 0));
  });
}

startServer();