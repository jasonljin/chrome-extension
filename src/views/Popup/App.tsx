import React, { useEffect } from 'react'
import './App.css'

function App() {

  useEffect(() => {
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
  }, [])
  return (
    <div className="App">
      {/* <header className="App-header">
        <h3 className="text-center mt-3">BetterUp Lighthouse</h3>
      </header> */}
      <iframe width="300" height="500" 
        src="https://swordfish-next.vercel.app/embed" 
        frame-border="0" 
        style={{
          border: "none"
        }}></iframe>
    </div>
  );
}

export default App
