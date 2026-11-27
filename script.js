// Función principal para ejecutar dorks
function runDork(dorkQuery) {
    var targetDomain = document.getElementById('target').value;

    if (!targetDomain) {
        alert('Please enter a target domain.');
        return;
    }

    // Reemplazar 'example.com' con el dominio objetivo
    var processedQuery = dorkQuery.replace(/example\.com/g, targetDomain);
    
    // Marcar botón como completado
    if (typeof event !== 'undefined' && event && event.currentTarget) {
        event.currentTarget.classList.add('completed');
        saveProgress(targetDomain, dorkQuery);
    }

    // Seleccionar motor de búsqueda según selector
    var searchEngine = document.getElementById('search-engine') ? document.getElementById('search-engine').value : 'google';
    var url;
    
    if (searchEngine === 'duckduckgo') {
        url = 'https://duckduckgo.com/?q=' + encodeURIComponent(processedQuery);
    } else {
        url = 'https://www.google.com/search?q=' + encodeURIComponent(processedQuery);
    }
    
    window.open(url, '_blank');
}

// Función para guardar progreso en localStorage
function saveProgress(domain, dork) {
    var key = 'bugbounty_progress_' + domain.toLowerCase();
    var progress = JSON.parse(localStorage.getItem(key) || '[]');
    
    if (!progress.includes(dork)) {
        progress.push(dork);
        localStorage.setItem(key, JSON.stringify(progress));
    }
}

// Función para cargar progreso desde localStorage
function loadProgress(domain) {
    if (!domain) return;
    
    var key = 'bugbounty_progress_' + domain.toLowerCase();
    var progress = JSON.parse(localStorage.getItem(key) || '[]');
    
    // Limpiar marcas previas
    resetAllButtons();
    
    // Marcar botones según progreso guardado
    progress.forEach(function(dork) {
        var buttons = document.querySelectorAll('.futuristic-button');
        buttons.forEach(function(button) {
            var onclick = button.getAttribute('onclick');
            if (onclick && onclick.includes(dork.replace(/"/g, '&quot;'))) {
                button.classList.add('completed');
            }
        });
    });
}

// Función para resetear todos los botones
function resetAllButtons() {
    var buttons = document.querySelectorAll('.futuristic-button');
    buttons.forEach(function(button) {
        button.classList.remove('completed');
    });
}

// Función para resetear botones de una categoría específica
function resetCategoryButtons(categoryElement) {
    var targetDomain = document.getElementById('target').value;
    if (!targetDomain) return;
    
    var buttons = categoryElement.querySelectorAll('.futuristic-button');
    
    buttons.forEach(function(button) {
        button.classList.remove('completed');
    });
    
    // Remover del localStorage
    var key = 'bugbounty_progress_' + targetDomain.toLowerCase();
    localStorage.removeItem(key);
}

// Función para resetear progreso completo del dominio actual
function resetAllProgress() {
    var targetDomain = document.getElementById('target').value;
    
    // Si hay dominio, eliminar su entrada del localStorage
    if (targetDomain) {
        var key = 'bugbounty_progress_' + targetDomain.toLowerCase();
        localStorage.removeItem(key);
    }
    
    // Siempre resetear visualmente todos los botones (con o sin dominio)
    resetAllButtons();
}

// Función para detectar cambios en el input del dominio
function onDomainChange() {
    var targetDomain = document.getElementById('target').value;

    if (!targetDomain) {
        resetAllButtons();
        return;
    }

    loadProgress(targetDomain);
}

function clearTargetInput() {
    var targetInput = document.getElementById('target');
    if (!targetInput) return;

    targetInput.value = '';
    onDomainChange();
    targetInput.focus();
}

function clearGithubOrgInput() {
    var githubOrgInput = document.getElementById('github-org');
    if (!githubOrgInput) return;

    githubOrgInput.value = '';
    githubOrgInput.focus();
}

function getGithubOrg() {
    var githubOrgInput = document.getElementById('github-org');
    if (githubOrgInput && githubOrgInput.value.trim()) {
        return githubOrgInput.value.trim();
    }

    var targetDomainInput = document.getElementById('target');
    if (targetDomainInput && targetDomainInput.value.trim()) {
        return targetDomainInput.value.trim();
    }

    return 'example.com';
}

// Event listener para inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    // Cargar progreso inicial si hay dominio
    var targetInput = document.getElementById('target');
    
    if (targetInput.value) {
        loadProgress(targetInput.value);
    }
    
    // Detectar cambios en el input
    targetInput.addEventListener('input', onDomainChange);
    targetInput.addEventListener('change', onDomainChange);
    
    // Guardar el dominio actual cuando se enfoca para comparar cambios
    targetInput.addEventListener('focus', function() {
        this.dataset.previousValue = this.value;
    });
    
    targetInput.addEventListener('blur', function() {
        if (this.dataset.previousValue !== this.value) {
            onDomainChange();
        }
    });
});
