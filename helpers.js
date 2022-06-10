const { ESLint } = require("eslint");
const prettier = require("prettier");
const { v4: uuidv4 } = require('uuid');

const { Octokit } = require('octokit')
const octokit = new Octokit({
    auth: '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'
  });

const _USER = 'alujs';

function isSupportedType(filename) {
  const fileExtension = filename.split('.')[filename.split('.').length - 1];
  return fileExtension === 'tsx' || fileExtension === 'js' || fileExtension === 'jsx' || fileExtension === 'ts'
}

module.exports.processUrl = function(payload) {
  return {
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    pull_number: payload.pull_request.number
  };
}

async function  processFilesFromPullRequest({owner = '', repo = '', pull_number = '', pageNumber = 1, errors = [], url = ''}) {
  const esConfig = require('./eslint_config/config');
  const linter = new ESLint({ baseConfig: esConfig });

  const files = await octokit.request(`GET /repos/${owner}/${repo}/pulls/${pull_number}/files?page=${pageNumber}&per_page=100`);

  if (files.data.length === 0) {
    return errors;

  }

  for (const file of files.data) {
  

    if (isSupportedType(file.filename)) {
      const fileRawText = await octokit.request(`GET ${file?.raw_url}`, { owner, repo, pull_number});
      const lintResults = await linter.lintText(fileRawText.data);

      lintResults?.[0]?.messages.forEach(lintMessage => {
        if(lintMessage?.fatal) {
          errors.push(message + `\n\n Location: line -> ${lintMessage?.line} col -> ${lintMessage?.column} `);
        }
      });
  
      let str = '';
      
      // try {
      //   str = prettier.format(fileRawText,{
      //     parser: 'typescript',
      //     // plugins: [
      //     //   require('prettier/parser-typescript'),
      //     //   require('prettier/parser-postcss'),
      //     //   require('prettier/parser-html'),
      //     //   require('prettier/parser-babel')
      //     // ]
      //   })
      // } catch(e) {
      //   errors.push(`format error for file: ${file.fileName} \n\n ${str}`);
      // }
    }

 }

 return processFilesFromPullRequest({owner, repo, pull_number, pageNumber: pageNumber + 1, errors});
  
}

module.exports.processFilesFromPullRequest = processFilesFromPullRequest;

module.exports.hasCurrentReview = async function ({owner = '', repo = '', pull_number = '', pageNumber = 1, errors = []}) {
  const reviews =  await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews', {
    owner,
    repo,
    pull_number
  })
  
  return reviews.data.filter(review => review.user.id === _USER ).length > 0
}


module.exports.updateReview = async function ({owner = '', repo = '', pull_number = '', errors = [], review_id = ''}) {
  return await octokit.request(`PUT /repos/${owner}/${repo}/pulls/${pull_number}/reviews/${review_id}/events`, { ...(errors.length > 0 && { body: errors.join('\n') }), event: errors.length > 0 ? 'REQUEST_CHANGES' : 'APPROVE'})
};

module.exports.createReview = async function ({owner = '', repo = '', pull_number = '', errors = []}) {
  return await octokit.request(`POST /repos/${owner}/${repo}/pulls/${pull_number}/reviews`, { ...(errors.length > 0 && { body: errors.join('\n') }), event: errors.length > 0 ? 'REQUEST_CHANGES' : 'APPROVE'})
};
