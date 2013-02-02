/*global chrome*/

var firstTime = true;

chrome.devtools.panels.create("Ember", "images/hamster.png", "panes/object-inspector.html", function(panel) {
  var panelWindow, queuedSend;

  panel.onShown.addListener(function(win) {
    panelWindow = win;

    if (firstTime) {
      firstTime = false;
      panelWindow.activate();

      panelWindow.calculate = function(property, mixinIndex) {
        port.postMessage({ objectId: objectId, property: property, mixinIndex: mixinIndex });
      };

      chrome.devtools.network.onNavigated.addListener(function() {
        panelWindow.resetDebugger();
      });
    }

    if (queuedSend) {
      panelWindow[queuedSend.name].apply(panelWindow, queuedSend.args);
    }
  });

  panel.onHidden.addListener(function() {
    panelWindow = null;
  });

  var port = chrome.extension.connect();
  port.postMessage({ appId: chrome.devtools.inspectedWindow.tabId });

  var objectId;

  port.onMessage.addListener(function(message) {
    var toSend;

    if (message.details) {
      toSend = { name: 'updateObject', args: [message] };
      objectId = message.objectId;
    } else if (message.property) {
      toSend = { name: 'updateProperty', args: [message] };
    }

    if (panelWindow) {
      panelWindow[toSend.name].apply(panelWindow, toSend.args);
    } else {
      queuedSend = toSend;
    }
  });

  injectDebugger();

  function injectDebugger() {
    var url = chrome.extension.getURL('panes/ember-debug.js');

    var xhr = new XMLHttpRequest();
    xhr.open("GET", chrome.extension.getURL('/panes/ember-debug.js'), false);
    xhr.send();

    chrome.devtools.inspectedWindow.eval(xhr.responseText);
  }
});

