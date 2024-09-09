let debounceTimer;

function debounceSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(searchStock, 500);
}


async function searchStock() {
    const query = document.getElementById('searchbar').value.trim();

    if (!query) {
        document.getElementById('dropdown').innerHTML = '';
        return;
    }

    const apiKey = 'crecbahr01qnd5cv0n30crecbahr01qnd5cv0n3g';
    const url = `https://finnhub.io/api/v1/search?q=${query}&token=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
        
        if (data.result && data.result.length > 0) {
            const usStocks = data.result.filter(symbol => {
                return symbol.symbol.match(/^[A-Za-z]+$/);
            });
            if (usStocks.length > 0) {
                displayDropdown(usStocks);
            } else {
                document.getElementById('dropdown').innerHTML = `<div class="no-results">No US stocks found</div>`                
            }
        } else {
            document.getElementById('dropdown').innerHTML = `<div class="no-result">No results found</div>`;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('dropdown').innerHTML = `<div class="no-result">Error fetching data</>`;
    }
}

function displayDropdown(symbols) {
    const dropdown = document.getElementById('dropdown');
    dropdown.innerHTML = '';
    const tenSymbols = symbols.slice(0, 10);

    tenSymbols.forEach(symbol => {
        const symbolItem = document.createElement('div');
        symbolItem.classList.add('dropdown-item');
        symbolItem.innerHTML = `<strong>${symbol.symbol}</strong> (${symbol.description})`;

        symbolItem.onclick = () => {
            createStockCard(symbol.symbol);
            dropdown.innerHTML = '';
            document.getElementById('searchbar').value = '';
        }
        dropdown.appendChild(symbolItem);
    });
}

function createStockCard(symbol) {
    const stockCardsContainer = document.getElementById('stock-cards-container');

    const card = document.createElement('div');
    card.classList.add('card', 'stock-card');
    card.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">${symbol}</h5>
        </div>
    `;
    stockCardsContainer.appendChild(card);
}