async function buscar() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const timeInfo = document.getElementById('timeInfo');
    const resultSection = document.getElementById('resultSection');
    const sourceBadge = document.getElementById('sourceBadge');
    const resultTitle = document.getElementById('resultTitle');
    const resultText = document.getElementById('resultText');
    const resultLink = document.getElementById('resultLink');
    
    const query = searchInput.value.trim();
    
    if (!query) {
        showError('Por favor, ingresa una consulta de búsqueda');
        return;
    }
    
    loading.classList.remove('hidden');
    error.classList.add('hidden');
    timeInfo.classList.add('hidden');
    resultSection.classList.add('hidden');
    searchBtn.disabled = true;
    
    try {
        const response = await fetch('/buscar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: query })
        });
        
        const data = await response.json();
        
        if (data.success !== false) {
            if (data.time_info) {
                timeInfo.textContent = `⏰ ${data.time_info}`;
                timeInfo.classList.remove('hidden');
            }
            
            sourceBadge.textContent = data.source;
            sourceBadge.className = 'source-badge';
            if (data.source.includes('Wikipedia')) {
                sourceBadge.classList.add('wikipedia');
            } else {
                sourceBadge.classList.add('scraping');
            }
            
            resultTitle.textContent = data.title;
            resultText.textContent = data.text;
            resultLink.href = data.url;
            
            resultSection.classList.remove('hidden');
        } else {
            showError(data.error || 'Error al procesar la búsqueda');
        }
    } catch (err) {
        showError('Error de conexión con el servidor');
    } finally {
        loading.classList.add('hidden');
        searchBtn.disabled = false;
    }
}

function showError(message) {
    const error = document.getElementById('error');
    error.textContent = message;
    error.classList.remove('hidden');
}

document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        buscar();
    }
});
