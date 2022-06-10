const { ESLint } = require("eslint");
const prettier = require("prettier");
const { v4: uuidv4 } = require('uuid');

const { Octokit } = require('octokit')
const octokit = new Octokit({
    auth: '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'
  });

  const review_id = 'github_app_reviewer'; 

module.exports.processUrl = function(payload) {
  return {
    owner: payload.repository.owner.login,
    repo: payload.repository.repo,
    pull_number: payload.pull_number.number
  };
}

module.exports.processFilesFromPullRequest = async function  ({owner = '', repo = '', pull_number = '', pageNumber = 1, errors = [], url = ''}) {
  const esConfig = require('./eslint_config/config');
  const linter = new ESLint({ baseConfig: esConfig });

  const files = await octokit.request(`GET /repos/${owner}/${repo}/pulls/${pull_number}/files?page=${pageNumber}&per_page=100`);


  for (const file of files) {
    if (!file?.fileName) return;

    if (file.fileName.indexOf('.tsx') === -1 || file.fileName.indexOf('.js') === -1 || file.fileName.indexOf('.jsx') === -1 || file.fileName.indexOf('.ts') === -1) return;  // should move it to a rules list.

    const fileRawText = await await octokit.request(`GET ${file?.raw_url}`, { owner, repo, pull_number});
    console.log('HE THIS IS THE FILEZ', file.fileName);
    const lintResults = await linter.lintText(fileRawText);
    console.log('HEY HEY LINT RESULTS', lintResults);
    lintResults?.messages?.forEach(lintMessage => {
      if(lintMessage?.fatal) {
        errors.push(message + `\n\n Location: line -> ${lintMessage?.line} col -> ${lintMessage?.column} `);
      }
    });

    let str = '';
    
    try {
      str = prettier.format(fileRawText,{
        parser: 'typescript',
        plugins: [
          require('prettier/parser-typescript'),
          require('prettier/parser-postcss'),
          require('prettier/parser-html'),
          require('prettier/parser-babel')
        ]
      })
    } catch(e) {
      errors.push(`format error for file: ${file.fileName} \n\n ${str}`);
    }


  if (files.length === 0) {
    return errors;

  } else {
    return processFilesFromPullRequest({owner, repo, pull_number, pageNumber: pageNumber + 1, errors});
  }

 }
  
}

module.exports.hasCurrentReview = async function ({owner = '', repo = '', pull_number = '', pageNumber = 1, errors = []}) {
  return await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
    owner: 'OWNER',
    repo: 'REPO',
    pull_number: 'PULL_NUMBER'
  }).filter(review => review.id === review_id ).length > 0
}


module.exports.updateReview = async function ({owner = '', repo = '', pull_number = '', errors = []}) {
  return await octokit.request(`PUT /repos/${owner}/${repo}/pulls/${pull_number}/reviews/${review_id}/events`, { ...(errors.length > 0 && { body: errors.join('\n') }), event: errors.length > 0 ? 'REQUEST_CHANGES' : 'APPROVE'})
};

module.exports.createReview = async function ({owner = '', repo = '', pull_number = '', errors = []}) {
  return await octokit.request(`POST /repos/${owner}/${repo}/pulls/${pull_number}/reviews/${review_id}/events`, { ...(errors.length > 0 && { body: errors.join('\n') }), event: errors.length > 0 ? 'REQUEST_CHANGES' : 'APPROVE'})
};
