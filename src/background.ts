// @ts-nocheck

chrome.runtime.onInstalled.addListener(handleInstalled);

function handleInstalled(details) {
  if (details.reason === 'install') {
    chrome.storage.sync.set({ isEnabled: true });
  }
}

chrome.runtime.onMessage.addListener(handleMessage);

function handleMessage(request, sender, sendResponse) {
  if (request === 'openOptionsPage') {
    chrome.runtime.openOptionsPage();
    return true;
  }
  if (request.type === 'toggleExtension') {
    chrome.storage.sync.get('isEnabled', (data) => {
      const isEnabled = !data.isEnabled;
      chrome.storage.sync.set({ isEnabled }, () => {
        sendResponse({ isEnabled });
      });
    });
    return true;
  }
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.open) {
    return new Promise(resolve => {
      chrome.action.getPopup({}, (popup) => {
        return resolve(popup)
      })
    })
  }
})

export {}
