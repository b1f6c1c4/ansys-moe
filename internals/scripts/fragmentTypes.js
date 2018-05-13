const _ = require('lodash');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */

fetch(`${process.env.API_URL}/graphql`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `
      {
        __schema {
          types {
            kind
            name
            possibleTypes {
              name
            }
          }
        }
      }
    `,
  }),
})
  .then((result) => result.json())
  .then((result) => {
    // here we're filtering out any type information unrelated to unions or interfaces
    const filteredData = result.data.__schema.types.filter(
      (type) => type.possibleTypes !== null,
    );
    _.set(result, 'data.__schema.types', filteredData);
    const file = path.join(__dirname, '../../app/utils/fragmentTypes.json');
    fs.writeFile(file, JSON.stringify(result.data), (err) => {
      if (err) {
        console.error('Error writing fragmentTypes file', err);
      }
      console.log('Fragment types successfully extracted!');
    });
  });
