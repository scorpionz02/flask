import axios from "axios";
import tough from "tough-cookie";
import { wrapper } from "axios-cookiejar-support"; // axios ile tough-cookie'yi uyumlu hale getirmek için gerekli

// Tough-Cookie ile bir cookie jar oluşturuyoruz
const CookieJar = new tough.CookieJar();

// Axios ile cookie'leri yönetmek için bir instance oluşturuyoruz ve jar'ı bağlıyoruz
const axiosInstance = wrapper(
  axios.create({
    withCredentials: true,
    jar: CookieJar, // Cookie jar'ı kullanarak cookie'leri takip eder
    headers: {
      "User-Agent": "Mozilla/5.0", // İsteklerde kullanılan User-Agent örneği
    },
  })
);

// Giriş yapıp cookie'leri kaydetme fonksiyonu
async function loginAndSaveCookies() {
  try {
    /* const form = new FormData();
    form.append("username", "14929344916");
    form.append("password", "abidin152702");
    const getCookieResponse = await axiosInstance.get(
      "https://enabiz.gov.tr/?st=0"
    );
    const cookie = getCookieResponse.headers["set-cookie"];
    console.log("Cookie:", cookie);
    await CookieJar.setCookie(cookie[0], "https://enabiz.gov.tr");
    await CookieJar.setCookie(cookie[1], "https://enabiz.gov.tr");
    await CookieJar.setCookie(cookie[2], "https://enabiz.gov.tr");
    // Login isteği ile e-Nabız'a giriş yapıyoruz
    const loginResponse = await axiosInstance.post(
      "https://enabiz.gov.tr/Account/GetSmsOnayKontrol",
      form,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    ); */
    //console.log("response", loginResponse.data);

    /* console.log(
      "Giriş başarılı, cookie alındı:",
      loginResponse.headers["set-cookie"]
    ); */

    // Cookie'yi manuel olarak ayarlıyoruz
    const cookie = [
      ".AspNetCore.Antiforgery.G1ld9b5GvCk=CfDJ8F-BWli1QIVHhjJayQ0e9Z9EohCO_fYitKtBC0JkDYMmmGObo7NagqqQWme8NEMstCCNM9Q4wfNG85PaQn3l7_HMoXPNEg2Oa-_rECYsDky5YkERpdOXjuBae3HaQkuSl28Es3kB-41F19d5BqWjjic; Path=/; Expires=Wed, 22 Oct 2025 16:54:29 GMT;",
      ".EnabizSESSIONID=CfDJ8F%2BBWli1QIVHhjJayQ0e9Z%2F%2BB6Z3PJHGdr%2B53N%2BAcO8C22H5gmvLu0%2B7hY7Dz%2FnGoKEoaSoGb%2Bxgwg1hDbIq02g7qP853YVgwIvifi%2BqLPWGhYBtp21Op0H1GKfKL9UXW5muRnwYrDwvGBvUvm4B9ZvLNV1iFCABXHzu9mrOlduX; Path=/; HttpOnly;",
      "IP=usswenbzweb18; Path=/;",
    ];

    await CookieJar.setCookie(cookie[0], "https://enabiz.gov.tr");
    await CookieJar.setCookie(cookie[1], "https://enabiz.gov.tr");
    await CookieJar.setCookie(cookie[2], "https://enabiz.gov.tr");

    console.log("Cookie:", CookieJar);

    // Giriş sonrası veri almak için bir API isteği örneği
    const dataResponse = await axiosInstance.get(
      'https://enabiz.gov.tr/HastaBilgileri/ReceteDetay?data={"SYSTakipNo":"2BISC41PPJF3F2VHGI8P4","ReceteNo":"28HDT1P"}',
      {
        headers: {
      "Content-Type": "*/*",
     },
      }
    ); 

    console.log("Veri alındı:", dataResponse.data);
  } catch (error) {
    console.error("Bir hata oluştu:", error.message);
  }
}
// Function to extract data from HTML without Cheerio


// Fonksiyonu çağırarak işlemi başlatıyoruz
loginAndSaveCookies();
