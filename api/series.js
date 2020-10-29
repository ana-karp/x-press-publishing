const express = require('express');
const sqlite3 = require('sqlite3');
const issuesRouter = require('./issues');

const seriesRouter = new express.Router();
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

seriesRouter.use('/:seriesId/issues', issuesRouter);

seriesRouter.get('/', (req, res, next) => {
  db.all('SELECT * FROM Series', (err, series) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ series: series });
    }
  })
});

seriesRouter.param('seriesId', (req, res, next, seriesId) => {
  db.get(`SELECT * FROM Series WHERE id = ${seriesId};`, (err, series) => {
    if (err) {
      next(err);
    } else if (series) {
      req.series = series;
      next();
    } else {
      res.sendStatus(404);
    }
  })
});

seriesRouter.get('/:seriesId', (req, res, next) => {
  return res.status(200).json({ series: req.series });
});

const validateSeries = (req, res, next) => {
  const { name, description } = req.body.series;
  if (!name || !description) {
    return res.sendStatus(400);
  }
  next();
}

seriesRouter.post('/', validateSeries, (req, res, next) => {
  const { name, description } = req.body.series;
  db.run(`INSERT INTO Series (name, description) VALUES ($name, $description);`, {
    $name: name,
    $description: description
  }, function(err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Series WHERE id = ${this.lastID};`, (err, series) => {
        res.status(201).json({ series: series});
      });
    }
  });
});

seriesRouter.put('/:seriesId', validateSeries, (req, res, next) => {
  const { name, description } = req.body.series;
  db.run(`UPDATE Series SET name = $name, description = $description WHERE id = $seriesId;`, {
    $name: name,
    $description: description,
    $seriesId: req.params.seriesId
  }, (err) => {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Series WHERE id = ${req.params.seriesId}`, (err, series) => {
        return res.status(200).json({ series: series });
      });
    }
  })
});

module.exports = seriesRouter;