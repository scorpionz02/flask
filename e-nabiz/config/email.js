/* let nodemailer = require('nodemailer'); */
import crypto from "crypto";
import nodemailer from 'nodemailer';
import hbs from "nodemailer-express-handlebars";
/* require('dotenv').config(); */
import 'dotenv/config.js';
let environment = process.env;

export const GmailTransport = nodemailer.createTransport({
    service: environment.GMAIL_SERVICE_NAME,
    host: environment.GMAIL_SERVICE_HOST,
    secure: environment.GMAIL_SERVICE_SECURE,
    port: environment.GMAIL_SERVICE_PORT,
    auth: {
        user: environment.GMAIL_USER_NAME,
        pass: environment.GMAIL_USER_PASSWORD
    }
});
export const createTransporter = (smtpSettings) => {
    return nodemailer.createTransport({
        service: smtpSettings.serviceName,
        host: smtpSettings.smtp,
        secure: false,
        port: smtpSettings.port,
        auth: {
            user: smtpSettings.userName,
            pass: smtpSettings.password,
        },
    });
};

// Template Helper
export function renderEmailTemplate(template, variables) {
    return template.replace(/{(\w+)}/g, (match, key) => variables[key] || match);
}

// OTC Generator
export function generateNumericOTC() {
    return crypto.randomInt(100000, 1000000).toString();
}

// Action Button Generator
export function generateActionButton(actionUrl, params = {}) {
    const url = new URL(actionUrl);
    url.search = new URLSearchParams(params).toString();

    return `<table class="btn btn-primary p-3 fw-700" role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" style="border-radius: 6px; font-weight: 700;">
            <tbody>
              <tr>
                <td align="center" bgcolor="#0d6efd" style="border-radius: 6px;">
                  <a href="${url}" style="color: #ffffff; padding: 12px; display: block;">Click Here</a>
                </td>
              </tr>
            </tbody>
          </table>`;
}



const { POCKETBASE_ADMIN, POCKETBASE_PASSWORD, GMAIL_SERVICE_NAME } = process.env;

export async function sendEmail(type, getUser, settings, variables, actionBtnUrl) {
    const gmailTransport = createTransporter({
        serviceName: GMAIL_SERVICE_NAME,
        smtp: settings.smtp,
        port: settings.port,
        userName: settings.userName,
        password: settings.password
    });
    const logo = "https://trial.a-traq.com/atraq-logo.png";

    const subject = settings.email_templates[`${type}_subject`].replace("{APP_NAME}", settings.appName);
    const body = renderEmailTemplate(settings.email_templates[`${type}_body`], variables);
    //console.log("Body", body);

    ViewOption(gmailTransport, hbs);

    let HelperOptions = {
        from: `${settings?.appName} <${settings?.userName}>`,
        to: `${getUser.email}, abidinayhan94@gmail.com`,
        subject: subject,
        template: "test",
        context: {
            ...variables,
            atraqUrl: "https://a-traq.com",
            alarmCenterName: settings?.alarmCenterName,
            img: variables?.url,
            logo: logo,
            body: body,
            address: settings?.alarmCenterAdress,
            instagram: settings?.alarmCenterInstagram,
            facebook: settings?.alarmCenterFacebook,
            twitter: settings?.alarmCenterTwitter,
            tel: settings?.alarmCenterTelephone,
            alarmCenterUrl: settings?.alarmCenterUrl,
            alarmCenterMail: settings?.alarmCenterMail,
            //text: `<p>Merhaba ${getUser.name} <br /> ${getUser.surname}</p>`//{{{text}}}
        },
    };
    return {
        HelperOptions,
        gmailTransport
    };
    
}


/* export const SMTPTransport = nodemailer.createTransport({
    host: environment.SMTP_SERVICE_HOST,
    port: environment.SMTP_SERVICE_PORT,
    secure: environment.SMTP_SERVICE_SECURE, // upgrade later with STARTTLS
    debug: true,
    auth: {
        user: environment.SMTP_USER_NAME,
        pass: environment.SMTP_USER_PASSWORD
    }
}); */

export const ViewOption = (transport, hbs) => {
    transport.use('compile', hbs({
        viewPath: 'views/email',
        extName: '.hbs'
    }));
}
