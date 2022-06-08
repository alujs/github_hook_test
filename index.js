const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const { Octokit } = require('octokit')
const octokit = new Octokit({
    auth: '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'
  })

app.get('/', function (req, res) {
  res.send('Hello World')
})


app.post('/', bodyParser.json(), (req, res) => {
    console.log('HELLO req', req.body)
});


app.listen(3030)