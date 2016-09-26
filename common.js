var Backgroundit = window.Backgroundit || {};

Backgroundit.query_current_tab = function(params, response) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, params, response);
  });
}