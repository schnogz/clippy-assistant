import clippyLoad from './load.js';

clippyLoad('Clippy', function(agent){
  agent.show();
  agent.animate();
  agent.speak('When all else fails, bind some paper together. My name is Clippy.');
});