import pkg from 'twilio';
const { Twilio } = pkg;
import "dotenv/config.js";
let environment = process.env;
const smsUrl = environment.SMS_URL;
export async function sendSMS(tel, body) {

  let urlSMS = new URL(smsUrl);
  urlSMS.search = new URLSearchParams({
    action: "sendsms",
    user: environment.SMS_USER,
    password: environment.SMS_PASSWORD,
    from: environment.SMS_FROM,
    to: tel,
    text: body,
  }).toString();

  const result = await fetch(urlSMS, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }).then(response => {
    console.log("response", response);
    return true;
  }).then(data => {
    console.log("data", data);
    return true;
  }).catch(error => {
    console.error('There was a problem with the fetch operation:', error);
    return false;
  });
  return result;

}
export function renderSmsTemplate(template, variables) {
  return template.replace(/{(\w+)}/g, (match, key) => variables[key] || match);
}