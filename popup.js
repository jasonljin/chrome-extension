document.addEventListener('DOMContentLoaded', () => {
  const enableExtension = document.getElementById('enableExtension');
  const disableExtension = document.getElementById('disableExtension');

  enableExtension.addEventListener('click', () => {
    chrome.storage.sync.set({ isEnabled: true }, () => {
      alert("Enabled!");
      console.log('Extension enabled');
    });
  });

  disableExtension.addEventListener('click', () => {
    chrome.storage.sync.set({ isEnabled: false }, () => {
      console.log('Extension disabled');
    });
  });

  chrome.storage.sync.get('isEnabled', (data) => {
    if (data.isEnabled) {
      enableExtension.classList.add('active');
    } else {
      disableExtension.classList.add('active');
    }
  });
});