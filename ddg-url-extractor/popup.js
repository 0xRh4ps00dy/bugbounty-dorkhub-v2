// Popup script
document.addEventListener('DOMContentLoaded', function() {
    const statusDiv = document.getElementById('status');
    const statusIcon = statusDiv.querySelector('.status-icon');
    const statusText = statusDiv.querySelector('.status-text');
    const statsDiv = document.getElementById('stats');
    const urlCount = document.getElementById('url-count');
    const extractBtn = document.getElementById('extract-btn');
    
    // Check if we're on a supported search engine
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        const currentTab = tabs[0];
        
        if (!currentTab || !currentTab.url) {
            updateStatus('error', '❌', 'No se puede acceder a esta página');
            return;
        }
        
        const url = currentTab.url;
        const isGoogle = url.includes('google.') && url.includes('/search');
        const isDuckDuckGo = (url.includes('duckduckgo.com') || url.includes('duck.com')) && url.includes('q=');
        const hasQuery = url.includes('q=');
        const isSupportedSearch = (isGoogle && hasQuery) || isDuckDuckGo;
        
        if (isSupportedSearch) {
            updateStatus('success', '✅', isGoogle ? 'Google detectado' : 'DuckDuckGo detectado');
            statsDiv.classList.remove('hidden');
            extractBtn.classList.remove('hidden');
            
            // Get URL count from content script
            chrome.tabs.sendMessage(currentTab.id, {action: 'getURLCount'}, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('Error:', chrome.runtime.lastError.message);
                    urlCount.textContent = '?';
                    return;
                }
                
                if (response && response.count !== undefined) {
                    urlCount.textContent = response.count;
                    
                    if (response.count === 0) {
                        updateStatus('warning', '⚠️', 'No se encontraron URLs en esta página');
                    } else {
                        updateStatus('success', '✅', `¡${response.count} URLs encontradas!`);
                    }
                } else {
                    urlCount.textContent = '?';
                }
            });
        } else if (url.includes('google.') || url.includes('duckduckgo.com') || url.includes('duck.com')) {
            updateStatus('warning', '⚠️', 'Realiza una búsqueda (falta parámetro q)');
        } else {
            updateStatus('error', '❌', 'Abre Google o DuckDuckGo');
        }
    });
    
    // Extract button click handler
    extractBtn.addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'extractURLs'}, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('Error:', chrome.runtime.lastError.message);
                    return;
                }
                
                if (response && response.success) {
                    // Close popup after triggering extraction
                    window.close();
                }
            });
        });
    });
    
    function updateStatus(type, icon, text) {
        statusDiv.className = 'status ' + type;
        statusIcon.textContent = icon;
        statusText.textContent = text;
    }
});
