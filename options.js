document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveButton').addEventListener('click', saveOptions);

function saveOptions() {
  const apiKey = document.getElementById('apiKeyInput').value;
  chrome.storage.sync.set({ apiKey: apiKey }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(() => {
      status.textContent = '';
    }, 1000);
  });
}

function restoreOptions() {
  chrome.storage.sync.get('apiKey', (items) => {
    if (items.apiKey) {
      document.getElementById('apiKeyInput').value = items.apiKey;
    }
  });
}