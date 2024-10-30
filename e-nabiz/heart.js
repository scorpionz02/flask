/* const express = require('express');
const bodyParser = require('body-parser');
const { createCanvas, loadImage } = require('canvas'); */
import express from 'express';
import bodyParser from 'body-parser';
import { createCanvas, loadImage } from 'canvas';
const app = express();

app.use(bodyParser.json({ limit: '50mb' })); // Büyük veri kabul edebilmek için limit artırıldı.

app.post('/measure-heart-rate', async (req, res) => {
    const { images } = req.body; // Birden fazla görüntü base64 formatında gelecek
    const redChannelData = [];
  
    try {
      for (const imageData of images) {
        const img = await loadImage(`data:image/jpeg;base64,${imageData}`);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
  
        // Kırmızı kanalın ortalamasını hesapla
        const avgRed = calculateAverageRed(ctx, img.width, img.height);
        redChannelData.push(avgRed/2); // Zaman serisine kırmızı kanal verilerini ekle
      }
      console.log('Red channel data:', redChannelData);
      
      // Kalp ritmi hesapla
      const heartRate = calculateHeartRate(redChannelData);
      console.log('Heart rate:', heartRate);
      
      res.json({ heartRate });
    } catch (error) {
      console.error('Error processing images:', error);
      res.status(500).json({ error: 'Error processing images' });
    }
  });
  
  // Bir resmin kırmızı kanalının ortalama değerini hesaplayan fonksiyon
  const calculateAverageRed = (ctx, width, height) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
  
    let redTotal = 0;
    let pixelCount = 0;
  
    // Her pikselin kırmızı kanal değerlerini topluyoruz
    for (let i = 0; i < data.length; i += 4) {
      const red = data[i]; // Kırmızı kanal
      redTotal += red;
      pixelCount++;
    }
  
    return redTotal / pixelCount; // Ortalama kırmızı kanal değeri
  };
  
  // Zaman serisindeki kırmızı kanal değişimlerine dayanarak kalp atış hızını hesaplayan fonksiyon
  const calculateHeartRate = (redChannelData) => {
    // Kırmızı kanal verilerindeki dalgalanmaların sıklığını (frekansı) bulalım
    const frequency = analyzeFrequency(redChannelData);
    const heartRate = frequency * 60; // Frekansı BPM'e çeviriyoruz
    return Math.round(heartRate); // Yaklaşık kalp atış hızını döndür (BPM)
  };
  
  // Zaman serisindeki frekansı analiz eden basit bir fonksiyon
  const analyzeFrequency = (data) => {
    let peaks = 0;
    let threshold = (Math.max(...data) - Math.min(...data)) * 0.2; // Eşiği %50'ye çıkartalım

  
    for (let i = 1; i < data.length - 1; i++) {
        if (Math.abs(data[i] - data[i - 1]) > threshold) {
        peaks++; // Bir tepe noktası bulduk
      }
    }
    console.log('Peaks:', peaks);
    
    const duration = data.length / 4; // Örneğin, 30 FPS ile çekilmiş 1 saniyedeki resim sayısı
    const frequency = peaks / duration; // Tepe noktalarının frekansını hesapla
  
    return frequency;
  };
  
  app.listen(3000, () => {
    console.log('Server running on port 3000');
  });