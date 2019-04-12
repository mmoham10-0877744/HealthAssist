'use strict';
const nodemailer = require('nodemailer');
var HashMap = require('hashmap');
var StringBuilder = require('stringbuilder');
StringBuilder.extend('string');
var process = require("process");

//Global Declarations
let attachmentList = [];

module.exports = {
    // Function to call Email
    sendEmail: function (emailDetailsMap) {
        // Local Declarations
        let smtpServer, port, authentication, imageProcessingPath, username, password, cc = '', bcc = '', emailText;
        // Set all config details in the email Detail Map
        smtpServer = emailDetailsMap.smtpServer;
        port = emailDetailsMap.port;
        authentication = emailDetailsMap.isAuth;
        imageProcessingPath = emailDetailsMap.imageProcessingPath;
        username = emailDetailsMap.userName;
        password = emailDetailsMap.password;

        //';' Sepearated String Value for Multiple recipients (To,Cc,Bcc)
        if(emailDetailsMap.Cc){
            cc = emailDetailsMap.Cc;
        }
        if(emailDetailsMap.Bcc){
            bcc = emailDetailsMap.Bcc;
        }
        if(emailDetailsMap.Text){
            emailText = emailDetailsMap.Text;
        }

        // Fetch the attachment
        attachmentList = emailDetailsMap.AttachmentList;

        let emailBody = processHTMLBody(emailDetailsMap);
        let emailSubject = convertToUnicode(emailDetailsMap.Subject);

        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: smtpServer,
            port: port,
            secure: authentication, // true for 465, false for other ports / false for 567
            auth: {
                user: username, // generated ethereal user
                pass: password  // generated ethereal password
            }
        });

        // setup email data with unicode symbols
        let mailOptions = {
            from: emailDetailsMap.From, // sender address
            to: emailDetailsMap.To, // list of receivers
            subject: emailSubject, // Subject line
            text: emailText, // plain text body
            html: emailBody, // html body
            cc: cc, // cc deatils
            bcc: bcc, // bcc deatils
            attachments: attachmentList //attachment List details
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
        });
    }
}

// Function to process HTML Body
var processHTMLBody = function (detailMap) {

    let cidCount = 0;
    let fileName;
    let imageSourceContendIdMap = new HashMap();
    let htmlBodyStr = detailMap.Body;
    const cheerio = require('cheerio');
    const $ = cheerio.load(htmlBodyStr);

    // Convert all the image tags in HTML body template to CID images (Iterate over image tag in the HTML)
    $('img').each(function (i, elem) {
        let imageSourceContent = $(this).attr('src');
        if (!imageSourceContent.includes("http")) {
            if (imageSourceContent.includes("base64")) {
                let srcContentArray = [];
                srcContentArray = imageSourceContent.split(",");
                let formatEncodingString = srcContentArray[0];
                //base64Data
                let imageString = srcContentArray[1];
                let imageFormat = formatEncodingString.split(";")[0];
                imageFormat = imageFormat.split("/")[1];

                let hrTime = process.hrtime();
                let currentMicroTime = hrTime[0] * 1000000 + hrTime[1] / 1000;
                currentMicroTime = currentMicroTime.toString().split(".")[0];
                fileName = "image" + currentMicroTime + "." + imageFormat;
                require("fs").writeFile(detailMap.imageProcessingPath + `/`+ fileName, imageString, 'base64', function (err) {
                    if(err) {
                        console.log(err);
                    }
                });
            } else {
                fileName = imageSourceContent;
            }
            cidCount++;
            $(this).attr('src', "cid:image" + cidCount);
            let embededAttachment = {filename: fileName, path: detailMap.imageProcessingPath + `/`+ fileName, cid: 'image' + cidCount};
            console.log(embededAttachment);
            attachmentList.push(embededAttachment);
            imageSourceContendIdMap.set(imageSourceContent, $(this).attr('src'));
        }
    });
    if (imageSourceContendIdMap.size > 0) {
        imageSourceContendIdMap.forEach(function (value, key) {
            //console.log(key + " : " + value);
            //let imageSource = key;
            //let imageContentId = value;
            htmlBodyStr = htmlBodyStr.replace(key, value);
        });
    }
    return convertToUnicode(htmlBodyStr);
}

// Function to convert the whole string body to unicode
var convertToUnicode = function (htmlMessageBody) {
    let htmlUnicodeStr = '';
    // Loop over all characters in the HTML Body template
    for (let j = 0; j < htmlMessageBody.length; j++) {
        if (htmlMessageBody.charCodeAt(j) > 127) {
            htmlUnicodeStr += '&#' + htmlMessageBody.charCodeAt(j) + ';'; // If character is not ASCII equivalent convert to unicode
        } else {
            htmlUnicodeStr += htmlMessageBody.charAt(j);    // Else retain the ASCII character
        }
    }
    return htmlUnicodeStr;
}
