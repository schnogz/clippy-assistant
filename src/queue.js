let Queue = function (onEmptyCallback) {
  this._queue = [];
  this._onEmptyCallback = onEmptyCallback;
};

Queue.prototype = {
  /***
   *
   * @param {function(Function)} func
   * @returns {jQuery.Deferred}
   */
  queue:function (func) {
    this._queue.push(func);
    this.next();
  },

  next:function () {
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

  _finish:function() {
    this._active = false;
    this.next();
  },

  clear:function () {
    this._queue = [];
  },
};

export default Queue;