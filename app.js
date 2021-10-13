process.env.NODE_ENV = 'prod';

const axios = require('axios');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const RabbitMq = require('libamqp');

const SecurityContext = require('libidentity');
const AppSettings = require(`./config.${process.env.NODE_ENV}`);
var config = new AppSettings();
const rabbitMq = new RabbitMq(config);
let securityContext = new SecurityContext(config);

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Rabbit queues and exchanges
const exchangeName = "MailServiceExchange";
const queueName = "MailServiceHost";

// Handlers
const sendMailCommand = require('./models/mailCommand');
const mailCommandHandler = require('./handlers/sendMailCommandHandler');

rabbitMq.registerCallback(mailCommandHandler, sendMailCommand);

rabbitMq.listen(exchangeName, queueName, securityContext, (options) => {
  options.prefetch(1);
});

setInterval(() => {
  axios.get('https://core-mail-host-service.herokuapp.com/')
  .then(response => {
    console.log("Service activity after 20 mins...\n");
  });
}, 1000 * 60* 20);

module.exports = app;
