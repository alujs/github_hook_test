const express = require('express')
const app = express()
const bodyParser = require('body-parser')

app.get('/', function (req, res) {
  res.send('Hello World')
})


app.post('/', bodyParser.json(), (req, res) => {
    console.log('HELLO req', req.body)
});


app.listen(3030)