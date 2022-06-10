const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { processUrl, hasCurrentReview, updateReview, createReview, processFilesFromPullRequest } = require('./helpers');


app.get('/', function (req, res) {
  res.send('Hello World')
})


app.post('/', bodyParser.json(), async (req, res) => {
  console.log('HEY we got an action,', req.body.action);
  if (req.body.action === 'opened' || req.body.action === 'reopened') {
    try {
      const meta = processUrl(req.body);

      meta.errors = await processFilesFromPullRequest(meta);
  
      if (await hasCurrentReview(meta) ) {
        await updateReview(meta);
      } else {
        await createReview(meta);
      }
    } catch(e) {
      console.log(e);
      return res.status(500).send(e);
    }
  }

  res.status(202).send(true);
});


app.listen(3030)