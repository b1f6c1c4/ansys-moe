const db = {};

module.exports = {
  connect: () => {},
  get: (key) => ({
    number: async () => db[key] && parseInt(db[key], 10),
    json: async () => db[key] && JSON.parse(db[key]),
  }),
  put: (key) => ({
    value: (value) => ({
      exec: async () => { db[key] = JSON.stringify(value); },
    }),
  }),
  mock: () => db,
};
