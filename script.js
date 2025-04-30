// API endpoint for crypto prices
const CRYPTO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';

// Constants
const COINGECKO_MARKETS_URL = 'https://api.coingecko.com/api/v3/coins/markets';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Store current crypto price
let currentPrice = 0;

// Cache management
let coinCache = {
    timestamp: 0,
    data: []
};

// DOM Elements
const cryptoSelect = document.getElementById('crypto');
const investmentInput = document.getElementById('investment');
const profitTarget = document.getElementById('profit-target');
const priceTarget = document.getElementById('price-target');
const returnPercentage = document.getElementById('return-percentage');
const currentPriceElement = document.getElementById('current-price');
const livePrice = document.getElementById('live-price');
const requiredPrice = document.getElementById('required-price');
const returnNeeded = document.getElementById('return-needed');
const balanceTarget = document.getElementById('balance-target');
const holdingsCurrentPrice = document.getElementById('holdings-current-price');
const requiredHoldings = document.getElementById('required-holdings');

// Toggle buttons
const toggleBtns = document.querySelectorAll('.toggle-btn');
const profitInputs = document.getElementById('profit-inputs');
const priceInputs = document.getElementById('price-inputs');

// Add this variable to track the currently selected crypto
let selectedCryptoId = 'bitcoin'; // default to bitcoin

// Add these variables at the top with your other DOM elements
const cryptoSelector = document.getElementById('crypto-selector');
const cryptoOptions = document.getElementById('crypto-options');
const cryptoSearch = document.getElementById('crypto-search');
const cryptoList = document.getElementById('crypto-list');
const selectedCryptoIcon = document.getElementById('selected-crypto-icon');
const selectedCryptoText = document.getElementById('selected-crypto-text');

// Event Listeners
cryptoSelect.addEventListener('change', updatePrice);
toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Hide all input sections first
        profitInputs.classList.add('hidden');
        priceInputs.classList.add('hidden');
        document.getElementById('holdings-inputs').classList.add('hidden');
        
        // Show selected section
        switch(btn.dataset.mode) {
            case 'profit':
                profitInputs.classList.remove('hidden');
                break;
            case 'price':
                priceInputs.classList.remove('hidden');
                break;
            case 'holdings':
                document.getElementById('holdings-inputs').classList.remove('hidden');
                break;
        }
    });
});

// Input event listeners for calculations
[investmentInput, profitTarget, priceTarget, balanceTarget].forEach(input => {
    input.addEventListener('input', calculateResults);
});

// Add this function to format numbers with commas while typing
function formatNumberInput(input) {
    // Remove any existing commas and non-numeric characters (except decimal point)
    let value = input.value.replace(/,/g, '').replace(/[^\d.]/g, '');
    
    // Format with commas
    if (value) {
        // Split number into integer and decimal parts
        let parts = value.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        
        // Update input value with formatted number
        input.value = parts.join('.');
    }
}

// Function to get numeric value from formatted input
function getNumericValue(input) {
    return parseFloat(input.value.replace(/,/g, '')) || 0;
}

// Add event listeners to format inputs
const numberInputs = [
    investmentInput, 
    profitTarget, 
    priceTarget, 
    balanceTarget
];

numberInputs.forEach(input => {
    // Format while typing
    input.addEventListener('input', (e) => {
        formatNumberInput(e.target);
    });
});

async function updatePrice() {
    try {
        const response = await fetch(`${CRYPTO_API_URL}?ids=${selectedCryptoId}&vs_currencies=usd`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    const data = await response.json();
        currentPrice = data[selectedCryptoId].usd;
        
        // Format price with commas and handle decimal places
        const formattedPrice = currentPrice >= 1 
            ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : currentPrice.toFixed(8);
            
        livePrice.textContent = `$${formattedPrice}`;
        currentPriceElement.value = currentPrice;
        
        // Show the result elements that might be hidden
        document.querySelector('.required-price').classList.remove('hidden');
        document.querySelector('.return-needed').classList.remove('hidden');
        
        // Recalculate results with new price
        calculateResults();
    } catch (error) {
        console.error('Error fetching price:', error);
        livePrice.textContent = 'Error loading price';
    }
}

function calculateHoldingsTarget() {
    const startingBalance = getNumericValue(investmentInput);
    const targetBalance = getNumericValue(balanceTarget);

    if (startingBalance && targetBalance && currentPrice) {
        // Calculate current holdings from starting balance
        const currentHoldings = startingBalance / currentPrice;
        
        // Calculate required price to reach target balance with current holdings
        const requiredPrice = targetBalance / currentHoldings;
        
        // Calculate percentage increase needed
        const priceIncrease = ((requiredPrice / currentPrice) - 1) * 100;
        
        // Format the results
        const formattedHoldings = formatCoinAmount(currentHoldings, getCoinSymbol(selectedCryptoId));
        
        requiredHoldings.innerHTML = `
            <div class="holdings-detail">
                <div>Current Holdings: ${formattedHoldings}</div>
                <div>Current Value: $${startingBalance.toLocaleString()}</div>
                <div>Required Price: $${requiredPrice.toLocaleString()}</div>
                <div>Price Increase Needed: ${priceIncrease.toFixed(2)}%</div>
                <div>Target Value: $${targetBalance.toLocaleString()}</div>
            </div>
        `;
    }
}

function calculateResults() {
    const investment = getNumericValue(investmentInput);
    const profit = getNumericValue(profitTarget);
    const targetPrice = getNumericValue(priceTarget);
    const targetBalance = getNumericValue(balanceTarget);

    // Get coin data from cache
    const selectedCoin = coinCache.data.find(coin => coin.id === selectedCryptoId);
    const coinSymbol = selectedCoin ? selectedCoin.symbol.toUpperCase() : '';

    // Calculate coins/units
    const coins = investment / currentPrice;

    // Update or add the units display in the results div
    const resultDiv = document.getElementById('result');
    let unitsDiv = resultDiv.querySelector('.current-units');
    
    if (!unitsDiv) {
        unitsDiv = document.createElement('div');
        unitsDiv.className = 'current-units';
        // Insert after current price
        resultDiv.querySelector('.current-price').after(unitsDiv);
    }

    if (investment && currentPrice) {
        unitsDiv.innerHTML = `
            <span>Units (${coinSymbol}):</span>
            <span>${formatCoinAmount(coins, coinSymbol)}</span>
        `;
        unitsDiv.classList.remove('hidden');
    } else {
        unitsDiv.classList.add('hidden');
    }

    if (currentPrice) {
        const activeMode = document.querySelector('.toggle-btn.active').dataset.mode;

        switch(activeMode) {
            case 'holdings':
                if (targetBalance) {
                    document.querySelector('.required-holdings').classList.remove('hidden');
                    calculateHoldingsTarget();
                }
                break;
            case 'price':
                if (investment && targetPrice) {
                    const potentialValue = coins * targetPrice;
                    const profitAmount = potentialValue - investment;
                    const returnPct = ((potentialValue / investment) - 1) * 100;
                    
                    requiredPrice.textContent = `$${targetPrice.toLocaleString()}`;
                    returnNeeded.textContent = `${returnPct.toFixed(2)}% (Profit: $${profitAmount.toLocaleString()})`;
                }
                break;
            case 'profit':
                if (investment && profit) {
                    const targetValue = investment + profit;
                    const requiredPriceValue = targetValue / coins;
                    const returnPct = (profit / investment) * 100;
                    
                    requiredPrice.textContent = `$${requiredPriceValue.toLocaleString()}`;
                    returnNeeded.textContent = `${returnPct.toFixed(2)}%`;
                    returnPercentage.value = returnPct.toFixed(2);
                }
                break;
        }
    }
}

// Helper function to format coin amounts
function formatCoinAmount(amount, symbol) {
    if (amount >= 1) {
        return amount.toLocaleString(undefined, { maximumFractionDigits: 8 });
    } else {
        return amount.toFixed(8);
    }
}

// Helper function to get coin symbol
function getCoinSymbol(coinId) {
    const symbols = {
        'bitcoin': 'BTC',
        'ethereum': 'ETH',
        'dogecoin': 'DOGE',
        'solana': 'SOL'
    };
    return symbols[coinId] || coinId.toUpperCase();
}

// Create a custom select dropdown
function createCustomSelect() {
    const container = document.createElement('div');
    container.className = 'custom-select-container';
    
    const searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.placeholder = 'Search cryptocurrencies...';
    searchBox.className = 'crypto-search';

    const dropdownList = document.createElement('div');
    dropdownList.className = 'crypto-dropdown-list hidden';

    return { container, searchBox, dropdownList };
}

// Format market cap and price change
function formatMarketCap(marketCap) {
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
}

function formatPriceChange(change) {
    const color = change >= 0 ? 'var(--primary-color)' : '#ff4444';
    return `<span style="color: ${color}">${change.toFixed(2)}%</span>`;
}

// Fetch and cache cryptocurrency data
async function fetchCryptoData() {
    try {
        const now = Date.now();
        
        // Return cached data if it's still valid
        if (now - coinCache.timestamp < CACHE_DURATION) {
            return coinCache.data;
        }

        const params = new URLSearchParams({
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: '250',
            page: '1',
            sparkline: 'false'
        });

        const response = await fetch(`${COINGECKO_MARKETS_URL}?${params}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update cache
        coinCache = {
            timestamp: now,
            data: data
        };
        
        return data;
    } catch (error) {
        console.error('Error fetching cryptocurrency data:', error);
        
        // If we have cached data, use it even if expired
        if (coinCache.data.length > 0) {
            return coinCache.data;
        }
        
        // If all else fails, return a minimal default list
        return [
            { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', market_cap: 0, price_change_percentage_24h: 0 },
            { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', market_cap: 0, price_change_percentage_24h: 0 },
            { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', market_cap: 0, price_change_percentage_24h: 0 },
            { id: 'solana', symbol: 'sol', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', market_cap: 0, price_change_percentage_24h: 0 }
        ];
    }
}

// Update the dropdown with filtered results
function updateDropdown(searchTerm = '', data = coinCache.data) {
    const filteredCoins = data.filter(coin => 
        coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    cryptoList.innerHTML = filteredCoins.map(coin => `
        <div class="crypto-option cursor-pointer p-2 hover:bg-input/50 transition-all flex items-center gap-3"
             data-value="${coin.id}">
            <img src="${coin.image}" alt="${coin.symbol}" class="w-6 h-6 rounded-full">
            <div class="flex-1">
                <div class="font-medium">${coin.name} (${coin.symbol.toUpperCase()})</div>
                <div class="text-sm text-gray-400">
                    ${coin.market_cap ? `Mkt Cap: ${formatMarketCap(coin.market_cap)} | ` : ''}
                    ${coin.price_change_percentage_24h ? `24h: ${formatPriceChange(coin.price_change_percentage_24h)}` : ''}
                </div>
            </div>
            <div class="text-right text-primary font-mono">
                ${formatPrice(coin.current_price)}
            </div>
        </div>
    `).join('');
}

// Update the initializeCustomSelect function
async function initializeCustomSelect() {
    try {
        // Show loading state
        selectedCryptoText.textContent = 'Loading cryptocurrencies...';
        cryptoSelector.disabled = true;

        const data = await fetchCryptoData();
        
        // Reset loading state
        selectedCryptoText.textContent = 'Select a cryptocurrency';
        cryptoSelector.disabled = false;

        // Event Listeners
        // Toggle dropdown on selector click
        cryptoSelector.addEventListener('click', (e) => {
            e.stopPropagation();
            cryptoOptions.classList.toggle('hidden');
            if (!cryptoOptions.classList.contains('hidden')) {
                cryptoSearch.focus();
                updateDropdown('', data);
            }
        });

        // Handle search input
        cryptoSearch.addEventListener('input', (e) => {
            updateDropdown(e.target.value, data);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!cryptoOptions.contains(e.target) && e.target !== cryptoSelector) {
                cryptoOptions.classList.add('hidden');
            }
        });

        // Handle crypto selection
        cryptoList.addEventListener('click', (e) => {
            const option = e.target.closest('.crypto-option');
            if (option) {
                const selectedId = option.dataset.value;
                const selectedCoin = data.find(coin => coin.id === selectedId);
                
                // Update the selector button
                selectedCryptoText.textContent = `${selectedCoin.name} (${selectedCoin.symbol.toUpperCase()})`;
                selectedCryptoIcon.src = selectedCoin.image;
                selectedCryptoIcon.classList.remove('hidden');
                
                // Close dropdown
                cryptoOptions.classList.add('hidden');
                
                // Update selected crypto and trigger price update
                selectedCryptoId = selectedId;
                updatePrice();
            }
        });

        // Initial dropdown update
        updateDropdown('', data);

    } catch (error) {
        console.error('Error initializing custom select:', error);
        selectedCryptoText.textContent = 'Error loading cryptocurrencies';
        cryptoSelector.disabled = false;
    }
}

// Initial price update
updatePrice();

document.addEventListener('DOMContentLoaded', initializeCustomSelect);

// Add this function at the end of your script.js
function initStarryBackground() {
    const starsContainer = document.getElementById('stars');
    const numberOfStars = 100;

    for (let i = 0; i < numberOfStars; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Random size between 1 and 3 pixels
        const size = Math.random() * 2 + 1;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // Random position
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        
        // Random animation delay
        star.style.animationDelay = `${Math.random() * 4}s`;
        
        starsContainer.appendChild(star);
    }
}

// Call this function when the document loads
document.addEventListener('DOMContentLoaded', () => {
    initializeCustomSelect();
    initStarryBackground();
});

// Add this helper function for price formatting
function formatPrice(price) {
    if (typeof price !== 'number') return '$0.00';
    return price >= 1
        ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$${price.toFixed(8)}`;
}
