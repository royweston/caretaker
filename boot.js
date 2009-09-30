/*!!
 * CareTaker JavaScript Library v1.0.0
 * http://royweston.me.uk/web-development/caretaker-javascript-library/
 *
 * Copyright (c) 2009 Roy Weston
 * Licenced under the MIT licence.
 * http://royweston.me.uk/web-development/caretaker-javascript-library/licence
 *
 * Date: 2009-09-30
 */
var ct = {
  config: {},

  boot: function(){
    if (!ct.config.kernel_id){ct.config.kernel_id = ''};
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src =
      (!ct.config.kernel_path ? '' : ct.config.kernel_path)+
      'CT-kernel'+
      (!ct.config.kernel_debug ? '-min' : '')+
      (!ct.config.kernel_id ? '' : ct.config.kernel_id)+
      '.js';
    document.getElementsByTagName('head')[0].appendChild(script);
  },

  resource: {
    loadJS: function(rs, onload, hasDependencies, groupName){
      if (!ct.config) {ct.config = {}};
      if (!ct.config.jsResources){ct.config.jsResources = []};
      ct.config.jsResources.push({url: rs, onload: onload, dependencies: hasDependencies, group: groupName});
    },
    
    loadCSS: function(rs, onload){
      if (!ct.config) {ct.config = {}};
      if (!ct.config.cssResources){ct.config.cssResources = []};
      ct.config.cssResources.push({url: rs, onload: onload});
    },

    setSameOriginDomain: function(domain) {
      if (!ct.config) {ct.config = {}};
      ct.config.sameOriginDomain = domain;
    }
  },
  
  kernel: {
    setPath: function(path){
      if (!ct.config) {ct.config = {}};
      ct.config.kernel_path = path;
    },
    
    setVersionId: function(id){
      if (!ct.config) {ct.config = {}};
      ct.config.kernel_id = id;
    },
    
    debug: function(){
      if (!ct.config) {ct.config = {}};
      ct.config.kernel_debug = true;
    }
  }

};
       
//
// DOMContentLoaded used instead of window.onload event
// to speed up initialisation.
//
// Modified from -
// Dean Edwards/Matthias Miller/John Resig
(function() {
  /* for Mozilla/Opera9 */
  if (document.addEventListener) {
    document.addEventListener("DOMContentLoaded", ct.boot, false);
    return;
  }
  var userAgent = navigator.userAgent.toLowerCase();
  /* for Internet Explorer */
  if (/msie/.test(userAgent) && window == top) {
    var sub = function(){
      try {
        // If IE is used, use the trick by Diego Perini
        // http://javascript.nwbox.com/IEContentLoaded/
        // And modified to remove arguments.callee dependency.
        document.documentElement.doScroll("left");
      } 
      catch (error) {
        setTimeout(sub, 0);
        return;
      }
      ct.boot();
    };
    sub();
    return;
  }
  /* for Safari */
  if (/webkit/i.test(userAgent)) { // sniff
    var _timer = setInterval(function() {
        if (/loaded|complete/.test(document.readyState)) {
          // If either one are found, remove the timer
          clearInterval(_timer);
          _timer = null;
          ct.boot(); // call the onload handler
        }
      }, 10);
    return;
  }
  
  /* for other browsers */
  window.onload = ct.boot;
  return;
})();

