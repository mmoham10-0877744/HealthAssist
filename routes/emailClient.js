const camaro = require('camaro');
var path = require('path');
var sleep = require('thread-sleep');
var fs = require('fs');
var emailHelper = require("./emailHelper.js");
let xml = fs.readFileSync('/Users/mohammedmaaz/Documents/Project-WorkSpace/HealthAssistant/email/emailSMSConfig.xml', "utf8");
//Print File as String --> console.log(xml);
const template = {
    smtpServer: '//smtpServer',
    port: '//port',
    isAuth: '//authentication',
    userName: '//userName',
    password: '//password',
    imageProcessingPath: '//emailBodyImagesPath',
    attachmentPath: '//attachmentPath',
    attachmentFileName: '//attachmentFileName',
    emailBodyTemplateFileName: '//emailBodyTemplateFileName',
    fromEmailAddress: '//fromEmailAddress',
    emailSubject: '//emailSubject',
    waitingPeriod: '//waitingPeriod',
    From: '//fromEmailAddress',
    Cc: '//CC',
    To: '//To',
    // SmsMail: '//SmsMail'
};
//Prints all the config details as String --> console.log(camaro(xml, template));
let configDetails = camaro(xml, template);
// Get Config Details using variable.TagName --> console.log(configDetails.smtpServer);

module.exports = {
    // Function to process Email
    processEmail: function (details) {
        // Setting Email Subject
        configDetails.Subject = configDetails.emailSubject;
        // Get To Email ID from Config Details
        configDetails.To=details.body.to;

        // Fetch e-Mail Body from Html Body Template
        let HTMLStr = fs.readFileSync(path.join(configDetails.imageProcessingPath, configDetails.emailBodyTemplateFileName), "utf8");
        HTMLStr = HTMLStr.replace("medxxxstr", details.body.link);
        HTMLStr = HTMLStr.replace("indixxxstr", details.body.description);
        HTMLStr = HTMLStr.replace("namexxxstr", details.body.tags);
        configDetails.Body = HTMLStr;

        let attachment = {filename: configDetails.attachmentFileName, path: configDetails.attachmentPath + `/` + configDetails.attachmentFileName};
        let attachmentList = [];
        attachmentList.push(attachment);
        configDetails.AttachmentList = attachmentList;
        //Call e-mail Helper - Helper Class to send email (Process HTML body template and unicode to send email in different langugaes)
        emailHelper.sendEmail(configDetails);
        console.log("Email Send Successfully");
        // Pause for seconds mentioned in Config.xml
        sleep(parseInt(configDetails.waitingPeriod));
    }
}


