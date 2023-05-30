chrome.runtime.onInstalled.addListener(handleInstalled);

function handleInstalled(details) {
  if (details.reason === 'install') {
    chrome.storage.sync.set({ isEnabled: true });
  }
}

chrome.runtime.onMessage.addListener(handleMessage);

function handleMessage(request, sender, sendResponse) {
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