import { ING } from "open-psd2";

const fs = require("fs");
const express = require('express');
const app = express();

// Sandbox
//const bank = new ING(true, fs.readFileSync("./secrets/client_credentials/example_client_signing.key"), "changeit", fs.readFileSync("./secrets/client_credentials/example_client_tls.cer"), fs.readFileSync("./secrets/client_credentials/example_client_tls.key"), "example_client_id");
const bank = new ING(true, fs.readFileSync("./secrets/authorization/example_eidas_client_signing.key"), "test", fs.readFileSync("./secrets/authorization/example_eidas_client_tls.cer"), fs.readFileSync("./secrets/authorization/example_eidas_client_tls.key"), "SN=499602D2");  
//TODO keyId and authorizationCode
// https://developer.ing.com/openbanking/get-started
// To obtain the application access token use https://api.sandbox.ing.com/oauth2/token endpoint.
// Please note the TPP-Signature-Certificate header. This header must contain the public eIDAS signing certificate as a single line string.
// In the sandbox the keyId value is of the format: SN=XXX,CA=YYYYYYYYYYYYYYYY. Where “XXX" is the serial number of the certificate in hexadecimal coding and "YYYYYYYYYYYYYYYY" is the full Distinguished Name of CA having produced this certificate. For more details, see OAuth 2.0 API.
const authorizationCode = "76175013-94d0-411d-927c-0af6bb828c7c";

app.get('/', function (req, res) {
    res.send(`
    <h1>Available Urls</h1>
    <ul>
        <li><a href="/greetings">Greetings (non-sandbox)</a></li>
        <li><a href="/accounts">Accounts (sandbox)</a></li>
        <li><a href="/authorization-url">Authorization-url (sandbox)</a></li>
    </ul>
    `)
});

app.get('/greetings', function (req, res) {
    bank.requestAccessToken("greetings:view").then(access_token => {
        bank.requestShowcase(access_token).then((greetings) => {
            res.send(greetings);
        }).catch((error) => { res.send("Could not retrieve greetings"); console.log(error); });
    }).catch((error) => { res.send("Could not retrieve access token"); console.log(error); });
});

app.get('/accounts', function (req, res) {
    bank.requestAccessToken("view_balance").then(access_token => {
        bank.requestCustomerAccessToken(authorizationCode, access_token).then((customer_access_token) => {
            bank.requestAccounts(customer_access_token).then(accounts => {
                let html = "<h1>Accounts</h1><ul>"
                accounts.forEach(account => {
                    html += `
                    <li>
                        ${account.name} (${account.iban}) 
                        <a href="/accounts/${account.accountId}/balances">Balances</a>
                        <a href="/accounts/${account.accountId}/transactions">Transactions</a>
                    </li>`
                })
                html += "</ul>";
                res.send(html);
            }).catch((error) => { res.send("Could not retrieve accounts"); console.log(error); });
        }).catch((error) => { res.send("Could not retrieve customer access token"); console.log(error); });
    }).catch((error) => { res.send("Could not retrieve access token"); console.log(error); });
});

app.get('/accounts/:accountId/balances', function (req, res) {
    bank.requestAccessToken("view_balance").then(access_token => {
        bank.requestCustomerAccessToken(authorizationCode, access_token).then((customer_access_token) => {
            bank.requestBalances(customer_access_token, req.params.accountId).then(data => {
                res.send(data);
            }).catch((error) => { res.send("Could not retrieve balances"); console.log(error); });
        }).catch((error) => { res.send("Could not retrieve customer access token"); console.log(error); });
    }).catch((error) => { res.send("Could not retrieve access token"); console.log(error); });
});

app.get('/accounts/:accountId/transactions', function (req, res) {
    bank.requestAccessToken("view_balance").then(access_token => {
        bank.requestCustomerAccessToken(authorizationCode, access_token).then((customer_access_token) => {
            bank.requestTransactions(customer_access_token, req.params.accountId).then(data => {
                res.send(data);
            }).catch((error) => { res.send("Could not retrieve transactions"); console.log(error); });
        }).catch((error) => { res.send("Could not retrieve customer access token"); console.log(error); });
    }).catch((error) => { res.send("Could not retrieve access token"); console.log(error); });
});

app.get('/authorization-url', function (req, res) {
    bank.requestAccessToken("view_balance").then(access_token => {
        bank.requestAuthorizationUrl("view_balance", "nl", access_token).then(url => {
            res.send(url);
        }).catch((error) => { res.send("Could not retrieve authorization url"); console.log(error); });
    }).catch((error) => { res.send("Could not retrieve access token"); console.log(error); });
});

/**
 * Start Express server.
 */
app.listen(1337, () => {
    console.log("The server is running at: localhost:1337");
});
