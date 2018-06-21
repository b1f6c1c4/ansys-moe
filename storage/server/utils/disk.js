/*
 * ansys-moe: Computer-automated Design System
 * Copyright (C) 2018  Jinzheng Tu
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
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
