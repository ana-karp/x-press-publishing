const express = require('express');
const sqlite3 = require('sqlite3');

const artistsRouter = new express.Router();
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

artistsRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Artist WHERE is_currently_employed = 1;`, (err, artists) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ artists: artists });
    }
  })
})

module.exports = artistsRouter;