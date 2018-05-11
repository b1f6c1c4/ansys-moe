// The following code is copied from
// https://github.com/expressjs/multer/storage/disk.js
// and
// https://github.com/microacup/multer/blob/master/storage/disk.js
// WITH MINOR MIDIFICATION

/* eslint-disable */

var fs = require('fs')
var os = require('os')
var path = require('path')
var crypto = require('crypto')
var mkdirp = require('mkdirp')

function getFilename (req, file, cb) {
  crypto.pseudoRandomBytes(16, function (err, raw) {
    cb(err, err ? undefined : raw.toString('hex'))
  })
}

function getDestination (req, file, cb) {
  cb(null, os.tmpdir())
}

function HashDiskStorage (opts) {
  this.getFilename = getFilename

  if (typeof opts.destination === 'string') {
    mkdirp.sync(opts.destination)
    this.getDestination = function ($0, $1, cb) { cb(null, opts.destination) }
  } else {
    this.getDestination = (opts.destination || getDestination)
  }
}

HashDiskStorage.prototype._handleFile = function _handleFile (req, file, cb) {
  var that = this

  var hasher = crypto.createHash('sha1')
  that.getDestination(req, file, function (err, destination) {
    if (err) return cb(err)
    mkdirp.sync(destination)

    that.getFilename(req, file, function (err, filename) {
      if (err) return cb(err)

      var finalPath = path.join(destination, filename)
      var outStream = fs.createWriteStream(finalPath)

      file.stream.on('data', function (chunk) {
        hasher.update(chunk)
      })
      file.stream.pipe(outStream)
      outStream.on('error', cb)
      outStream.on('finish', function () {
        var hash = hasher.digest('hex').toLowerCase()
        var newPath = path.join(destination, hash)
        fs.rename(finalPath, newPath, function (err) {
          if (err) return cb(err)

          cb(null, {
            destination: destination,
            filename: hash,
            path: newPath,
            size: outStream.bytesWritten
          })
        })
      })
    })
  })
}

HashDiskStorage.prototype._removeFile = function _removeFile (req, file, cb) {
  var path = file.path

  delete file.destination
  delete file.filename
  delete file.path

  fs.unlink(path, cb)
}

module.exports = function (opts) {
  return new HashDiskStorage(opts)
}
