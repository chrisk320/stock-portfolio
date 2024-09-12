let debounceTimer;
const apiKey = '8620e79622de4c798deb7617b5859acc';

function debounceSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(searchStock, 500);
}


async function searchStock(apiKey) {
    const query = document.getElementById('searchbar').value.trim();

    if (!query) {
        document.getElementById('dropdown').innerHTML = '';
        return;
    }

    const url = `https://api.twelvedata.com/symbol_search?symbol=${query}&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);
        
        if (data.data && data.data.length > 0) {
            const usStocks = data.data.filter(symbol => {
                return symbol.symbol.match(/^[A-Za-z]+$/) && (symbol.exchange === 'NYSE' || symbol.exchange === 'NASDAQ');
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
        symbolItem.innerHTML = `<strong>${symbol.symbol}</strong> (${symbol.instrument_name})`;

        symbolItem.onclick = () => {
            fetchStockDetails(symbol.symbol, apiKey);
            dropdown.innerHTML = '';
            document.getElementById('searchbar').value = '';
        }
        dropdown.appendChild(symbolItem);
    });
}

async function fetchStockDetails(symbol, apiKey) {
    const quoteUrl = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`;
    const priceUrl = `https://api.twelvedata.com/price?symbol=${symbol}&apikey=${apiKey}`;

    try {
        const priceResponse = await fetch(priceUrl);
        const priceData = await priceResponse.json();
        
        const quoteResponse = await fetch(quoteUrl);
        const quoteData = await quoteResponse.json();

        if (priceData && priceData.price && quoteData) {
            createStockCard(quoteData, priceData);
        } else {
            console.error('Error fetching stock details');
        }
    } catch (error) {
        console.error('Error fetching stock details: ', error);
    }
}


function createStockCard(quoteData, realTimePrice) {
    const stockCardsContainer = document.getElementById('stock-cards-container');

    const card = document.createElement('div');
    card.classList.add('card', 'stock-card');
    card.innerHTML = `
        <div class="card-body">
            <h5 class="card-title">${quoteData.symbol}</h5>
            <p><strong>Current Price:</strong> $${realTimePrice.price}</p>
            <p><strong>Daily High:</strong> $${quoteData.high}</p>
            <p><strong>Daily Low:</strong> $${quoteData.low}</p>
            <p><strong>Opening Price:</strong> $${quoteData.open}</p>
            <p><strong>Price Change:</strong> $${quoteData.change}</p>
            <p><strong>Volume:</strong> ${quoteData.volume}</p>
            <p><strong>52-Week High:</strong> $${quoteData.fifty_two_week.high}</p>
            <p><strong>52-Week Low:</strong> $${quoteData.fifty_two_week.low}</p>
        </div>
    `;
    stockCardsContainer.appendChild(card);
}

document.getElementById('add-stock-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const dropdownItems = document.getElementById('dropdown').getElementsByClassName('dropdown-item');
    if (dropdownItems.length > 0) {
        const firstStockSymbol = dropdownItems[0].querySelector('strong').innerText;
        fetchStockDetails(firstStockSymbol, apiKey);

        document.getElementById('dropdown').innerHTML = '';
        document.getElementById('searchbar').value = '';
    } else {
        alert('No stock selected or avilable to add!');
    }
});