const toggleButton = document.getElementById('toggleCensoring');

toggleButton.addEventListener('click', () => {
    chrome.storage.sync.get('censoringEnabled', async (data) => {
        const newValue = !data.censoringEnabled;
        await chrome.storage.sync.set({ censoringEnabled: newValue });
        toggleButton.textContent = newValue ? 'On' : 'Off';
        for (const tab of await chrome.tabs.query({})) {
            if (!tab.url || !(tab.url.startsWith("http://") || tab.url.startsWith("https://"))) continue;
            if (tab.id){
                try {
                    await chrome.tabs.sendMessage(tab.id, { action: 'updateCensoring', enabled: newValue });
                }catch{
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['content/content.js']
                    });
                    try {
                        await chrome.tabs.sendMessage(tab.id, { action: 'updateCensoring', enabled: newValue });
                    }catch{}
                }
            }
        }
    });
});

chrome.storage.sync.get('censoringEnabled', (data) => {
    if (data.censoringEnabled) {
        toggleButton.textContent = 'On';
    } else {
        toggleButton.textContent = 'Off';
    }
});