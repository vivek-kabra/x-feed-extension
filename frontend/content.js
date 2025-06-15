console.log("X Feed Simulator: content.js loaded and waiting for data...");

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "displayFeed") {
        console.log("X Feed Simulator: content.js received data via message:", request.data);
    }
    
});