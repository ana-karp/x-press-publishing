const express = require('express');
const sqlite3 = require('sqlite3');

const issuesRouter = new express.Router({mergeParams: true});
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

issuesRouter.get('/', (req, res, next) => {
  db.all(`SELECT * FROM Issue WHERE series_id = ${req.params.seriesId};`,
  (err, issues) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ issues: issues});
    }
  })
});

issuesRouter.param('issueId', (req, res, next, issueId) => {
  db.get(`SELECT * FROM Issue WHERE id = ${issueId}`, (err, issue) => {
    if (err) {
      next(err);
    } else if (issue) {
      req.issue = issue;
      next();
    } else {
      res.sendStatus(404);
    }
  })
});

const validateIssue = (req, res, next) => {
  const { name, issueNumber, publicationDate, artistId } = req.body.issue;
  db.get(`SELECT * FROM Artist WHERE id = ${artistId};`, (err, artist) => {
    if (err) {
      next(err);
    } else {
      if (!name || !issueNumber || !publicationDate || !artist) {
        res.sendStatus(400);
      }
      next();
    }
  });
}

issuesRouter.post('/', validateIssue, (req, res, next) => {
  const { name, issueNumber, publicationDate, artistId } = req.body.issue;
  const seriesId = req.params.seriesId;
  db.run(`INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) VALUES (
    $name, $issueNumber, $publicationDate, $artistId, $seriesId)`, {
      $name: name,
      $issueNumber: issueNumber,
      $publicationDate: publicationDate,
      $artistId: artistId,
      $seriesId: seriesId
    }, function (err) {
      if (err) {
        next(err);
      } else {
        db.get(`SELECT * FROM Issue WHERE id = ${this.lastID};`, (err, issue) => {
          res.status(201).json({ issue: issue });
        })
      }
    });
});

// Update issue by id
issuesRouter.put('/:issueId', validateIssue, (req, res, next) => {
  const { name, issueNumber, publicationDate, artistId } = req.body.issue;
  db.run(`UPDATE Issue SET name = $name, issue_number = $issueNumber, publication_date = $publicationDate, 
  artist_id = $artistId WHERE id = $issueId`, {
    $name: name,
    $issueNumber: issueNumber,
    $publicationDate: publicationDate,
    $artistId: artistId,
    $issueId: req.params.issueId
  }, (err) => {
    if (err) {
      next(err);
    } else {
      db.get(`SELECT * FROM Issue WHERE id = ${req.params.issueId}`, (err, issue) => {
        return res.status(200).json({ issue: issue });
      });
    }
  });
});

// Delete issue by id
issuesRouter.delete('/:issueId', (req, res, next) => {
  db.run(`DELETE FROM Issue WHERE id = ${req.params.issueId}`, (err) => {
    if (err) {
      next(err);
    } else {
      res.sendStatus(204);
    }
  })
})
 
module.exports = issuesRouter;