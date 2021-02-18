const dotenv = require('dotenv');
dotenv.config();
const axios = require('axios');
const jsforce = require('jsforce');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const bodyParser= require('body-parser');
const PORT = process.env.PORT || 3000 ;
const url = require('url');
var querystring = require('querystring');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.get('/', (req, res) => {
    const str="I AM AN ENDPOINT FOR YOUR SALESFORCE APPLICATION";
    res.send(str);
});
app.post('/', (req, res) => {
   
    console.log(req.body);
    const data=req.body;
    if(JSON.stringify(data) != '{}'){
        if(typeof req.cookies['jwttoken'] === "undefined" && typeof req.cookies['instanceurl'] === "undefined")
        {
            generateJWTToken(res,data);
        }
        else 
        {
            var conn = new jsforce.Connection({
                instanceUrl: req.cookies['instanceurl'],
                accessToken: req.cookies['jwttoken']
                });
            conn.apex.post("/Inquiry/",data, function(err, res1) {
            if (err) { return console.error(err); }
            //console.log("response: ", res1);
            
            res.send(res1);
            //console.log("API Limit: " + conn.limitInfo.apiUsage.limit);
            //console.log("API Used: " + conn.limitInfo.apiUsage.used);
            // the response object structure depends on the definition of apex class
            });
        } 
        
    }
    else{
        res.send('No data Received');
    }
});
app.listen(PORT, () => {
    console.log(`Listening on ${ PORT }`);
});
function generateJWTToken(res,data) {
    var privatekey = process.env.PRIVATEKEY;
    
    var jwtparams = {
        iss: process.env.CONSUMERKEY,
        prn: process.env.USERNAME,
        aud: process.env.URL,
        exp: parseInt(moment().add(2, 'minutes').format('X'))
    };
    var token = jwt.sign(jwtparams, privatekey, { algorithm: 'RS256' });

    var params = {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
    };
    
    var token_url = new url.URL('/services/oauth2/token', process.env.URL).toString();
    
    axios.post(token_url, querystring.stringify(params))
    .then(function (res2) {
        //console.log(res2);
        res.cookie('jwttoken', res2.data.access_token , { maxAge: 900000, httpOnly: true });
        res.cookie('instanceurl', res2.data.instance_url , { maxAge: 900000, httpOnly: true });
        var conn = new jsforce.Connection({
            instanceUrl: res2.data.instance_url,
            accessToken: res2.data.access_token
        });
        conn.apex.post("/Inquiry/",data, function(err, res1) {
            if (err) { return console.error(err); }
            //console.log("response: ", res1);
            res.send(res1);
            // the response object structure depends on the definition of apex class
          });
    });
        
        //echoing the request data back as response
}