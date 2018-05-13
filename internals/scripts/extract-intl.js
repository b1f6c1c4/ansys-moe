/* eslint-disable no-restricted-syntax */
const fs = require('fs');
const nodeGlob = require('glob');
const babel = require('@babel/core');
const { mkdir } = require('shelljs');
const rawResources = require('../../app/translations');

const ROOT_LOCALE = 'en';

// Glob to match all messages files
const FILES_TO_PARSE = 'app/**/messages.js';
const locales = Object.keys(rawResources);

// Progress Logger
const task = (message) => {
  /* eslint-disable no-console */
  console.log(message);

  return (error) => {
    if (error) {
      console.error(error);
    }
  };
  /* eslint-enable no-console */
};

// Wrap async functions below into a promise
const glob = (pattern) => new Promise((resolve, reject) => {
  nodeGlob(pattern, (error, value) => (error ? reject(error) : resolve(value)));
});

const readFile = (fileName) => new Promise((resolve, reject) => {
  fs.readFile(fileName, (error, value) => (error ? reject(error) : resolve(value)));
});

const writeFile = (fileName, data) => new Promise((resolve, reject) => {
  fs.writeFile(fileName, data, (error, value) => (error ? reject(error) : resolve(value)));
});

// Store existing translations into memory
const oldLocaleMappings = [];
const localeMappings = [];
// Loop to run once per locale
for (const locale of locales) {
  oldLocaleMappings[locale] = {};
  localeMappings[locale] = {};
  // File to store translation messages into
  const translationFileName = `app/translations/${locale}.json`;
  try {
    // Parse the old translation message JSON files
    const messages = JSON.parse(fs.readFileSync(translationFileName));
    const messageKeys = Object.keys(messages);
    for (const messageKey of messageKeys) {
      oldLocaleMappings[locale][messageKey] = messages[messageKey];
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      process.stderr.write(
        `There was an error loading this translation file: ${translationFileName}
        \n${error}`,
      );
    }
  }
}

const presets = ['@babel/preset-stage-0'];
const plugins = ['react-intl'];

const extractFromFile = async (fileName) => {
  try {
    const code = await readFile(fileName);
    // Use babel plugin to extract instances where react-intl is used
    const { metadata: result } = await babel.transform(code, {
      filename: fileName,
      presets,
      plugins,
    }); // object-shorthand
    for (const message of result['react-intl'].messages) {
      for (const locale of locales) {
        const oldLocaleMapping = oldLocaleMappings[locale][message.id];
        // Merge old translations into the babel extracted instances where react-intl is used
        const newMsg = (locale === ROOT_LOCALE) ? message.defaultMessage : '';
        localeMappings[locale][message.id] = oldLocaleMapping || newMsg;
      }
    }
  } catch (error) {
    process.stderr.write(`Error transforming file: ${fileName}\n${error.stack}`);
  }
};

(async function main() {
  const memoryTaskDone = task('Storing language files in memory');
  const files = await glob(FILES_TO_PARSE);
  memoryTaskDone();

  const extractTaskDone = task('Run extraction on all files');
  // Run extraction on all files that match the glob on line 16
  await Promise.all(files.map((fileName) => extractFromFile(fileName)));
  extractTaskDone();

  const appendLangDone = task('Append lang');
  locales.forEach((locale) => {
    localeMappings[locale].lang = oldLocaleMappings[locale].lang;
    localeMappings[locale].language = oldLocaleMappings[locale].language;
  });
  appendLangDone();

  // Make the directory if it doesn't exist, especially for first run
  mkdir('-p', 'app/translations');
  /* eslint-disable no-await-in-loop */
  for (const locale of locales) {
    const translationFileName = `app/translations/${locale}.json`;

    const localeTaskDone = task(`Writing translation messages for ${locale} to: ${translationFileName}`);

    try {
      // Sort the translation JSON file so that git diffing is easier
      // Otherwise the translation messages will jump around every time we extract
      const messages = {};
      Object.keys(localeMappings[locale]).sort().forEach((key) => {
        messages[key] = localeMappings[locale][key];
      });

      // Write to file the JSON representation of the translation messages
      const prettified = `${JSON.stringify(messages, null, 2)}\n`;

      // eslint-disable-next-line no-await-in-loop
      await writeFile(translationFileName, prettified);

      localeTaskDone();
    } catch (error) {
      localeTaskDone(
        `There was an error saving this translation file: ${translationFileName}
        \n${error}`,
      );
    }
  }
  /* eslint-enable no-await-in-loop */

  process.exit();
}());
