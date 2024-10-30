import bodyParser from 'body-parser';
import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';
import he from 'he'; // HTML entity'lerini çözmek için he kütüphanesini ekleyin

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.text({ type: 'text/*', limit: '100mb' }));

// Puppeteer ile giriş yapıp cookie döndüren fonksiyon
async function openBrowserAndLogin(username, password) {
  try {
    const browser = await puppeteer.launch({ headless: false }); // Tarayıcı penceresini görmek için headless=false
    const page = await browser.newPage();

    // Enabiz sitesine git
    await page.goto('https://enabiz.gov.tr/', {
      waitUntil: 'networkidle2',
    });

    // Giriş bilgilerini gir
    await page.type('#username', username);
    await page.type('#password', password);

    // Giriş butonuna bas
    await page.click('#btnGiris');

    // Sayfanın yönlendirilmesini bekle
    await page.waitForNavigation();

    // Cookie'leri al
    const cookies = await page.cookies();
    console.log('Cookie:', cookies);

    // Tarayıcıyı kapat
    // await browser.close();

    return cookies;
  } catch (error) {
    console.error('Hata:', error.message);
    throw error;
  }
}

// API Endpoint'i: Giriş yapma ve cookie'leri geri döndürme
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Kullanıcı adı ve şifre gereklidir' });
  }

  try {
    const cookies = await openBrowserAndLogin(username, password);
    return res.json({ cookies });
  } catch (error) {
    return res.status(500).json({ message: 'Giriş sırasında bir hata oluştu', error: error.message });
  }
});

// HTML verisini JSON'a çevirme fonksiyonu
const parseHTMLToJSON = (html) => {
  const rows = html.match(/<tr[\s\S]*?<\/tr>/g); // Her <tr>...</tr'yi yakala
  const parsedData = [];

  rows.forEach((row) => {
    const kurum_adi_match = row.match(/<i.*?title="([^"]+)"/);
    const islem_adi_match = row.match(/<td>(.*?)<\/td>/g)?.[1];
    const sonuc_match = row.match(/<td>(.*?)<\/td>/g)?.[2];
    const sonuc_birimi_match = row.match(/<td>(.*?)<\/td>/g)?.[3];
    const referans_degeri_match = row.match(/<td>(.*?)<\/td>/g)?.[4];
    const rapor_match = row.match(/GrafikGoster\('([^']+)'\)/);
    const tarih_match = row.match(/<td>(\d{2}\.\d{2}\.\d{4})<\/td>/);

    parsedData.push({
      kurum_adi: kurum_adi_match ? he.decode(kurum_adi_match[1]) : null, // Türkçe karakterleri çözümle
      islem_adi: islem_adi_match ? he.decode(islem_adi_match.replace(/<[^>]*>/g, '').trim()) : null,
      sonuc: sonuc_match ? he.decode(sonuc_match.replace(/<[^>]*>/g, '').trim()) : null,
      sonuc_birimi: sonuc_birimi_match ? he.decode(sonuc_birimi_match.replace(/<[^>]*>/g, '').trim()) : null,
      referans_degeri: referans_degeri_match ? he.decode(referans_degeri_match.replace(/<[^>]*>/g, '').trim()) : null,
      rapor: rapor_match ? he.decode(rapor_match[1]) : null,
      tarih: tarih_match ? tarih_match[1] : null,
    });
  });

  return parsedData;
};

// Endpoint to fetch data, parse it, and return JSON
app.post('/tahlillerim', async (req, res) => {
  try {
    const htmlBuffer = Buffer.from(req.body, 'utf-8'); // Gelen veriyi UTF-8 ile buffer'a dönüştür
    const html = htmlBuffer.toString('utf-8'); // Tekrar stringe dönüştür ve UTF-8 olarak işlenmesini sağla
    console.log("Received HTML with UTF-8 encoding:", html);

    const parsedData = parseHTMLToJSON(html);

    return res.json(parsedData);
  } catch (error) {
    console.error('Error fetching or parsing data:', error);
    res.status(500).json({ message: 'Veri çekme veya işleme sırasında bir hata oluştu', error: error.message });
  }
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
