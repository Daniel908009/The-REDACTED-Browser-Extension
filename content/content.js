chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateCensoring"){
        console.log("Censoring status updated to:", message.enabled);
    }
});