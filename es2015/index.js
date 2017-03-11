'use strict';

SystemJS.register([], function (_export, _context) {
  "use strict";

  var _load, _load2;

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  return {
    setters: [],
    execute: function () {
      _load = require('./load.js');
      _load2 = _interopRequireDefault(_load);


      (0, _load2.default)('Clippy', function (agent) {
        agent.show();
        agent.animate();
        agent.speak('When all else fails, bind some paper together. My name is Clippy.');
      });
    }
  };
});