const checksum_lib = require('./checksum/checksum');
var PaytmConfig = {
	mid: "ThPIEI19560093848889",
	key: "QljTgNZx3iuWZoWi",
	website: "WEBSTAGING"
}
const express = require('express')
const path = require('path');
const app = express()
var cors = require('cors');
// const { request } = require('http');
// EJS configuration
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: '*' }))
const PORT = process.env.PORT || 8080


app.get('/', (req, res) => {
	//for testing purpose
	res.send("Hello from Server")
})

app.get('/pay', (req, res) => {
	var params = {};
	params['MID'] = PaytmConfig.mid;
	params['WEBSITE'] = PaytmConfig.website;
	params['CHANNEL_ID'] = 'WEB';
	params['INDUSTRY_TYPE_ID'] = 'Retail';
	// make sure that orderid be unique all time
	params['ORDER_ID'] = 'TEST_' + new Date().getTime();
	params['CUST_ID'] = 'Customer001';
	// Enter amount here eg. 100.00 etc according to your need
	params['TXN_AMOUNT'] = '1.00';

	if (PORT == 8080) {
		// if you are running it on localhost then
		params['CALLBACK_URL'] = 'http://localhost:' + PORT + '/callback';
	}
	else {
		// if you hosted it
		// hostedurl = write your api(backend) url here
		params['CALLBACK_URL'] = 'https://hostedurl/callback';
	}

	// here you have to write customer's email
	params['EMAIL'] = 'abc@gmail.com';
	// here you have to write customer's phone number
	params['MOBILE_NO'] = '9999999999';

	checksum_lib.genchecksum(params, PaytmConfig.key, function (err, checksum) {

		var txn_url = "https://securegw-stage.paytm.in/order/process"; // for staging
		var form_fields = "";
		for (var x in params) {
			form_fields += "<input type='hidden' name='" + x + "' value='" + params[x] + "' >";
		}
		form_fields += "<input type='hidden' name='CHECKSUMHASH' value='" + checksum + "' >";

		res.writeHead(200, { 'Content-Type': 'text/html' });
		var x = '<html><head><title>Merchant Checkout Page</title></head><body><center><h1>Please do not refresh this page...</h1></center><form method="post" action="' + txn_url + '" name="f1">' + form_fields + '</form><script type="text/javascript">document.f1.submit();</script></body></html>'
		res.write(x);
		res.end();
	});
})


app.post('/callback', (req, res) => {
	let data = req.body
	if (data.STATUS == "TXN_SUCCESS") {
		return res.send({
			status: 0,
			data: data,
			success: true
		});
	}
	else {
		return res.send({
			status: 1,
			data: data,
			success: false
		});
	}
})

app.post('/pay2', (req, res) => {
	var params = {};
	params['MID'] = PaytmConfig.mid;
	params['WEBSITE'] = PaytmConfig.website;
	params['CHANNEL_ID'] = 'WEB';
	params['INDUSTRY_TYPE_ID'] = 'Retail';

	// *********************


	params['ORDER_ID'] = req.body.ORDER_ID + getTime()
	params['CUST_ID'] = req.body.CUST_ID;
	params['TXN_AMOUNT'] = req.body.TXN_AMOUNT;
	// *********************



	if (PORT == 8080) {
		params['CALLBACK_URL'] = 'http://localhost:' + PORT + '/callback2';
	}
	else {
		params['CALLBACK_URL'] = 'https://foodzone-paytm.herokuapp.com/callback2';
	}

	// *********************
	params['EMAIL'] = req.body.EMAIL
	params['MOBILE_NO'] = req.body.MOBILE_NO
	// ********************

	// console.log(params);

	checksum_lib.genchecksum(params, PaytmConfig.key, function (err, checksum) {

		return res.send({
			data: checksum,
			oid: params['ORDER_ID']
		});
	});
})


function getTime() {
	var today = new Date().toLocaleDateString()
	today = today.toString().replace('/', '-')
	today = today.replace('/', '-')
	const date = new Date();
	let h = date.getHours();
	let m = date.getMinutes();
	let s = date.getSeconds();

	today += '-' + h + '-' + m + '-' + s
	today += "-"
	today = today.split('-').join('');
	return today;
}

app.post('/callback2', (req, res) => {
	try {
		let data = req.body
		let splited = data.TXNDATE.split(' ')
		let date = splited[0]
		let datesplit = date.split('-')
		if (parseInt(datesplit[1]) < 10) {
			datesplit[1] = parseInt(datesplit[1])
		}
		if (parseInt(datesplit[2]) < 10) {
			datesplit[2] = parseInt(datesplit[2])
		}
		console.log(datesplit);
		let verifystring = datesplit[1].toString() + datesplit[2].toString() + datesplit[0].toString()
		console.log(verifystring);
		verifystring = verifystring.toString();
		let parentorderid = data.ORDERID.split(verifystring)
		console.log(parentorderid);
		let orderid = parentorderid[0]
		orderid = orderid.substr(0,24)
		console.log(orderid);

		if (data.STATUS == "TXN_SUCCESS") {
			const axios = require('axios');
			axios.post(" http://localhost:3000/user/paymentdoneweb", {
				id: orderid
			}).then(response => {
				var x = response.data

				if (x.errormsg) {
					res.render('fail')
				}
				if (x.msg) {
					res.render('success')
				}


			}).catch(error => {
				res.render('fail')
			});

		}
		else {
			res.render('fail')
		}
	} catch (error) {
		res.render('fail')
	}

})

app.listen(PORT, () => {
	console.log(`Listing on port ${PORT}`);
})

