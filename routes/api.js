const express = require('express');
const router = express.Router();
var paypal = require('paypal-rest-sdk');
require('dotenv').load();

router.post('/paypal/payment/create',function(req, res){

console.log('environment',process.env.app_url);
    //console.log(req.body);
  paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.client_id,
    'client_secret': process.env.secret
  });
// Build PayPal payment request
var payReq = JSON.stringify({
  intent:'authorize',
  payer:{
    payment_method:'paypal'
  },
  'redirect_urls':{
    'return_url': process.env.app_url + '/api/paypal/payment/execute',
    'cancel_url': process.env.app_url + '/cancel'
  },
  "transactions": [{
      "item_list": {
          "items": [{
              "name": "item",
              "sku": "item",
              "price": "1.00",
              "currency": "USD",
              "quantity": 1
          }]
          // "shipping_address": req.body
      },
      "amount": {
          "currency": "USD",
          "total": "1.00"
      },
      "description": "This is the payment description."
  }]
});

paypal.payment.create(payReq, function(error, payment){

    console.log(payment);
  var links = {};

  if(error){
    console.error(JSON.stringify(error));
  } else {
    // Capture HATEOAS links
    payment.links.forEach(function(linkObj){
      links[linkObj.rel] = {
        href: linkObj.href,
        method: linkObj.method
      };
    })

    // If redirect url present, redirect user
    if (links.hasOwnProperty('approval_url')){
      //REDIRECT USER TO links['approval_url'].href
      console.log('approval_url:',links['approval_url']);

      //
      // approval_url: { href: 'https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=EC-8UH31611V2885582J',
      //   method: 'REDIRECT' }


      // res.writeHead(302,  {'Location': links['approval_url'].href ,
      //                      'Access-Control-Allow-Origin' : '*'});
      // res.end();

      res.redirect(links['approval_url'].href);
      // res.send('EC-05A67881TT211273E');
      // res.redirect('/test')
    } else {
      console.error('no redirect URI present');
    }
  }
});

});  // end of creation on paypal payment

router.use('/paypal/payment/execute',function(req,res){
    console.log('PayerID:',req.query.PayerID);
    console.log('paymentId:',req.query.paymentId);
    // res.send('works!');
    var execute_payment_json = {
        "payer_id": req.query.PayerID,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "1.00"
            }
        }]
    };
    var paymentId = req.query.paymentId;
    paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log("Get Payment Response");
            console.log(JSON.stringify(payment));
            res.send(JSON.stringify(payment));
        }
    });

})

module.exports = router;
