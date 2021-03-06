'use strict';

SystemJS.register([], function (_export, _context) {
  "use strict";

  var Animator;
  return {
    setters: [],
    execute: function () {
      Object.defineProperty(exports, "__esModule", {
        value: true
      });

      Animator = function Animator(el, path, data, sounds, options) {
        this._el = el;
        this._data = data;
        this._path = path;
        this._currentFrameIndex = 0;
        this._currentFrame = undefined;
        this._exiting = false;
        this._currentAnimation = undefined;
        this._endCallback = undefined;
        this._started = false;
        this._sounds = {};
        this.currentAnimationName = undefined;
        this.preloadSounds(sounds);
        this._overlays = [this._el];
        options = options || { silent: true };
        this.silent = options.silent;
        var curr = this._el;

        this._setupElement(this._el);
        for (var i = 1; i < this._data.overlayCount; i++) {
          var inner = this._setupElement(document.createElement('div'));
          curr.appendChild(inner);
          this._overlays.push(inner);
          curr = inner;
        }
      };

      Animator.prototype = {
        _setupElement: function _setupElement(el) {
          var frameSize = this._data.framesize;
          el[0].style.display = 'none';
          el[0].style.width = frameSize[0] + 'px';
          el[0].style.height = frameSize[1] + 'px';
          el[0].style.backgroundImage = 'url("' + this._path + '/map.png")';
          el[0].style.backgroundRepeat = 'no-repeat';

          return el;
        },

        animations: function animations() {
          var r = [];
          var d = this._data.animations;
          for (var n in d) {
            r.push(n);
          }
          return r;
        },

        preloadSounds: function preloadSounds(sounds) {

          for (var i = 0; i < this._data.sounds.length; i++) {
            var snd = this._data.sounds[i];
            var uri = sounds[snd];
            if (!uri) continue;
            this._sounds[snd] = new Audio(uri);
          }
        },
        hasAnimation: function hasAnimation(name) {
          return !!this._data.animations[name];
        },

        exitAnimation: function exitAnimation() {
          this._exiting = true;
        },

        showAnimation: function showAnimation(animationName, stateChangeCallback) {
          this._exiting = false;

          if (!this.hasAnimation(animationName)) {
            return false;
          }

          this._currentAnimation = this._data.animations[animationName];
          this.currentAnimationName = animationName;

          if (!this._started) {
            this._step();
            this._started = true;
          }

          this._currentFrameIndex = 0;
          this._currentFrame = undefined;
          this._endCallback = stateChangeCallback;

          return true;
        },

        _draw: function _draw() {
          var images = [];
          if (this._currentFrame) images = this._currentFrame.images || [];

          for (var i = 0; i < this._overlays.length; i++) {
            if (i < images.length) {
              var xy = images[i];
              var bg = -xy[0] + 'px ' + -xy[1] + 'px';
              this._overlays[i][0].style.backgroundPosition = bg;
              this._overlays[i][0].style.display = 'block';
            } else {
              this._overlays[i][0].style.display = 'none';
            }
          }
        },

        _getNextAnimationFrame: function _getNextAnimationFrame() {
          if (!this._currentAnimation) return undefined;
          // No current frame. start animation.
          if (!this._currentFrame) return 0;
          var currentFrame = this._currentFrame;
          var branching = this._currentFrame.branching;

          if (this._exiting && currentFrame.exitBranch !== undefined) {
            return currentFrame.exitBranch;
          } else if (branching) {
            var rnd = Math.random() * 100;
            for (var i = 0; i < branching.branches.length; i++) {
              var branch = branching.branches[i];
              if (rnd <= branch.weight) {
                return branch.frameIndex;
              }

              rnd -= branch.weight;
            }
          }

          return this._currentFrameIndex + 1;
        },

        _playSound: function _playSound() {
          var s = this._currentFrame.sound;
          if (!s) return;
          var audio = this._sounds[s];
          if (!this.silent && audio) audio.play();
        },

        _atLastFrame: function _atLastFrame() {
          return this._currentFrameIndex >= this._currentAnimation.frames.length - 1;
        },

        _step: function _step() {
          if (!this._currentAnimation) return;
          var newFrameIndex = Math.min(this._getNextAnimationFrame(), this._currentAnimation.frames.length - 1);
          var frameChanged = !this._currentFrame || this._currentFrameIndex !== newFrameIndex;
          this._currentFrameIndex = newFrameIndex;

          // always switch frame data, unless we're at the last frame of an animation with a useExitBranching flag.
          if (!(this._atLastFrame() && this._currentAnimation.useExitBranching)) {
            this._currentFrame = this._currentAnimation.frames[this._currentFrameIndex];
          }

          this._draw();
          this._playSound();

          this._loop = window.setTimeout(this._step.bind(this), this._currentFrame.duration);

          // fire events if the frames changed and we reached an end
          if (this._endCallback && frameChanged && this._atLastFrame()) {
            if (this._currentAnimation.useExitBranching && !this._exiting) {
              this._endCallback(this.currentAnimationName, clippy.Animator.States.WAITING);
            } else {
              this._endCallback(this.currentAnimationName, clippy.Animator.States.EXITED);
            }
          }
        },

        /***
         * Pause animation execution
         */
        pause: function pause() {
          window.clearTimeout(this._loop);
        },

        /***
         * Resume animation
         */
        resume: function resume() {
          this._step();
        }
      };

      Animator.States = {
        WAITING: 1,
        EXITED: 0
      };

      exports.default = Animator;
    }
  };
});