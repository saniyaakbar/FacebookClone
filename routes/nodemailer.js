const nodemailer = require("nodemailer");
const {google} = require("googleapis");

const CLIENT_ID = `399694485546-maf44tt629emrjp3conov0g3nsprkb70.apps.googleusercontent.com`;

// saniyaakbarofficial@gmail.com

const CLIENT_SECRET = `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`;
const REDIRECT_URI = `https://developers.google.com/oauthplayground`;
const REFRESH_TOKEN = `1//04iImpT4KY9lZCgYIARAAGAQSNwF-L9IrUr90Jphz3GcmM2R_WbRp3rjHvBSr_SgQu3CqLb0jxYIqXxxgnaeXBgSekXI9RX917Oo`;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN});



async function sendMail(receiver, text){ 
  try{
    const at = await oAuth2Client.getAccessToken();
    // console.log(at);
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: "OAuth2",
        user:"saniyaakbarofficial@gmail.com",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: "ya29.a0ARrdaM9rDYF1JeeZpQlFDQ7pDls6FNN96YTBNA1Jg4fSzxo0vVdystmAt0fekz7_ZJXexyEySDquy-EQyJNojO2Z2G7UBOFMG_RonB9ibWE8epj6AYNqM24m-FygisSYHcIi0cjsc8ngNWD1c7pdsb0ROIgL"
      }
    })

    const mailOpts = {
      from: "saniyaakbarofficial@gmail.com",
      to: receiver,
      subject: "Testing nodemailer",
      text: "Hey how are you??",
      html: text
    }

    const result = await transport.sendMail(mailOpts);
    return result;
  }
  catch(err){
    return err;
  }
}

module.exports = sendMail;