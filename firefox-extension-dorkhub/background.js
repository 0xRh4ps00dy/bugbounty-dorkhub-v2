// Background script for handling tab creation
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openTabs') {
        const urls = request.urls || [];
        
        // Open each URL in a new tab with a small delay
        urls.forEach((url, index) => {
            setTimeout(() => {
                browser.tabs.create({ url: url, active: false });
            }, index * 100); // 100ms delay between each tab
        });
        
        sendResponse({ success: true, count: urls.length });
    }
    return true; // Keep message channel open for async response
});
