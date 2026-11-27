// Content script - Runs on the BugBounty Dorkhub page
console.log('BugBounty Dorkhub Helper Extension loaded');

// Add "Open Category" buttons to each category
function addOpenCategoryButtons() {
    const categories = document.querySelectorAll('details');
    
    categories.forEach(category => {
        const summary = category.querySelector('summary');
        if (!summary) return;
        
        // Check if button already exists
        if (summary.querySelector('.extension-open-all')) return;
        
        // Create the button
        const button = document.createElement('button');
        button.className = 'extension-open-all';
        button.textContent = 'OPEN CATEGORY';
        button.style.cssText = `
            background: linear-gradient(135deg, #4caf50, #45a049);
            border: 1px solid #66bb6a;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(76, 175, 80, 0.3);
        `;
        
        // Hover effect
        button.addEventListener('mouseenter', () => {
            button.style.background = 'linear-gradient(135deg, #45a049, #4caf50)';
            button.style.transform = 'translateY(-2px)';
            button.style.boxShadow = '0 4px 16px rgba(76, 175, 80, 0.5)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'linear-gradient(135deg, #4caf50, #45a049)';
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = '0 2px 10px rgba(76, 175, 80, 0.3)';
        });
        
        // Click handler
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openAllInCategory(category);
        });
        
        // Insert button in the summary-buttons container
        const buttonsContainer = summary.querySelector('.summary-buttons');
        if (buttonsContainer) {
            // Insert before the reset button
            const resetButton = buttonsContainer.querySelector('.reset-category');
            if (resetButton) {
                buttonsContainer.insertBefore(button, resetButton);
            } else {
                buttonsContainer.appendChild(button);
            }
        } else {
            // Fallback: try to find reset button and insert before it
            const resetButton = summary.querySelector('.reset-category');
            if (resetButton && resetButton.parentNode === summary) {
                // Only insertBefore if resetButton is a direct child of summary
                summary.insertBefore(button, resetButton);
            } else {
                // Otherwise just append to the end of summary
                summary.appendChild(button);
            }
        }
    });
}

// Save progress to the page's localStorage
function saveProgressToStorage(domain, progressKey) {
    if (!domain || !progressKey) return;

    const key = 'bugbounty_progress_' + domain.toLowerCase();
    const progress = JSON.parse(localStorage.getItem(key) || '[]');

    if (!progress.includes(progressKey)) {
        progress.push(progressKey);
        localStorage.setItem(key, JSON.stringify(progress));
    }
}

// Execute an inline onclick string in a controlled sandbox and capture window.open URL.
function captureUrlFromOnclick(onclickCode, button, targetDomain, githubOrg, searchEngine) {
    if (!onclickCode) return null;

    let capturedUrl = null;

    const mockWindow = {
        open: function(url) {
            capturedUrl = url;
            return null;
        }
    };

    const mockDocument = {
        getElementById: function(id) {
            if (id === 'target') return { value: targetDomain };
            if (id === 'github-org') return { value: githubOrg };
            if (id === 'search-engine') return { value: searchEngine };
            return { value: '' };
        }
    };

    const mockRunDork = function(dorkQuery) {
        const processedQuery = dorkQuery.replace(/example\.com/g, targetDomain);
        const engine = (searchEngine || 'google').toLowerCase();
        if (engine === 'duckduckgo') {
            capturedUrl = 'https://duckduckgo.com/?q=' + encodeURIComponent(processedQuery);
        } else {
            capturedUrl = 'https://www.google.com/search?q=' + encodeURIComponent(processedQuery);
        }
    };

    const mockGetGithubOrg = function() {
        return githubOrg;
    };

    const mockSaveProgress = function() {};

    try {
        const runner = new Function(
            'window',
            'document',
            'event',
            'runDork',
            'getGithubOrg',
            'saveProgress',
            onclickCode
        );

        runner.call(
            button,
            mockWindow,
            mockDocument,
            { currentTarget: button },
            mockRunDork,
            mockGetGithubOrg,
            mockSaveProgress
        );
    } catch (e) {
        console.warn('[Dorkhub] Could not evaluate onclick for URL capture:', e);
    }

    return capturedUrl;
}

// Function to open all dorks in a category
function openAllInCategory(categoryElement) {
    const targetDomain = document.getElementById('target').value;
    // Get GitHub organization from the input field
    const githubOrgInput = document.getElementById('github-org') ? document.getElementById('github-org').value : '';
    // Use GitHub organization if provided, otherwise use domain as fallback
    const githubOrg = githubOrgInput && githubOrgInput.trim() ? githubOrgInput.trim() : targetDomain;
    
    // Get search engine preference - default to 'google'
    let searchEngine = 'google';
    const searchEngineElement = document.getElementById('search-engine');
    if (searchEngineElement && searchEngineElement.value) {
        searchEngine = searchEngineElement.value.toLowerCase();
    }
    console.log('[Dorkhub] Search engine:', searchEngine, 'Element exists:', !!searchEngineElement);
    
    if (!targetDomain) {
        alert('Please enter a target domain first!');
        return;
    }
    
    const buttons = categoryElement.querySelectorAll('.futuristic-button');
    const urls = [];
    const skippedButtons = [];
    
    // Extract all URLs
    buttons.forEach(button => {
        let onclick = button.getAttribute('onclick');
        if (!onclick) return;
        
        // Replace getGithubOrg() with the actual value before processing
        onclick = onclick.replace(/getGithubOrg\(\)/g, "'" + githubOrg + "'");
        
        let url = null;

        // Handle inline IIFE buttons that build dorks with a local dorkTemplate variable
        // Example: var dorkTemplate = 'site:example.com'; var dork = ...; window.open('https://duckduckgo.com/?q=' + encodeURIComponent(dork), ...)
        const inlineTemplateMatch = onclick.match(/dorkTemplate\s*=\s*(["'])(.*?)\1/);
        if (inlineTemplateMatch) {
            const inlineDork = inlineTemplateMatch[2].replace(/example\.com/g, targetDomain);

            // Preserve the original engine encoded in the inline button.
            if (onclick.includes('duckduckgo.com') || onclick.includes('duck.com')) {
                url = 'https://duckduckgo.com/?q=' + encodeURIComponent(inlineDork);
            } else {
                url = 'https://www.google.com/search?q=' + encodeURIComponent(inlineDork);
            }
        }
        
        // Handle runDork() calls
        const runDorkMatch = onclick.match(/runDork\('([^']+)'\)/);
        if (!url && runDorkMatch) {
            const dork = runDorkMatch[1].replace(/example\.com/g, targetDomain);
            
            // Use selected search engine
            if (searchEngine === 'duckduckgo') {
                url = 'https://duckduckgo.com/?q=' + encodeURIComponent(dork);
                console.log('[Dorkhub] Opening in DDG:', dork);
            } else {
                url = 'https://www.google.com/search?q=' + encodeURIComponent(dork);
                console.log('[Dorkhub] Opening in Google:', dork);
            }
        }
        // Handle direct window.open for Shodan
        else if (!url && onclick.includes('shodan.io')) {
            url = 'https://www.shodan.io/search?query=hostname:' + targetDomain;
        }
        // Handle direct window.open for Censys
        else if (!url && onclick.includes('censys.io')) {
            url = 'https://platform.censys.io/search?q=' + targetDomain;
        }
        // Handle GitHub searches
        else if (!url && onclick.includes('github.com/search')) {
            // Extract and process GitHub URLs
            if (onclick.includes('"*.' + '"')) {
                url = 'https://github.com/search?q=' + encodeURIComponent('"*.' + githubOrg + '"') + '&type=host';
            } else if (onclick.includes('filename:swagger.json')) {
                url = 'https://github.com/search?q=' + encodeURIComponent('filename:swagger.json "' + githubOrg + '"') + '&type=code';
            } else if (onclick.includes('extension:json')) {
                url = 'https://github.com/search?q=' + encodeURIComponent('extension:json "' + githubOrg + '" api') + '&type=code';
            } else if (onclick.includes('"apiKey"')) {
                url = 'https://github.com/search?q=' + encodeURIComponent('"apiKey" "' + githubOrg + '"') + '&type=host';
            } else if (onclick.includes('"api keys"')) {
                url = 'https://github.com/search?q=' + encodeURIComponent('"api keys" "' + githubOrg + '"') + '&type=code';
            } else if (onclick.includes('"Bearer"')) {
                url = 'https://github.com/search?q=' + encodeURIComponent('"Bearer" "' + githubOrg + '"') + '&type=host';
            } else if (onclick.includes('access_token')) {
                url = 'https://github.com/search?q=' + encodeURIComponent('access_token "' + githubOrg + '"') + '&type=code';
            } else if (onclick.includes('"secret"')) {
                url = 'https://github.com/search?q=' + encodeURIComponent('"secret" "' + githubOrg + '"') + '&type=host';
            } else if (onclick.includes('"token"')) {
                url = 'https://github.com/search?q=' + encodeURIComponent('"token" "' + githubOrg + '"') + '&type=host';
            } else if (onclick.includes('&type=host')) {
                url = 'https://github.com/search?q=' + encodeURIComponent('"' + githubOrg + '"') + '&type=host';
            }
        }
        // Handle GitLab searches
        else if (!url && onclick.includes('gitlab.com/search')) {
            // Extract and process GitLab URLs
            if (onclick.includes('&scope=projects')) {
                url = 'https://gitlab.com/search?search=' + encodeURIComponent(targetDomain) + '&scope=projects';
            } else if (onclick.includes('filename:swagger.json')) {
                url = 'https://gitlab.com/search?search=' + encodeURIComponent('filename:swagger.json ' + targetDomain) + '&scope=blobs';
            } else if (onclick.includes('extension:json')) {
                url = 'https://gitlab.com/search?search=' + encodeURIComponent('extension:json ' + targetDomain + ' api') + '&scope=blobs';
            } else if (onclick.includes('apiKey')) {
                url = 'https://gitlab.com/search?search=' + encodeURIComponent('apiKey ' + targetDomain) + '&scope=blobs';
            } else if (onclick.includes('api keys')) {
                url = 'https://gitlab.com/search?search=' + encodeURIComponent('api keys ' + targetDomain) + '&scope=blobs';
            } else if (onclick.includes('Bearer')) {
                url = 'https://gitlab.com/search?search=' + encodeURIComponent('Bearer ' + targetDomain) + '&scope=blobs';
            } else if (onclick.includes('access_token')) {
                url = 'https://gitlab.com/search?search=' + encodeURIComponent('access_token ' + targetDomain) + '&scope=blobs';
            } else if (onclick.includes('secret')) {
                url = 'https://gitlab.com/search?search=' + encodeURIComponent('secret ' + targetDomain) + '&scope=blobs';
            } else if (onclick.includes('token')) {
                url = 'https://gitlab.com/search?search=' + encodeURIComponent('token ' + targetDomain) + '&scope=blobs';
            } else if (onclick.includes('.env')) {
                url = 'https://gitlab.com/search?search=' + encodeURIComponent('.env ' + targetDomain) + '&scope=blobs';
            } else if (onclick.includes('password')) {
                url = 'https://gitlab.com/search?search=' + encodeURIComponent('password ' + targetDomain) + '&scope=blobs';
            } else if (onclick.includes('private_key')) {
                url = 'https://gitlab.com/search?search=' + encodeURIComponent('private_key ' + targetDomain) + '&scope=blobs';
            }
        }
        // Handle Google searches
        else if (!url && onclick.includes('google.com/search')) {
            const urlMatch = onclick.match(/window\.open\('([^']+)'/);
            if (urlMatch) {
                url = urlMatch[1];
            }
        }

        // Fallback: evaluate onclick in a sandbox to capture the exact URL.
        if (!url) {
            url = captureUrlFromOnclick(onclick, button, targetDomain, githubOrg, searchEngine);
        }
        
        if (url) {
            urls.push(url);
            // Mark button as completed
            button.classList.add('completed');
            // Save progress using the onclick signature for stable matching
            saveProgressToStorage(targetDomain, onclick);
        } else {
            skippedButtons.push((button.textContent || '').trim() || '(unnamed button)');
        }
    });
    
    if (urls.length === 0) {
        alert('No valid dorks found in this category');
        return;
    }
    
    // Confirm before opening
    let confirmMessage = `Open ${urls.length} tabs for "${targetDomain}"?`;
    if (skippedButtons.length > 0) {
        confirmMessage += `\n\nSkipped ${skippedButtons.length}: ${skippedButtons.join(', ')}`;
        console.warn('[Dorkhub] Skipped buttons in Open Category:', skippedButtons);
    }

    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Use extension API to open tabs without popup blocker
    chrome.runtime.sendMessage({
        action: 'openTabs',
        urls: urls
    }, response => {
        if (response && response.success) {
            console.log(`Opened ${urls.length} tabs successfully`);
        }
    });
}

// Run when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addOpenCategoryButtons);
} else {
    addOpenCategoryButtons();
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'ping') {
        sendResponse({status: 'ready'});
    }
});
