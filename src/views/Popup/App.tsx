// @ts-nocheck
import React, { useEffect } from 'react'
import './App.css'

function App() {

  function setupHotReload() {
    // hot-reload functionality https://github.com/xpl/crx-hotreload
      const filesInDirectory = dir => new Promise (resolve =>
          dir.createReader ().readEntries (entries =>
              Promise.all (entries.filter (e => e.name[0] !== '.').map (e =>
                  e.isDirectory
                      ? filesInDirectory (e)
                      : new Promise (resolve => e.file (resolve))
              ))
              .then (files => [].concat (...files))
              .then (resolve)
          )
      )

      const timestampForFilesInDirectory = dir =>
              filesInDirectory (dir).then (files =>
                  files.map (f => f.name + f.lastModifiedDate).join ())

      const watchChanges = (dir, lastTimestamp) => {
          timestampForFilesInDirectory (dir).then (timestamp => {
              if (!lastTimestamp || (lastTimestamp === timestamp)) {
                  setTimeout (() => watchChanges (dir, timestamp), 1000) // retry after 1s
              } else {
                  chrome.runtime.reload ()
              }
          })
      }

      chrome.management.getSelf (self => {
          if (self.installType === 'development') {
              chrome.runtime.getPackageDirectoryEntry (dir => watchChanges (dir))
              chrome.tabs.query ({ active: true, lastFocusedWindow: true }, tabs => { // NB: see https://github.com/xpl/crx-hotreload/issues/5
                  if (tabs[0]) {
                      chrome.tabs.reload (tabs[0].id)
                  }
              })
          }
      })

  }

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
    setupHotReload();
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
