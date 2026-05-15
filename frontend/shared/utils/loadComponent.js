async function loadComponent(id, filePath) {
    const container = document.getElementById(id) || document.body;
    try {
        const response = await fetch(filePath);
        const html = await response.text();
        
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // If the container is the body, we just append children
        // If it's a specific div, we can replace or append
        while (temp.firstChild) {
            container.appendChild(temp.firstChild);
        }
    } catch (error) {
        console.error(`Erro ao carregar componente ${filePath}:`, error);
    }
}
