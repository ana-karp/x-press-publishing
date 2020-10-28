const express = require('express');
const sqlite3 = require('sqlite3');

const artistsRouter = new express.Router();
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

// Get all employed artists from database
artistsRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Artist WHERE is_currently_employed = 1;`, (err, artists) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ artists: artists });
    }
  })
})

artistsRouter.param('artistId', (req, res, next, artistId) => {
  db.get(`SELECT * FROM Artist WHERE id = ${artistId};`, (err, artist) => {
    if (err) {
      next(err);
    } else if (artist) {
      req.artist = artist;
      next();
    } else {
      res.sendStatus(404);
    }
  })
});

// Get artist by ID
artistsRouter.get('/:artistId', (req, res, next) => {
  return res.status(200).json({ artist: req.artist });
});

const validateArtist = (req, res, next) => {
  const { name, dateOfBirth, biography } = req.body.artist;
  if (!name || !dateOfBirth || !biography) {
    return res.sendStatus(400);
  }
  next();
}

artistsRouter.post('/', validateArtist, (req, res, next) => {
  const { name, dateOfBirth, biography } = req.body.artist;
  const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
  db.run(`INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) 
  VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed);`, {
    $name: name,
    $dateOfBirth: dateOfBirth,
    $biography: biography,
    $isCurrentlyEmployed: isCurrentlyEmployed
  }, function (err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Artist WHERE id = ${this.lastID}`, (err, artist) => {
        res.status(201).json({ artist: artist });
      })
    }
  })
});

// Update artist by ID
artistsRouter.put('/:artistId', validateArtist, (req, res, next) => {
  const { name, dateOfBirth, biography } = req.body.artist;
  const isCurrentlyEmployed = req.body.artist.isCurrentlyEmployed === 0 ? 0 : 1;
  db.run(`UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, biography = $biography, 
  is_currently_employed = $isCurrentlyEmployed WHERE id = $artistId;`, {
    $name: name,
    $dateOfBirth: dateOfBirth,
    $biography: biography,
    $isCurrentlyEmployed: isCurrentlyEmployed,
    $artistId: req.params.artistId
  }, function (err) {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Artist WHERE id = ${req.params.artistId}`, (err, artist) => {
        return res.status(200).json({ artist: artist });
      });
    }
  })
});

artistsRouter.delete('/:artistId', (req, res, next) => {
  db.run(`UPDATE Artist SET is_currently_employed = 0 WHERE id = ${req.params.artistId};`, (err) => {
    if(err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Artist WHERE id = ${req.params.artistId}`, (err, artist) => {
        return res.status(200).json({ artist: artist });
      });
    }
  });
});

module.exports = artistsRouter;