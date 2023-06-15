import React, { useEffect } from 'react'
import './App.css'

function App() {

function saveOptions() {
  const apiKey = (document.getElementById('apiKeyInput') as HTMLInputElement).value;
  chrome.storage.sync.set({ apiKey: apiKey }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Options saved. Please reload the page Lighthouse is active on.';
    setTimeout(() => {
      status.textContent = '';
    }, 1000);
  });
  }
  function restoreOptions() {
  chrome.storage.sync.get('apiKey', (items) => {
    if (items.apiKey) {
      (document.getElementById('apiKeyInput') as HTMLInputElement).value = items.apiKey;
    }
  });
}
  useEffect(() => {
    restoreOptions();
  }, [])
  return (
    <div className="App">
      <header className="App-header">
        <div className="container">
        <h1>Communication Coach for Slack - Options</h1>
        <form>
            <div className="form-group">
                <label htmlFor="apiKeyInput">GPT-4 API Key:</label>
                <input type="text" className="form-control" id="apiKeyInput" placeholder="Enter your GPT-4 API Key">
                </input>
            </div>
            <button type="button" className="btn btn-primary" id="saveButton" onClick={saveOptions}>Save</button>
        </form>
        </div>
      </header>
    </div>
  );
}

export default App
