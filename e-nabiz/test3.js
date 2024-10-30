import express from 'express';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { Buffer } from 'buffer';
import { fileURLToPath } from 'url';
const app = express();
app.use(express.json({ limit: '50mb' })); // Büyük veriler için sınırı artırın
// Define __dirname for ES6 modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Example usage
const tempFilePath = path.join(__dirname, 'tempVideo.mp4');
console.log(tempFilePath);
// Video parlaklığını hesaplama fonksiyonu
const calculateBrightness = (imageData) => {
  let brightness = 0;
  for (let i = 0; i < imageData.length; i += 4) {
    const red = imageData[i];
    const green = imageData[i + 1];
    const blue = imageData[i + 2];
    brightness += (red + green + blue) / 3;
  }
  return brightness / (imageData.length / 4);
};

// Video analiz servisi
app.post('/analyze-video', async (req, res) => {
  const { video } = req.body;

  // Geçici video dosyası oluşturma
  const videoBuffer = Buffer.from(video, 'base64');
  const tempFilePath = path.join(__dirname, 'tempVideo.mp4');
  fs.writeFileSync(tempFilePath, videoBuffer);

  const brightnessLevels = [];

  // ffmpeg ile kare kare parlaklık seviyesini analiz etme
  ffmpeg(tempFilePath)
    .on('end', () => {
      fs.unlinkSync(tempFilePath); // Video dosyasını kaldır
      res.json({ brightnessLevels });
    })
    .on('error', (err) => {
      console.error(err);
      fs.unlinkSync(tempFilePath);
      res.status(500).send('Error processing video');
    })
    .screenshots({
      count: 100, // 100 kare analiz edilecek
      folder: 'frames',
      filename: 'frame-%i.png',
    })
    .on('filenames', (filenames) => {
      filenames.forEach((filename) => {
        const framePath = path.resolve('frames', filename);
        const imageData = fs.readFileSync(framePath);
        const brightness = calculateBrightness(imageData);
        brightnessLevels.push(brightness);
        fs.unlinkSync(framePath); // Kare dosyasını kaldır
      });
    });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
