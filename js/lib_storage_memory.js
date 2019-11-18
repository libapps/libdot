// Copyright (c) 2012 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

/**
 * In-memory storage class with an async interface that is interchangeable with
 * other lib.Storage.* implementations.
 *
 * @constructor
 * @implements {lib.Storage}
 */
lib.Storage.Memory = function() {
  this.observers_ = [];
  this.storage_ = {};
};

/**
 * Register a function to observe storage changes.
 *
 * @param {function(!Object)} callback The function to invoke when the storage
 *     changes.
 * @override
 */
lib.Storage.Memory.prototype.addObserver = function(callback) {
  this.observers_.push(callback);
};

/**
 * Unregister a change observer.
 *
 * @param {function(!Object)} callback A previously registered callback.
 * @override
 */
lib.Storage.Memory.prototype.removeObserver = function(callback) {
  var i = this.observers_.indexOf(callback);
  if (i != -1)
    this.observers_.splice(i, 1);
};

/**
 * Delete everything in this storage.
 *
 * @param {function()=} callback The function to invoke when the delete has
 *     completed.
 * @override
 */
lib.Storage.Memory.prototype.clear = function(callback) {
  var e = {};
  for (var key in this.storage_) {
    e[key] = {oldValue: this.storage_[key], newValue: undefined};
  }

  this.storage_ = {};

  setTimeout(function() {
    for (var i = 0; i < this.observers_.length; i++) {
      this.observers_[i](e);
    }
  }.bind(this), 0);

  if (callback) {
    setTimeout(callback, 0);
  }
};

/**
 * Return the current value of a storage item.
 *
 * @param {string} key The key to look up.
 * @param {function(*)} callback The function to invoke when the value has
 *     been retrieved.
 * @override
 */
lib.Storage.Memory.prototype.getItem = function(key, callback) {
  var value = this.storage_[key];

  if (typeof value == 'string') {
    try {
      value = JSON.parse(value);
    } catch (e) {
      // If we can't parse the value, just return it unparsed.
    }
  }

  setTimeout(callback.bind(null, value), 0);
};

/**
 * Fetch the values of multiple storage items.
 *
 * @param {?Array<string>} keys The keys to look up.  Pass null for all keys.
 * @param {function(!Object)} callback The function to invoke when the values
 *     have been retrieved.
 * @override
 */
lib.Storage.Memory.prototype.getItems = function(keys, callback) {
  var rv = {};
  if (!keys) {
    keys = Object.keys(this.storage_);
  }

  for (var i = keys.length - 1; i >= 0; i--) {
    var key = keys[i];
    var value = this.storage_[key];
    if (typeof value == 'string') {
      try {
        rv[key] = JSON.parse(value);
      } catch (e) {
        // If we can't parse the value, just return it unparsed.
        rv[key] = value;
      }
    } else {
      keys.splice(i, 1);
    }
  }

  setTimeout(callback.bind(null, rv), 0);
};

/**
 * Set a value in storage.
 *
 * @param {string} key The key for the value to be stored.
 * @param {*} value The value to be stored.  Anything that can be serialized
 *     with JSON is acceptable.
 * @param {function()=} callback Function to invoke when the set is complete.
 *     You don't have to wait for the set to complete in order to read the value
 *     since the local cache is updated synchronously.
 * @override
 */
lib.Storage.Memory.prototype.setItem = function(key, value, callback) {
  var oldValue = this.storage_[key];
  this.storage_[key] = JSON.stringify(value);

  var e = {};
  e[key] = {oldValue: oldValue, newValue: value};

  setTimeout(function() {
    for (var i = 0; i < this.observers_.length; i++) {
      this.observers_[i](e);
    }
  }.bind(this), 0);

  if (callback) {
    setTimeout(callback, 0);
  }
};

/**
 * Set multiple values in storage.
 *
 * @param {!Object} obj A map of key/values to set in storage.
 * @param {function()=} callback Function to invoke when the set is complete.
 *     You don't have to wait for the set to complete in order to read the value
 *     since the local cache is updated synchronously.
 * @override
 */
lib.Storage.Memory.prototype.setItems = function(obj, callback) {
  var e = {};

  for (var key in obj) {
    e[key] = {oldValue: this.storage_[key], newValue: obj[key]};
    this.storage_[key] = JSON.stringify(obj[key]);
  }

  setTimeout(function() {
    for (var i = 0; i < this.observers_.length; i++) {
      this.observers_[i](e);
    }
  }.bind(this));

  if (callback) {
    setTimeout(callback, 0);
  }
};

/**
 * Remove an item from storage.
 *
 * @param {string} key The key to be removed.
 * @param {function()=} callback Function to invoke when the remove is complete.
 *     The local cache is updated synchronously, so reads will immediately
 *     return undefined for this item even before removeItem completes.
 * @override
 */
lib.Storage.Memory.prototype.removeItem = function(key, callback) {
  delete this.storage_[key];

  if (callback) {
    setTimeout(callback, 0);
  }
};

/**
 * Remove multiple items from storage.
 *
 * @param {!Array<string>} ary The keys to be removed.
 * @param {function()=} callback Function to invoke when the remove is complete.
 *     The local cache is updated synchronously, so reads will immediately
 *     return undefined for these items even before removeItems completes.
 * @override
 */
lib.Storage.Memory.prototype.removeItems = function(ary, callback) {
  for (var i = 0; i < ary.length; i++) {
    delete this.storage_[ary[i]];
  }

  if (callback) {
    setTimeout(callback, 0);
  }
};
