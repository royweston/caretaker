/*!!
 * CareTaker JavaScript Library v1.0.0
 * http://royweston.me.uk/web-development/caretaker-javascript-library/
 *
 * Copyright (c) 2009 Roy Weston
 * Licenced under the MIT licence.
 * http://royweston.me.uk/web-development/caretaker-javascript-library/licence
 *
 * Date: 2009-10-22
 */
var ct = function(){
  var userCfg = {};
  var kernelPath = '';
  var kernelId = '';
  var debugMode = false;
  var rsJs = [];
  var rsCss = [];
  var soDomain;

  var bootCfg = function(){
    function reqJs(){
      return rsJs;
    }

    function reqCss(){
      return rsCss;
    }

    function getDmn(){
      return soDomain;
    }

    return {
      jsResources: reqJs,
      cssResources: reqCss,
      getSameOriginDomain: getDmn
    }
  }();

  function boot(){
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = kernelPath + 'CT-kernel' +
      (!debugMode ? '-min' : '') + kernelId + '.js';
    document.getElementsByTagName('head')[0].appendChild(script);
  }

  var resource = function(){
    function loadJS(rs, onload, hasDependencies, groupName){
      rsJs[rsJs.length] = {url: rs, onload: onload, dependencies: hasDependencies, group: groupName};
    }

    function loadCSS(rs, onload){
      rsCss[rsCss.length] = {url: rs, onload: onload};
    }

    function setDmn(domain) {
      bootCfg.soDomain = domain;
    }

    return {
      loadJS: loadJS,
      loadCSS: loadCSS,
      setSameOriginDomain: setDmn
    }
  }();

  var kernel = function(){
    function path(path){
      kernelPath = path;
    }

    function versionId(id){
      kernelId = id;
    }

    function debug(){
      debugMode = true;
    }

    function isDebug(){
      return debugMode;
    }
    
    return {
      setPath: path,
      setVersionId: versionId,
      debug: debug,
      isDebug: isDebug
    }
  }();

  return {
    config: userCfg,
    bootConfig: bootCfg,
    boot: boot,
    resource: resource,
    kernel: kernel
  }
}();
       
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

