'use strict';

SystemJS.register([], function (_export, _context) {
  "use strict";

  var _animator, _animator2, _balloon, _balloon2, _queue, _queue2, _Agent$prototype, Agent;

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  return {
    setters: [],
    execute: function () {
      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      _animator = require('./animator.js');
      _animator2 = _interopRequireDefault(_animator);
      _balloon = require('./balloon.js');
      _balloon2 = _interopRequireDefault(_balloon);
      _queue = require('./queue.js');
      _queue2 = _interopRequireDefault(_queue);

      Agent = function Agent(path, data, sounds) {
        this.path = path;
        this._queue = new _queue2.default(this._onQueueEmpty.bind(this));
        this._el = $('<div class="clippy"></div>').hide();
        $(document.body).append(this._el);
        this._animator = new _animator2.default(this._el, path, data, sounds);
        this._balloon = new _balloon2.default(this._el);
        this._setupEvents();
      };

      Agent.prototype = (_Agent$prototype = {

        // @param {Number} x
        // @param {Number} y
        gestureAt: function gestureAt(x, y) {
          var d = this._getDirection(x, y);
          var gAnim = 'Gesture' + d;
          var lookAnim = 'Look' + d;

          var animation = this.hasAnimation(gAnim) ? gAnim : lookAnim;
          return this.play(animation);
        },

        // @param {Boolean=} fast
        hide: function hide(fast, callback) {
          this._hidden = true;
          var el = this._el;
          this.stop();
          if (fast) {
            this._el.hide();
            this.stop();
            this.pause();
            if (callback) callback();
            return;
          }

          this._addToQueue(function (complete) {
            var animate = function animate(name, state) {
              if (state === clippy.Animator.States.EXITED) {
                el.hide();
                this.pause();
                if (callback) callback();
                complete();
              }
            };

            this._animator.showAnimation('Hide', animate(name, state).bind(this));
          }, this);
        },

        moveTo: function moveTo(x, y, duration) {
          var dir = this._getDirection(x, y);
          var anim = 'Move' + dir;
          if (duration === undefined) duration = 1000;

          this._addToQueue(function (complete) {
            // the simple case
            if (duration === 0) {
              this._el.css({ top: y, left: x });
              this.reposition();
              complete();
              return;
            }

            // no animations
            if (!this.hasAnimation(anim)) {
              this._el.animate({ top: y, left: x }, duration, complete);
              return;
            }

            var callback = function callback(name, state) {
              // when exited, complete
              if (state === clippy.Animator.States.EXITED) {
                complete();
              }
              // if waiting,
              if (state === clippy.Animator.States.WAITING) {
                var animate = function animate() {
                  // after we're done with the movement, do the exit animation
                  this._animator.exitAnimation();
                };
                this._el.animate({ top: y, left: x }, duration, animate.bind(this));
              }
            };

            this._animator.showAnimation(anim, callback.bind(this));
          }, this);
        },

        play: function play(animation, timeout, cb) {
          if (!this.hasAnimation(animation)) return false;

          if (timeout === undefined) timeout = 5000;

          this._addToQueue(function (complete) {
            var completed = false;
            // handle callback
            var callback = function callback(name, state) {
              if (state === clippy.Animator.States.EXITED) {
                completed = true;
                if (cb) cb();
                complete();
              }
            };

            // if has timeout, register a timeout function
            if (timeout) {
              var timeoutFunc = function timeoutFunc() {
                if (completed) return;
                // exit after timeout
                this._animator.exitAnimation();
              };

              window.setTimeout(timeoutFunc.bind(this), timeout);
            }

            this._animator.showAnimation(animation, callback);
          }, this);

          return true;
        },

        // @param {Boolean=} fast
        show: function show(fast) {
          this._hidden = false;
          if (fast) {
            this._el.show();
            this.resume();
            this._onQueueEmpty();
            return;
          }

          if (this._el.css('top') === 'auto' || !this._el.css('left') === 'auto') {
            var left = $(window).width() * 0.8;
            var top = ($(window).height() + $(document).scrollTop()) * 0.8;
            this._el.css({ top: top, left: left });
          }

          this.resume();
          return this.play('Show');
        },

        // @param {String} text
        speak: function speak(text, hold, callback) {
          this._addToQueue(function (complete) {
            this._balloon.speak(complete, text, hold, callback);
          }, this);
        },

        // @param {String} text
        ask: function ask(text, choices, callback) {
          this._addToQueue(function (complete) {
            this._balloon.ask(complete, text, choices, callback);
          }, this);
        },

        // Close the current balloon
        closeBalloon: function closeBalloon() {
          this._balloon.close();
        },

        // Pause the current balloon
        pause: function pause() {
          this._balloon.pause();
        },

        // Resume the current balloon
        resume: function resume() {
          this._balloon.resume();
        },

        // Delay the current balloon
        delay: function delay(time, callback) {
          time = time || 250;

          this._addToQueue(function (complete) {
            window.setTimeout(function () {
              complete();
              if (callback) {
                callback();
              }
            }, time);
          }, this);
        },

        // Skips the current animation
        stopCurrent: function stopCurrent() {
          this._animator.exitAnimation();
          this._balloon.close();
        },

        // Stops the current animation
        stop: function stop() {
          // clear the queue
          this._queue.clear();
          this._animator.exitAnimation();
          this._balloon.close();
        },

        /***
         *
         * @param {String} name
         * @returns {Boolean}
         */
        hasAnimation: function hasAnimation(name) {
          return this._animator.hasAnimation(name);
        },

        /***
         * Gets a list of animation names
         *
         * @return {Array.<string>}
         */
        animations: function animations() {
          return this._animator.animations();
        },

        /***
         * Play a random animation
         * @return {jQuery.Deferred}
         */
        animate: function animate() {
          var animations = this.animations();
          var anim = animations[Math.floor(Math.random() * animations.length)];
          // skip idle animations
          if (anim.indexOf('Idle') === 0 || anim == 'Show' || anim == 'Hide') {
            return this.animate();
          }
          return this.play(anim);
        },

        /**************************** Utils ************************************/

        /***
         *
         * @param {Number} x
         * @param {Number} y
         * @return {String}
         * @private
         */
        _getDirection: function _getDirection(x, y) {
          var offset = this._el.offset();
          var h = this._el.height();
          var w = this._el.width();

          var centerX = offset.left + w / 2;
          var centerY = offset.top + h / 2;

          var a = centerY - y;
          var b = centerX - x;

          var r = Math.round(180 * Math.atan2(a, b) / Math.PI);

          // Left and Right are for the character, not the screen :-/
          if (-45 <= r && r < 45) return 'Right';
          if (45 <= r && r < 135) return 'Up';
          if (135 <= r && r <= 180 || -180 <= r && r < -135) return 'Left';
          if (-135 <= r && r < -45) return 'Down';

          // sanity check
          return 'Top';
        },

        /**************************** Queue and Idle handling ************************************/

        /***
         * Handle empty queue.
         * We need to transition the animation to an idle state
         * @private
         */
        _onQueueEmpty: function _onQueueEmpty() {
          if (this._hidden || this._isIdleAnimation()) {
            return;
          }
          var idleAnim = this._getIdleAnimation();
          // TODO
          this._idleDfd = $.Deferred();

          this._animator.showAnimation(idleAnim, this._onIdleComplete.bind(this));
        },

        _onIdleComplete: function _onIdleComplete(name, state) {

          if (state === clippy.Animator.States.EXITED) {
            console.log('here');
            this._idleDfd.resolve();

            // Always play some idle animation.
            this._queue.next();
          }
        },

        /***
         * Is an Idle animation currently playing?
         * @return {Boolean}
         * @private
         */
        _isIdleAnimation: function _isIdleAnimation() {
          var c = this._animator.currentAnimationName;
          return c && c.indexOf('Idle') == 0 && this._idleDfd && this._idleDfd.state() === 'pending';
        },

        /**
         * Gets a random Idle animation
         * @return {String}
         * @private
         */
        _getIdleAnimation: function _getIdleAnimation() {
          var animations = this.animations();
          var r = [];
          for (var i = 0; i < animations.length; i++) {
            var a = animations[i];
            if (a.indexOf('Idle') === 0) {
              r.push(a);
            }
          }

          // pick one
          var idx = Math.floor(Math.random() * r.length);
          return r[idx];
        },

        /**************************** Events ************************************/

        _setupEvents: function _setupEvents() {
          $(window).on('resize', this.reposition.bind(this));
          this._el.on('mousedown', this._onMouseDown.bind(this));
          this._el.on('dblclick', this._onDoubleClick.bind(this));
        },

        _onDoubleClick: function _onDoubleClick() {
          if (!this.play('ClickedOn')) {
            this.animate();
          }
        },

        reposition: function reposition() {
          if (!this._el.is(':visible')) {
            return;
          }
          var o = this._el.offset();
          var bH = this._el.outerHeight();
          var bW = this._el.outerWidth();

          var wW = $(window).width();
          var wH = $(window).height();
          var sT = $(window).scrollTop();
          var sL = $(window).scrollLeft();

          var top = o.top - sT;
          var left = o.left - sL;
          var m = 5;
          if (top - m < 0) {
            top = m;
          } else if (top + bH + m > wH) {
            top = wH - bH - m;
          }

          if (left - m < 0) {
            left = m;
          } else if (left + bW + m > wW) {
            left = wW - bW - m;
          }

          this._el.css({ left: left, top: top });
          // reposition balloon
          this._balloon.reposition();
        },

        _onMouseDown: function _onMouseDown(e) {
          e.preventDefault();
          this._startDrag(e);
        },

        /**************************** Drag ************************************/

        _startDrag: function _startDrag(e) {
          // pause animations
          this.pause();
          this._balloon.hide();
          this._offset = this._calculateClickOffset(e);

          this._moveHandle = this._dragMove.bind(this);
          this._upHandle = this._finishDrag.bind(this);

          $(window).on('mousemove', this._moveHandle);
          $(window).on('mouseup', this._upHandle);

          this._dragUpdateLoop = window.setTimeout(this._updateLocation.bind(this), 10);
        },

        _calculateClickOffset: function _calculateClickOffset(e) {
          var mouseX = e.pageX;
          var mouseY = e.pageY;
          var o = this._el.offset();
          return {
            top: mouseY - o.top,
            left: mouseX - o.left
          };
        },

        _updateLocation: function _updateLocation() {
          this._el.css({ top: this._targetY, left: this._targetX });
          this._dragUpdateLoop = window.setTimeout(this._updateLocation.bind(this), 10);
        },

        _dragMove: function _dragMove(e) {
          e.preventDefault();
          var x = e.clientX - this._offset.left;
          var y = e.clientY - this._offset.top;
          this._targetX = x;
          this._targetY = y;
        },

        _finishDrag: function _finishDrag() {
          window.clearTimeout(this._dragUpdateLoop);
          // remove handles
          $(window).off('mousemove', this._moveHandle);
          $(window).off('mouseup', this._upHandle);
          // resume animations
          this._balloon.show();
          this.reposition();
          this.resume();
        },

        _addToQueue: function _addToQueue(func, scope) {
          if (scope) {
            func = func.bind(scope);
          }

          // if we're inside an idle animation,
          if (this._isIdleAnimation()) {
            var idleCallback = function idleCallback() {
              this._queue.queue(func);
            };
            this._idleDfd.done(idleCallback().bind(this));
            this._animator.exitAnimation();
            return;
          }

          this._queue.queue(func);
        }

      }, _defineProperty(_Agent$prototype, 'pause', function pause() {
        this._animator.pause();
        this._balloon.pause();
      }), _defineProperty(_Agent$prototype, 'resume', function resume() {
        this._animator.resume();
        this._balloon.resume();
      }), _Agent$prototype);

      exports.default = Agent;
    }
  };
});