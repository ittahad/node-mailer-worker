var express = require('express');

const responseWriter = require('libidentity/res');
const MailConfigSchema = require('../models/mailConfig');

const AppSettings = require(`../config.${process.env.NODE_ENV}`);
var config = new AppSettings();

const nodemailer = require("nodemailer");

sendmailCommandHandler = (sendMailCommand, securityContext) => {
    
    console.log("Message received! ", sendMailCommand);
    
    let sendToAddresses = sendMailCommand.payload.to;
    let subject = sendMailCommand.payload.subject;
    let purpose = sendMailCommand.payload.purpose;
    let cc = sendMailCommand.payload.cc;
    let bcc = sendMailCommand.payload.bcc;
    let dataContext = sendMailCommand.payload.dataContext;

    let MailConfigs = securityContext.dataConnectionPool[sendMailCommand.authInfo.tenantId].model('MailConfigs', MailConfigSchema);
    
    let filter = { 
      "template.purpose" : purpose 
    };

    MailConfigs.findOne(filter)
    .then((config) => {
      
      if(config === null || config === undefined)
      {
        console.log(`No config found with purpose: ${purpose}`);
        return;
      }

      console.log("Mail config found !!!");

      let transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.username,
          pass: config.password,
        },
      });

      let finalMessageBody = config.template.body;
      for(const prop in dataContext)
      {
        finalMessageBody = finalMessageBody.replace("{{" + prop + "}}", dataContext[prop]);
      }

      console.log("Sending mail...");

      transporter.sendMail({
        from: config.senderEmail,
        to: sendToAddresses,
        cc: cc,
        bcc: bcc,
        subject: subject,
        html: finalMessageBody,
      }).then(info => {
        console.log("Message sent: %s", info.response);
      }).catch(ex => {
        console.log("Failed to send mail", ex);
      });
    })
    .catch(ex => {
      console.log("Failed to send mail", ex);
    });
};
  

module.exports = sendmailCommandHandler;
