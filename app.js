const express = require('express');
const bodyParser =require('body-parser');
const axios = require('axios');
const PORT = process.env.PORT || 5000;

const EthCrypto = require('eth-crypto');

// Set up the express app
const app = express();

// Parse incoming requests data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const infura = 'https://rinkeby.infura.io/v3/4f08ce086ae2423194b457836aebdb1d'
const appSalt = '12345123451234512345123451234512345123451234512345123451234512345123451234512345123451234512345123451234512345123451234512345123451234512345123451234512345123451234512345123451234512345123451234512345123451234512345123451234512345123451234512345123451234512345';


// get id given username and password
app.get('/api/v1/id', (req, res) => {

  if(!req.body.username) {
    return res.status(400).send({
      success: 'false',
      message: 'username is required'
    })
  } else if(!req.body.password) {
    return res.status(400).send({
      success: 'false',
      message: 'password is required'
    });
  }

  let username = req.body.username;
  let password = req.body.password;
  let userIdentity = createNewUser(username, password, appSalt);

  const user = {
    address: userIdentity.address,
    pubKey: userIdentity.publicKey
  }

  res.status(200).send({
    success: 'true',
    message: 'users created successfully',
    user
  })
});

app.post('/api/v1/send_transaction', async (req, res) => {

  if(!req.body.username) {
    return res.status(400).send({
      success: 'false',
      message: 'username is required'
    })
  } else if(!req.body.password) {
    return res.status(400).send({
      success: 'false',
      message: 'password is required'
    });
  }

  let username = req.body.username;
  let password = req.body.password;
  let userIdentity = createNewUser(username, password, appSalt);

  let amount = req.query.amount;
  let dest = req.query.destination;

  let address = userIdentity.address

  let txCount = await axios.post(infura, {
    "jsonrpc": "2.0",
    "method": "eth_getTransactionCount",
    "params": [address, "latest"],
    "id": 1
  });


  let hexNonce = txCount.data.result;
  let shortHexNonce = hexNonce.substring(2)
  let nonceInt = parseInt(shortHexNonce, 16);
  console.log('nonce: ' + nonceInt);

  const rawTx = {
    from: userIdentity.address,
    to: dest,
    value: amount,
    nonce: nonceInt,
    gasPrice: 15000000000,
    gasLimit: 4000000,
    chainId: 4
  }

  const signedTx = EthCrypto.signTransaction(
    rawTx,
    userIdentity.privateKey
  );
  let adjSignedTx = '0x' + signedTx;
  console.log(adjSignedTx);

  let receipt = await axios.post(infura, {
        "jsonrpc": "2.0",
        "method": "eth_sendRawTransaction",
        "params": [adjSignedTx],
        "id": 1
      });
  console.log("return value:" + returnValue)
  let returnValue = 'https://rinkeby.etherscan.io/tx/' + receipt.data.result

  res.status(200).send({
    success: 'true',
    message: 'transaction sent!',
    txHash: returnValue,
    sender: address,
    recipient: dest
  })
});

function createNewUser(username, password, salt) {
  let entropyString = username + password + salt;
  let entropy = Buffer.from(entropyString, 'utf-8');
  let identity = EthCrypto.createIdentity(entropy);
  return identity
}


app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
});