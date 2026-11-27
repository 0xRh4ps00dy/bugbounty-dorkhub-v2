// Content script - Runs on supported search result pages
console.log('🔍 Search URL Extractor - Content Script Loaded');

function getSearchEngine() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    const hasQuery = window.location.search.includes('q=');

    if (hostname.includes('google.') && pathname.includes('/search') && hasQuery) {
        return 'google';
    }

    if ((hostname.includes('duckduckgo.com') || hostname.includes('duck.com')) && hasQuery) {
        return 'duckduckgo';
    }

    return null;
}

function isSupportedResultsPage() {
    return Boolean(getSearchEngine());
}

// Extract all URLs from supported search results
function extractURLsFromSearchResults() {
    const engine = getSearchEngine();
    const foundUrls = new Set();

    if (!engine) {
        return [];
    }
    
    const selectors = engine === 'google'
        ? [
            'div#search .yuRUbf > a[href]',
            'div#search .MjjYud a[href^="http"]',
            'div#search .g a[href^="http"]',
            'div#search a[href^="http"]'
        ]
        : [
            '#links .result__title a.result__a[href]',
            'article[data-testid="result"] h2 a[href]',
            'a[data-testid="result-title-a"][href]',
            '#links a[href^="http"]'
        ];
    
    selectors.forEach(selector => {
        try {
            const links = document.querySelectorAll(selector);
            links.forEach(link => {
                const rawUrl = link.href;
                if (!rawUrl || !rawUrl.startsWith('http')) {
                    return;
                }

                try {
                    const urlObj = new URL(rawUrl);

                    if (engine === 'google') {
                        if (
                            rawUrl.includes('google.com/search') ||
                            rawUrl.includes('accounts.google.com') ||
                            rawUrl.includes('support.google.com') ||
                            rawUrl.includes('policies.google.com') ||
                            rawUrl.includes('/setprefs?') ||
                            rawUrl.includes('/advanced_search')
                        ) {
                            return;
                        }

                        // Handle Google Translate links - extract original URL from 'u' parameter
                        if (urlObj.hostname === 'translate.google.com' && urlObj.pathname === '/translate') {
                            const originalUrl = urlObj.searchParams.get('u');
                            if (originalUrl) {
                                try {
                                    foundUrls.add(new URL(originalUrl).href);
                                } catch (e) {
                                    // If URL parsing fails, skip it
                                }
                                return;
                            }
                        }

                        if (urlObj.hostname.includes('google.') && urlObj.pathname === '/url') {
                            const redirected = urlObj.searchParams.get('q') || urlObj.searchParams.get('url');
                            if (redirected) {
                                foundUrls.add(new URL(redirected).href);
                                return;
                            }
                        }
                    }

                    if (engine === 'duckduckgo') {
                        if (urlObj.hostname.includes('duckduckgo.com') && urlObj.pathname === '/l/') {
                            const redirected = urlObj.searchParams.get('uddg');
                            if (redirected) {
                                foundUrls.add(new URL(decodeURIComponent(redirected)).href);
                                return;
                            }
                        }

                        if (urlObj.hostname.includes('duckduckgo.com') || urlObj.hostname.includes('duck.com')) {
                            return;
                        }
                    }

                    foundUrls.add(urlObj.href);
                } catch (e) {
                    // If URL parsing fails, skip it
                }
            });
        } catch (e) {
            console.warn('Error with selector:', selector, e);
        }
    });
    
    return Array.from(foundUrls);
}

// Create and inject the extraction button
function createExtractButton() {
    // Check if button already exists
    if (document.getElementById('google-url-extractor-btn')) {
        return;
    }
    
    const button = document.createElement('button');
    button.id = 'google-url-extractor-btn';
    button.innerHTML = '📋';
    button.title = 'Extraer URLs de esta página';
    
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        background: linear-gradient(135deg, #de5833, #d43b1c);
        color: white;
        border: none;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        font-size: 20px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(222, 88, 51, 0.4);
        transition: all 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        opacity: 0.9;
    `;
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'scale(1.1)';
        button.style.boxShadow = '0 6px 20px rgba(222, 88, 51, 0.6)';
        button.style.opacity = '1';
    });
    
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 12px rgba(222, 88, 51, 0.4)';
        button.style.opacity = '0.9';
    });
    
    button.addEventListener('click', showURLsModal);
    
    document.body.appendChild(button);
}

// Show modal with extracted URLs
function showURLsModal() {
    const urls = extractURLsFromSearchResults();
    
    if (urls.length === 0) {
        showNotification('⚠️ No se encontraron URLs en esta página', 'warning');
        return;
    }
    
    // Remove existing modal if any
    const existingModal = document.getElementById('google-url-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'google-url-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.75);
        z-index: 1000000;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        animation: fadeIn 0.2s ease;
    `;
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #1e1e1e;
        padding: 30px;
        border-radius: 12px;
        max-width: 900px;
        width: 90%;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        animation: slideUp 0.3s ease;
    `;
    
    // Get current search query for filename
    const searchQuery = new URLSearchParams(window.location.search).get('q') || 'search';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const engine = getSearchEngine() || 'search';
    const filename = `${engine}_${searchQuery.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}_${timestamp}.txt`;
    
    modalContent.innerHTML = `
        <style>
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            #google-url-modal button:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            }
            #google-url-modal button:active {
                transform: translateY(0);
            }
        </style>
        <h2 style="margin: 0 0 20px 0; color: #e0e0e0; font-size: 24px; display: flex; align-items: center; gap: 10px;">
            📋 URLs Extraídas
            <span style="background: #de5833; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: normal;">
                ${urls.length}
            </span>
        </h2>
        
        <div style="margin-bottom: 20px; padding: 15px; background: #2a2a2a; border-left: 4px solid #2196f3; border-radius: 4px;">
            <strong style="color: #e0e0e0;">🔍 Búsqueda:</strong> <code style="background: #3a3a3a; color: #4fc3f7; padding: 2px 8px; border-radius: 3px;">${searchQuery}</code>
        </div>
        
        <div style="margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button id="copy-all-btn" style="
                background: #4caf50;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
                transition: all 0.2s;
            ">✂️ Copiar Todas</button>
            
            <button id="download-txt-btn" style="
                background: #2196f3;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
                transition: all 0.2s;
            ">💾 Descargar TXT</button>
            
            <button id="select-all-btn" style="
                background: #ff9800;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
                transition: all 0.2s;
            ">🔘 Seleccionar Todo</button>
            
            <button id="close-modal-btn" style="
                background: #f44336;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: 14px;
                transition: all 0.2s;
                margin-left: auto;
            ">❌ Cerrar</button>
        </div>
        
        <div style="margin-bottom: 15px; color: #b0b0b0; font-size: 13px;">
            💡 <strong>Tip:</strong> Usa los controles para gestionar las URLs
        </div>
        
        <div style="margin-bottom: 15px; display: flex; gap: 10px; border-bottom: 1px solid #3a3a3a; padding-bottom: 15px;">
            <button id="select-all-urls-btn" style="
                background: #9c27b0;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: 12px;
                transition: all 0.2s;
            ">☑️ Seleccionar Todo</button>
            
            <button id="deselect-all-urls-btn" style="
                background: #607d8b;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: 12px;
                transition: all 0.2s;
            ">☐ Deseleccionar Todo</button>
            
            <button id="open-selected-btn" style="
                background: #00bcd4;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: 12px;
                transition: all 0.2s;
                margin-left: auto;
            ">🌐 Abrir Seleccionadas</button>
            
            <button id="open-all-urls-btn" style="
                background: #ff5722;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: 12px;
                transition: all 0.2s;
            ">🚀 Abrir Todas</button>
        </div>
        
        <div id="urls-list" style="
            width: 100%;
            max-height: 450px;
            overflow-y: auto;
            padding: 0;
            margin-bottom: 15px;
            border: 2px solid #3a3a3a;
            border-radius: 8px;
            background: #2a2a2a;
        ">
            ${urls.map((url, index) => `
                <div id="url-item-${index}" style="
                    display: flex;
                    align-items: center;
                    padding: 10px 12px;
                    border-bottom: 1px solid #3a3a3a;
                    gap: 10px;
                    transition: background-color 0.2s;
                " onmouseover="this.style.backgroundColor='#353535'" onmouseout="this.style.backgroundColor='transparent'">
                    <input type="checkbox" class="url-checkbox" value="${index}" style="cursor: pointer; width: 18px; height: 18px;">
                    <span style="color: #4fc3f7; font-family: monospace; font-size: 12px; flex: 1; word-break: break-all; max-width: calc(100% - 60px);">${url}</span>
                    <button class="open-single-btn" data-url="${url}" style="
                        background: #4caf50;
                        color: white;
                        border: none;
                        padding: 4px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                        font-weight: bold;
                        white-space: nowrap;
                        transition: all 0.2s;
                    ">🔗</button>
                </div>
            `).join('')}
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="color: #b0b0b0; font-size: 12px; margin-bottom: 8px; display: block;">
                📝 <strong>Editar URLs (opcional):</strong>
            </label>
            <textarea id="urls-textarea" style="
                width: 100%;
                height: 300px;
                padding: 15px;
                border: 2px solid #3a3a3a;
                border-radius: 8px;
                font-family: 'Courier New', 'Consolas', monospace;
                font-size: 13px;
                line-height: 1.6;
                resize: vertical;
                box-sizing: border-box;
                background: #2a2a2a;
                color: #e0e0e0;
            ">${urls.join('\n')}</textarea>
        </div>
        
        <div style="margin-top: 15px; padding: 10px; background: #2a2a2a; border-radius: 6px; font-size: 12px; color: #b0b0b0;">
            <div style="display: flex; justify-content: space-between;">
                <span>📊 Total de URLs: <strong style="color: #e0e0e0;">${urls.length}</strong></span>
                <span>⏰ ${new Date().toLocaleString('es-ES')}</span>
            </div>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Event listeners
    document.getElementById('open-all-urls-btn').addEventListener('click', () => {
        const urlsText = document.getElementById('urls-textarea').value;
        const urlsToOpen = urlsText.split('\n').filter(u => u.trim());
        
        if (urlsToOpen.length === 0) {
            showNotification('⚠️ No hay URLs para abrir', 'warning');
            return;
        }
        
        // Limitar a 20 URLs para evitar sobrecargar el navegador
        const maxUrls = 20;
        if (urlsToOpen.length > maxUrls) {
            showNotification(`⚠️ Se abrirán solo las primeras ${maxUrls} URLs de ${urlsToOpen.length}`, 'warning');
        }
        
        urlsToOpen.slice(0, maxUrls).forEach(url => {
            if (url.trim().startsWith('http')) {
                browser.runtime.sendMessage({
                    action: 'openURL',
                    url: url.trim()
                });
            }
        });
        
        showNotification(`✅ Abriendo ${Math.min(urlsToOpen.length, maxUrls)} URLs...`, 'success');
    });
    
    document.getElementById('open-selected-btn').addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.url-checkbox:checked');
        
        if (checkboxes.length === 0) {
            showNotification('⚠️ Selecciona al menos una URL para abrir', 'warning');
            return;
        }
        
        const urlsToOpen = Array.from(checkboxes).map(cb => {
            const index = cb.value;
            return document.querySelector(`#url-item-${index} span`).textContent.trim();
        });
        
        // Limitar a 20 URLs
        const maxUrls = 20;
        if (urlsToOpen.length > maxUrls) {
            showNotification(`⚠️ Se abrirán solo las primeras ${maxUrls} URLs de ${urlsToOpen.length}`, 'warning');
        }
        
        urlsToOpen.slice(0, maxUrls).forEach(url => {
            if (url.trim().startsWith('http')) {
                browser.runtime.sendMessage({
                    action: 'openURL',
                    url: url.trim()
                });
            }
        });
        
        showNotification(`✅ Abriendo ${Math.min(urlsToOpen.length, maxUrls)} URLs seleccionadas...`, 'success');
    });
    
    // Botones individuales para abrir URLs
    document.querySelectorAll('.open-single-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.getAttribute('data-url');
            if (url && url.startsWith('http')) {
                browser.runtime.sendMessage({
                    action: 'openURL',
                    url: url
                });
                
                btn.innerHTML = '✅';
                btn.style.background = '#66bb6a';
                setTimeout(() => {
                    btn.innerHTML = '🔗';
                    btn.style.background = '#4caf50';
                }, 1500);
            }
        });
        
        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.05)';
            btn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = 'none';
        });
    });
    
    // Selector/deselector de todos los checkboxes
    document.getElementById('select-all-urls-btn').addEventListener('click', () => {
        document.querySelectorAll('.url-checkbox').forEach(cb => {
            cb.checked = true;
        });
        showNotification(`✅ Todas las URLs seleccionadas (${document.querySelectorAll('.url-checkbox').length})`, 'success');
    });
    
    document.getElementById('deselect-all-urls-btn').addEventListener('click', () => {
        document.querySelectorAll('.url-checkbox').forEach(cb => {
            cb.checked = false;
        });
        showNotification('❌ Selección eliminada', 'info');
    });
    
    // Make checkboxes keyboard accessible
    document.querySelectorAll('.url-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const itemDiv = this.closest('[id^="url-item-"]');
            if (this.checked) {
                itemDiv.style.backgroundColor = '#353535';
            } else {
                itemDiv.style.backgroundColor = 'transparent';
            }
        });
    });
    
    // Copy all button
    document.getElementById('copy-all-btn').addEventListener('click', () => {
        const textarea = document.getElementById('urls-textarea');
        textarea.select();
        document.execCommand('copy');
        
        showNotification('✅ URLs copiadas al portapapeles!', 'success');
        
        const btn = document.getElementById('copy-all-btn');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '✅ ¡Copiado!';
        btn.style.background = '#66bb6a';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.style.background = '#4caf50';
        }, 2000);
    });
    
    // Download button
    document.getElementById('download-txt-btn').addEventListener('click', () => {
        const textarea = document.getElementById('urls-textarea');
        const content = textarea.value;
        
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification('💾 Archivo descargado!', 'success');
    });
    
    // Select all in textarea button
    document.getElementById('select-all-btn').addEventListener('click', () => {
        const textarea = document.getElementById('urls-textarea');
        textarea.select();
        textarea.focus();
    });
    
    // Close modal button
    document.getElementById('close-modal-btn').addEventListener('click', () => {
        modal.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => modal.remove(), 200);
    });
    
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.animation = 'fadeOut 0.2s ease';
            setTimeout(() => modal.remove(), 200);
        }
    });
    
    // Close with ESC key
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000001;
        background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#2196f3'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideInRight 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize if on supported results page
function initialize() {
    if (isSupportedResultsPage()) {
        createExtractButton();
        console.log('✅ Search URL Extractor ready!');
    }
}

// Run when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// Re-initialize on navigation (for SPA-like behavior)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        initialize();
    }
}).observe(document, { subtree: true, childList: true });

// Listen for messages from popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getURLCount') {
        const urls = extractURLsFromSearchResults();
        sendResponse({ count: urls.length, urls: urls });
    }
    if (request.action === 'extractURLs') {
        showURLsModal();
        sendResponse({ success: true });
    }
    return true;
});
