/* eslint-disable no-console */
const netlify = require('netlify');
const path = require('path');

const run = async (draft = false) => {
  try {
    const client = netlify.createClient({
      access_token: process.env.NETLIFYKEY,
    });
    const site = await client.site('a9ee2384-e39a-4ffc-83b6-e658e183fa60');

    const deploy = await site.createDeploy({
      dir: path.join(__dirname, '../../build'),
      draft,
      progress: console.log,
    });
    await deploy.waitForReady();
    console.log('Success');
  } catch (err) {
    console.error(err);
  }
};

if (process.env.NETLIFYKEY) {
  console.log('Start deploying to Netlify...');
  run(process.argv.includes('--draft'));
} else {
  console.log('Ignore deploying to Netlify');
}
