var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var session = require('express-session');
var braintree = require('braintree');
require('dotenv').load();
var cors = require('cors');


var app = express();
app.use(cors())

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));

app.get('/', function(req, res, next) {
    res.sendFile(__dirname + '/index.html');
});


app.post('/checkout', function(req, res, next) {
  var gateway = braintree.connect({
    environment: braintree.Environment.Sandbox,
    // Use your own credentials from the sandbox Control Panel here
    merchantId: process.env.merchant_id, //'<use_your_merchant_id>',
    publicKey:  process.env.public_key,   //'<use_your_public_key>',
    privateKey: process.env.private_key   //'<use_your_private_key>'
  });

  // Use the payment method nonce here
  console.log(req.body);
  // { paymentMethodNonce: '61af1b1a-c20f-0b98-5980-072ab23b15b9',
  //   line1: '1234 Main St.',
  //   line2: 'Unit 1',
  //   city: 'Saratoga',
  //   state: 'CA',
  //   postalCode: '95070',
  //   countryCode: 'US',
  //   recipientName: 'Scruff McGruff' }

  var fullName = req.body.recipientName.split(' ');
  var firstName = fullName[0];
  var lastName = fullName[1];
  var nonceFromTheClient = req.body.paymentMethodNonce;

  // Create a new transaction for $10
  var newTransaction = gateway.transaction.sale({
    amount: '10.00',
    paymentMethodNonce: nonceFromTheClient, //'fake-valid-payroll-nonce',
    shipping: {
      firstName: firstName,
      lastName: lastName,
      company: "",
      streetAddress: req.body.line1,
      extendedAddress: req.body.line2,
      locality: req.body.city,
      region: req.body.state,
      postalCode: req.body.postalCode,
      countryCodeAlpha2: req.body.countryCode
    },
    options: {
      // This option requests the funds from the transaction
      // once it has been authorized successfully
      paypal: {
        customField: "PayPal custom field",
        description: "Description for PayPal email receipt",
      },
      submitForSettlement: true
    }
  }, function(error, result) {
      if (result) {
          // console.log('currency',result.transaction.currencyIsoCode);
          if(result.success){
              console.log('status:',result.transaction.status);
          } else {
              if(result.transaction.status === 'processor_declined'){
                  console.log(result.transaction.processorResponseCode);
                  console.log(result.transaction.processorResponseText);
              }
              if (result.transaction.status === 'settlement_declined'){
                  console.log(result.transaction.processorSettlementResponseCode);
                  console.log(result.transaction.processorSettlementResponseText);
              }
              if (result.transaction.status === 'gateway_rejected'){
                  console.log(result.transaction.gatewayRejectionReason);
              }
          }
          console.log(result);
        res.send(result);
      } else {
        res.status(500).send(error);
      }
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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

module.exports = app;
