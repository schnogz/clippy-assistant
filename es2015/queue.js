"use strict";

SystemJS.register([], function (_export, _context) {
  "use strict";

  var Queue;
  return {
    setters: [],
    execute: function () {
      Object.defineProperty(exports, "__esModule", {
        value: true
      });

      Queue = function Queue(onEmptyCallback) {
        this._queue = [];
        this._onEmptyCallback = onEmptyCallback;
      };

      Queue.prototype = {
        /***
         *
         * @param {function(Function)} func
         * @returns {jQuery.Deferred}
         */
        queue: function queue(func) {
          this._queue.push(func);
          this.next();
        },

        next: function next() {
          if (this._active) return;

          // stop if nothing left in queue
          if (!this._queue.length) {
            this._onEmptyCallback();
            return;
          }

          var f = this._queue.shift();
          this._active = true;

          // execute function
          var completeFunction = this._finish.bind(this);
          f(completeFunction);
        },

        _finish: function _finish() {
          this._active = false;
          this.next();
        },

        clear: function clear() {
          this._queue = [];
        }
      };

      exports.default = Queue;
    }
  };
});