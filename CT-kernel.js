/*!
 * CareTaker JavaScript Library v1.0.0
 * http://royweston.me.uk/web-development/caretaker-javascript-library/
 *
 * Copyright (c) 2009 Roy Weston
 * Licenced under the MIT licence.
 * http://royweston.me.uk/web-development/caretaker-javascript-library/licence
 *
 * Date: 2009-10-22
 */
if (!window.Node) {
  var Node = {
    ELEMENT_NODE               : 1,
    ATTRIBUTE_NODE             : 2,
    TEXT_NODE                  : 3,
    CDATA_SECTION_NODE         : 4,
    PROCESSING_INSTRUCTION_NODE: 7,
    COMMENT_NODE               : 8,
    DOCUMENT_NODE              : 9,
    DOCUMENT_TYPE_NODE         : 10,
    DOCUMENT_FRAGMENT_NODE     : 11  
  };
}

var elm = document.getElementById('ct.js-required-box');
if (elm) {elm.parentNode.removeChild(elm);}


if (!window['ct']) {window['ct'] = {}};

ct.ln = function(){
  if (document.attachEvent) {
    function delObjProp(obj, prop) {
      obj.prop = null;    
    }
  }
  else {
    function delObjProp(obj, prop) {
      delete obj.prop;
    }
  }
  
  function isArray(obj) {
    return '[object Array]' === Object.prototype.toString.call(obj);
  }
  
  return {
    delObjProp: delObjProp,
    isArray: isArray
  }
}();


ct.resource = function(){
  var thisDomain = document.location.protocol + '://' + document.location.host + '/';
  var thisDomainSSL = ('https' === document.location.protocol);

  var XHR = function(){
    var TIMEOUT = 3000;  //milli-seconds

    if (window.ActiveXObject) {
      function newRequest(){
        return new ActiveXObject("Microsoft.XMLHTTP");
      };
    }
    else {
      function newRequest(){
        return new XMLHttpRequest();
      };
    }

    function encodeData(data) {
      var pairs = [];
      var regExp = /%20/g;
      
      for (var name in data) {
        var value = data[name].toString();
        var pair =
          encodeURIComponent(name).replace(regExp, '+')
          + '='
          + encodeURIComponent(value).replace(regExp, '+');
        pairs.push(pair);
      }
      
      return pairs.join('&');
    };
      
    function request(url, callback, parameters) {
      if ('undefined' === typeof url || '' === url) return;
      if ('undefined' === typeof callback ) return;
      
      var req = newRequest();
      var timer = setTimeout(
        function() {
          req.abort();
          req.onreadystatechange = null;
          (ct.kernel.isDebug()) ? alert('Request aborted: '+ url) : null;
        }
      , TIMEOUT
      );
      
      req.onreadystatechange = function() {
        var responsePayload = null;
        if (4 == req.readyState) {
          if (timer) {clearTimeout(timer)};
          req.onreadystatechange = null;
          if (200 == req.status) {
            responsePayload = req.responseText;
            callback(responsePayload, req.status, req.statusText);
          }
        }
      }
      
      if ('undefined' !== typeof parameters) {url += '?'+encodeData(parameters);}
      req.open('GET', url, true);
    
      try {
        req.send(null);
      } catch (e) {
        return null;
      };
  
      return null;
    };
  
    return {
      request: request
    }
  }();

  var load = function(){
    var queuedResources = [];
    
    // Relaxes the same-origin policy domain to the least restrictive domain name:
    // ccTLDs - a.b.co.uk becomes b.co.uk
    //        - a.co.uk remains a.co.uk
    // TLDs - a.b.example.com becomes example.com
    //      - a.example.com becomes example.com
    // localhost - //localhost/ remains unchanged
    //           - a.local remains unchanged
    //           - a.b.local becomes b.local
    (function() {
      try {
        var cDomain = document.domain = document.domain.toLowerCase();
      } catch (e) {
        return;
      }
      
      try {
        // If the sameOriginDomain has been set to override the automated
        // relaxation of the the same-origin policy domain, then it should
        // be used.
        if ('' !== ct.bootCfg.getSameOriginDomain()) {
          document.domain = ct.bootCfg.getSameOriginDomain();
          return;
        }
        
        var idx = cDomain.lastIndexOf('.');
        if (-1 === idx) {
          return;
        } // nothing more to do
        var nDomain = cDomain;
        var gTLD = nDomain.substring(idx + 1);
        var ccTLD = (2 === gTLD.length);
        var localhost = ('localhost' === gTLD);
        var local = ('local' === gTLD);
        var re_validDomainName = '\\w+[-\\w]*[^-]';
        
        if (localhost) {
          return; // nothing more to do
        }
        else if (ccTLD) {
          re = new RegExp('(\\.|^)(' + re_validDomainName + ')\\.([a-z]{2,})\\.([a-z]{2})$');
        }
        else if (local) {
          re = new RegExp('(\\.|^)(' + re_validDomainName + ')\\.local$');
        }
        else if (gTLD) {
          re = new RegExp('(\\.|^)(' + re_validDomainName + ')\\.([a-z]{3,})$');
        }
        else {
          return;
        }
        
        var domainElms = cDomain.match(re);
        if (!domainElms) { return; }; // nothing more to do
        domainElms.splice(0, 2);
        if (local) { domainElms.push('local'); }
        nDomain = domainElms.join('.');
        document.domain = nDomain;
      } catch (e) {
        document.domain = cDomain;
      }
    })();
    
    function alreadyLoaded(type, url, groupId) {
      var i = queuedResources.length - 1;
      if ('undefined' === groupId) { groupId = 0; }
      while (i > -1) {
        var qResource = queuedResources[i];
        if (qResource.type === type && qResource.url === url) {
          // Add this group id to the resource as this group is dependent
          // upon this resource being loaded.
          if (!qResource.groupId) {
            qResource.groupId = [groupId];
          }
          else {
            var ctr = qResource.groupId.length -1;
            var groupIdFound = false;
            while (ctr > -1 && !groupIdFound) {
              groupIdFound = qResource.groupId[ctr] === groupId;
              ctr--;
            }
            if (!groupIdFound) { qResource.groupId.push(groupId); }
          }
          return true;
        }
        i--;
      }
      
      if ('css' === type) {
        // Search css link elements
        var links = document.getElementsByTagName('link');
        var i = links.length - 1;
        while (i > -1) {
          var link = links[i];
          if ('stylesheet' === link.rel && (link.url === url || link.href === url) ) { return true; }
          i--;
        }
      }
      else {
        // Search script elements
        var scripts = document.getElementsByTagName('script');
        var i = scripts.length - 1;
        while (i > -1) {
          var script = scripts[i];
          if (script.url === url || script.src === url) { 
            // Add script to queued resources so that any scripts that are
            // marked as having dependencies on this script will be run.
            var iQueue = queuedResources.length;
            var qResource = {
              type: type,
              loadMethod: 'none',
              url: url,
              response: 'Pre-loaded',
              onload: null,
              status: 'complete',
              groupId: [groupId]
            };
            queuedResources[iQueue] = qResource;
            return true;
          }
          i--;
        }
      }
      
      return false;
    };
    
    function manageDependencies(){
      var len = queuedResources.length;
      // GroupId 0's first resource is always 'loaded' (even if it's not).
      // This means we can use the same algorithm for grouped and non-grouped
      // resources.
      var firstGroupResourceLoaded = [true];
      // ignoreRestOfGroup is used to manage dependencies within a group. If
      // a resource has a dependency on earlier group resources that have yet
      // to be loaded, then the dependent resource cannot be loaded yet.
      var ignoreRestOfGroup = [];
      
      // Iterate through all the resources. Manage dependencies in grouped
      // resources.
      for (var i = 0; i < len; i++) {
        var qResource = queuedResources[i];
        
        // A resource that is used in more than one group _must_ initially
        // be loaded outside of the groups, i.e. as group 0, so check group
        // 0. If it's only used in one group, then check that group. 
        var useGroupId = (1 === qResource.groupId.length) ? qResource.groupId[0] : 0;
        
        // If the first resource of this group has not been loaded, there's no
        // sense in further processing this group as all the other resources in
        // this group are inherently dependent upon it.
        // If the first resource of this group has been loaded, then check if
        // this resource dependent upon other resources of this group having
        // been loaded. If it is and the other resources have been loaded, then
        // further process this resource, otherwise skip it. 
        if (   !firstGroupResourceLoaded[useGroupId] 
            || (   firstGroupResourceLoaded[qResource.groupId]
                && ignoreRestOfGroup[useGroupId]
                && qResource.dependencies
               )
            ) { continue; }

        var resourceComplete = ('complete' === qResource.status);

        // Determine if this is the first resource of a group, and if it is
        // and it is 'complete' then mark this group's initial dependency
        // as being fulfilled.
        var ignoreGroup = false;
        var belongsToGroupIdZero = false;
        for (var gIdx = qResource.groupId.length - 1; gIdx > -1; gIdx--) {
          var groupId = qResource.groupId[gIdx];
          if (0 === groupId) {belongsToGroupIdZero = true;}
          if (!firstGroupResourceLoaded[groupId] && resourceComplete) { 
            firstGroupResourceLoaded[groupId] = true;
          } 
          if (!firstGroupResourceLoaded[groupId] || 'loading' === qResource.status) { 
            ignoreGroup = ignoreRestOfGroup[groupId] = true;
          } 
        }
        // A group must always have a dependency on a resource from the
        // default groupId 0. Therefore if the groupId array length is
        // greater than 1, this resource is dependent upon an item from
        // groupId 0 and must not be ignored.
        if (ignoreGroup && !belongsToGroupIdZero) { continue; }
        
        if (!resourceComplete) {
          if (!qResource.response) {
            // Need to wait for the request response to have completed
            // before processing this resource further.
            continue;
          }
          else {
            // The only domElm items in this queue should be scripts that are sourced from
            // a none same-origin domain and have dependencies on prior resources.
            // Therefore the only domElm items should be ones queued to be downloaded. These
            // none same-origin domain scripts with dependencies are downloaded consecutively.
            // domElm items fire their own onload functions as soon as they are downloaded. 
            if ('domElm' === qResource.loadMethod && 'pending' === qResource.status) {
              domElement(qResource.type, qResource.url, qResource.onload, false, null, i);              
              // Waiting for a response.
              continue;
            }
            else if ('xhr' === qResource.loadMethod) {
              if ('css' === qResource.type) {
                var le = document.createElement('link');
                le.rel = 'stylesheet';
                le.type = 'text/css';
                le.url = qResource.url;
                document.getElementsByTagName('head')[0].appendChild(le);
                le.text = qResource.response;
              }
              else {
                var se = document.createElement('script');
                se.type = 'text/javascript';
                se.url = qResource.url;
                document.getElementsByTagName('head')[0].appendChild(se);
                se.text = qResource.response;
              }
              if (qResource.onload) {
                xhrInjectionOnload(qResource);
              }
              else {
                qResource.status = 'complete';
              }
            }
          }
        }
      }
    };
    
    function xhrInjectionOnload(rs){
      setTimeout(function() {
          rs.onload();
          rs.status = 'complete';
          manageDependencies();
        }
      , 0
      );
    };
    
    function domElement(type, url, onload, dependencies, groupId, onQueueIdx) {
      if ('css' === type) {
        dependencies = true;
      }

      if (!onQueueIdx) {
        var iQueue = queuedResources.length;
        var qResource = {
          type: type,
          loadMethod: 'domElm',
          url: url,
          response: null,
          onload: onload,
          dependencies: dependencies,
          status: 'loading',
          groupId: [groupId]
        };
        queuedResources[iQueue] = qResource;
        if (dependencies || 0 !== groupId) {
          queuedResources[iQueue].response = 'DOM Element queued'; 
          queuedResources[iQueue].status = 'pending'; 
          return;
        }
      }
      else {
        var qResource = queuedResources[onQueueIdx];
        qResource.response = null;
        qResource.status = 'loading';
        queuedResources[onQueueIdx] = qResource;
        var iQueue = onQueueIdx;
      }      
      
      if ('css' === type) {
        var elm = document.createElement('link');
        elm.rel = 'stylesheet';
        elm.type = 'text/css';
        elm.href = url;
      }
      else {
        var elm = document.createElement('script');
        elm.type = 'text/javascript';
        elm.src = url;
      }

      elm.url = url;
      elm.onloadDone = false;
      elm.onload = function(){
        elm.onloadDone = true;
        queuedResources[iQueue].response = 'DOM Element loaded';
        if (onload) {onload();}
        queuedResources[iQueue].status = 'complete';
        manageDependencies();
      };
      elm.onreadystatechange = function(){
        if ((('loaded' === elm.readyState) || ('complete' === elm.readyState)) && !elm.onloadDone) {
          elm.onreadystatechange = null;
          elm.onloadDone = true;
          elm.onload();
        }
      };

      document.getElementsByTagName('head')[0].appendChild(elm);
    };
    
    function xhrInjection(type, url, onload, dependencies, groupId){
      if ('css' === type) {
        dependencies = true;
      }
      var iQueue = queuedResources.length;
      var qResource = {
        type: type,
        loadMethod: 'xhr',
        url: url,
        response: null,
        onload: onload,
        dependencies: dependencies,
        status: 'loading',
        groupId: [groupId]
      };
      queuedResources[iQueue] = qResource;
      
      if (dependencies) {
        var callback = function(responseText, requestStatus, requestStatusText){
          if (200 == requestStatus) {
            queuedResources[iQueue].response = responseText;
            setTimeout(
              function(){
                manageDependencies();
              }, 0
            );
          }
        };
      }
      else {
        var callback = function(responseText, requestStatus, requestStatusText){
          if (200 == requestStatus) {
            var se = document.createElement('script');
            document.getElementsByTagName('head')[0].appendChild(se);
            se.url = url;
            se.text = responseText;
            if (qResource.onload) {
              setTimeout(
                function(){
                  qResource.onload();
                  queuedResources[iQueue].status = 'complete';
                  manageDependencies();
                }, 0
              );
            }
            else {
              queuedResources[iQueue].status = 'complete';
              manageDependencies();
            }
          }
        };
      };
      
      XHR.request(url, callback);
      return null;
    };
    
    function multiple(type, aResources){
      var nResources = aResources.length;
      var nextGroupId = 1;
      var groupIds = {'$$CT$$DefaultGroup$$': 0};

      // All CSS resources are marked as having dependencies as the order in which they
      // are downloaded affects the CSS rules value ordering.
      for (var i = 0; i < nResources; i++) {
        var rs = aResources[i];
        var iResourceGroup = 0;
        if (rs.group) { 
          if (!groupIds[rs.group]) {
            iResourceGroup = nextGroupId++;
            groupIds[rs.group] = iResourceGroup;
          }
          else {
            iResourceGroup = groupIds[rs.group];
          }
        }
        
        if (alreadyLoaded(type, rs.url, iResourceGroup)) { continue; }
        
        // Resources not complying to the same-origin policy domain must
        // be loaded via dom script elements. Otherwise use XHR. Using
        // XHR has the advantage that they can be downloaded in parallel
        // even where there are prior dependencies that need to be meet.
        // This cannot be done with dom script elements in some browsers
        // as the code is evaluated as soon as it downloaded even before
        // any earlier scripts have been evaluated causing potential race
        // conditions.
        var loadFn = domElement;
        if (sameOrigin(rs.url)) {
          loadFn = xhrInjection;
        }
        var hasDependencies = ('css' === type) ? true : rs.dependencies;
        if (0 === i) {hasDependencies = false;}
        loadFn(type, rs.url, rs.onload, hasDependencies, iResourceGroup);
      }
    };

    return {
      multiple: multiple
    }
  }();

  function sameOrigin(url) {
    var domainElms = url.toLowerCase().match(/^(https?):\/\/([-\w\.]+):?(\d{0,5})\//);
    if (!domainElms) { return true; }
    var http = ('http' === domainElms[1]);
    var https = ('https' === domainElms[1]);

    if (!http && !https) {
      return true;
    }
    else if ( ( http && thisDomainSSL ) || 
              ( https && !thisDomainSSL ) ||
              ( document.location.port != domainElms[3] )
            ) {
      return false;
    }
    else {
      return ( -1 !== domainElms[2].lastIndexOf(document.domain) );
    }
    
    return true;
  };

  function loadType(type, url, onload) {
    if (ct.ln.isArray(url)) {
      load.multiple(type, url);
    }
    else {
      load.multiple(type, [{url: url, onload: onload}]);
    };
  };

  function loadJS(url, onload, hasDependencies, groupName) {
    loadType('js', url, onload);
  };

  function loadCSS(url, onload) {
    loadType('css', url, onload);
  };

  // return public pointers to the private methods and 
  // properties you want to reveal
  return {
    loadJS: loadJS,
    loadCSS: loadCSS
  }
}();

if (ct.bootConfig && (0 !== ct.bootConfig.cssResources().length)){
  ct.resource.loadCSS(ct.bootConfig.cssResources());
};
    
if (ct.bootConfig && (0 !== ct.bootConfig.jsResources().length)){
  ct.resource.loadJS(ct.bootConfig.jsResources());
};
    
