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
            fetchStockPricesFromOpen(symbol.symbol, apiKey);
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
            <p><strong>Current Price:</strong> $${parseFloat(realTimePrice.price).toFixed(2)}</p>
            <p><strong>Daily High:</strong> $${parseFloat(quoteData.high).toFixed(2)}</p>
            <p><strong>Daily Low:</strong> $${parseFloat(quoteData.low).toFixed(2)}</p>
            <p><strong>Opening Price:</strong> $${parseFloat(quoteData.open).toFixed(2)}</p>
            <p><strong>Price Change:</strong> $${parseFloat(quoteData.change).toFixed(2)}</p>
            <p><strong>Volume:</strong> ${parseFloat(quoteData.volume).toFixed(2)}</p>
            <p><strong>52-Week High:</strong> $${parseFloat(quoteData.fifty_two_week.high).toFixed(2)}</p>
            <p><strong>52-Week Low:</strong> $${parseFloat(quoteData.fifty_two_week.low).toFixed(2)}</p>
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

async function fetchStockPricesFromOpen(symbol, apiKey) {
    const currentTime = new Date();
    const estOffset = -5;
    const estTime = new Date(currentTime.getTime() + estOffset * 60 * 60 * 1000);

    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentSecond = currentTime.getSeconds();
    const currentDate = estTime.toISOString().split('T')[0];

    const startTime = `${currentDate} 09:30:00`;
    const endTime = currentHour >= 16 ? `${currentDate} 16:00:00` : `${currentDate} ${currentHour}:${currentMinute}:${currentSecond}`;

    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=5min&start_date=${startTime}&end_date=${endTime}&timezone=America/New_York&previous_close=true&order=ASC&apikey=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(data);

        if (data && data.values) {
            const labels = data.values.map(entry => entry.datetime);
            const prices = data.values.map(entry => parseFloat(entry.previous_close).toFixed(2));
            createLineChart(labels, prices, symbol);
        } else {
            console.error("Error fetching stock prices");
        }
    } catch (error) {
        console.error("Error fetching stock prices: ", error);
    }
}

function createLineChart(labels, prices, symbol) {
    const ctx = document.getElementById('priceChart').getContext('2d');

    if (window.stockChart) {
        window.stockChart.destroy();
    }

    window.stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `${symbol} Stock Price`,
                data: prices,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}