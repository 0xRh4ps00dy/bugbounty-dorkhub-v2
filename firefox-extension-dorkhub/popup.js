// Popup script
document.addEventListener('DOMContentLoaded', function() {
    const stats = document.getElementById('stats');
    
    // Check if we're on the dorkhub page
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        if (currentTab && currentTab.url) {
            if (currentTab.url.includes('bugbounty-dorkhub') || currentTab.url.includes('index.html')) {
                stats.innerHTML = '<p style="color: #4caf50;">✓ Dorkhub detected on this page</p>';
            } else {
                stats.innerHTML = '<p style="color: #ff6b6b;">⚠ Please open the BugBounty Dorkhub page first</p>';
            }
        }
    });
});
