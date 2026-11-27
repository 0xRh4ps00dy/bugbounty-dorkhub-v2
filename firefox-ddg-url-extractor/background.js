// Background script - Handles keyboard shortcuts and URL opening
console.log('🔍 Search URL Extractor - Background Script Loaded');

// Listen for keyboard commands
browser.commands.onCommand.addListener((command) => {
    console.log('Command received:', command);
    
    if (command === 'extract-urls') {
        // Get the active tab
        browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                const tab = tabs[0];
                
                // Check if we're on a supported search page
                const isGoogle = tab.url && tab.url.includes('google.') && tab.url.includes('/search') && tab.url.includes('q=');
                const isDuckDuckGo = tab.url && (tab.url.includes('duckduckgo.com') || tab.url.includes('duck.com')) && tab.url.includes('q=');

                if (isGoogle || isDuckDuckGo) {
                    // Send message to content script to extract URLs
                    browser.tabs.sendMessage(tab.id, { action: 'extractURLs' }, (response) => {
                        if (browser.runtime.lastError) {
                            console.error('Error:', browser.runtime.lastError.message);
                        } else {
                            console.log('URLs extraction triggered successfully');
                        }
                    });
                } else {
                    console.log('Not on a supported search page');
                }
            }
        });
    }
});

// Listen for messages from content script to open URLs
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openURL') {
        const url = request.url;
        
        // Validate URL
        if (!url || !url.startsWith('http')) {
            console.warn('Invalid URL:', url);
            sendResponse({ success: false, error: 'Invalid URL' });
            return;
        }
        
        // Open URL in a new tab
        browser.tabs.create({
            url: url,
            active: false  // Open in background to avoid disrupting user
        }, (tab) => {
            if (browser.runtime.lastError) {
                console.error('Error opening URL:', browser.runtime.lastError.message);
                sendResponse({ success: false, error: browser.runtime.lastError.message });
            } else {
                console.log('URL opened in new tab:', url);
                sendResponse({ success: true });
            }
        });
    }
    
    return true;  // Keep the message channel open for async response
});
