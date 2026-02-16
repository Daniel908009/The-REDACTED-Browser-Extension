const toggleButton = document.getElementById('toggleCensoring');

toggleButton.addEventListener('click', () => {
    chrome.storage.sync.get('censoringEnabled', async (data) => {
        const newValue = !data.censoringEnabled;
        await chrome.storage.sync.set({ censoringEnabled: newValue });
        toggleButton.textContent = newValue ? 'Censoring is On' : 'Censoring is Off';
        toggleButton.style.backgroundColor = newValue ? 'green' : 'red';
        for (const tab of await chrome.tabs.query({})) {
            if (!tab.url || !(tab.url.startsWith("http://") || tab.url.startsWith("https://"))) continue;
            if (tab.id){
                try {
                    await chrome.tabs.sendMessage(tab.id, { action: 'updateCensoring' });
                }catch{
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content/content.js']
                    });
                    await new Promise(resolve => setTimeout(resolve, 100));
                    try {
                        await chrome.tabs.sendMessage(tab.id, { action: 'updateCensoring' });
                    }catch{}
                }
            }
        }
    });
});

chrome.storage.sync.get('censoringEnabled', (data) => {
    if (data.censoringEnabled) {
        toggleButton.textContent = 'Censoring is On';
        toggleButton.style.backgroundColor = 'green';
    } else {
        toggleButton.textContent = 'Censoring is Off';
        toggleButton.style.backgroundColor = 'red';
    }
});