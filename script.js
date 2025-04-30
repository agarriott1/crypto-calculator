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

// Strategy buttons
document.querySelectorAll('.strategy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        document.querySelectorAll('.strategy-btn').forEach(b => 
            b.classList.remove('active', 'bg-primary/20', 'text-primary'));
        
        // Add active class to clicked button
        btn.classList.add('active', 'bg-primary/20', 'text-primary');
        
        // Hide all input sections
        document.querySelectorAll('#profit-inputs, #price-inputs, #holdings-inputs')
            .forEach(el => el.classList.add('hidden'));
        
        // Show selected input section
        const strategy = btn.dataset.strategy;
        document.getElementById(`${strategy}-inputs`).classList.remove('hidden');
        
        // Update calculations
        calculateResults();
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
    if (input) {
        input.addEventListener('input', (e) => {
            formatNumberInput(e.target);
            calculateResults();
        });
    }
});

async function updatePrice() {
    try {
        livePrice.textContent = 'Fetching price...';
        livePrice.classList.add('loading');

        const response = await fetch(`${CRYPTO_API_URL}?ids=${selectedCryptoId}&vs_currencies=usd`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    const data = await response.json();
        currentPrice = data[selectedCryptoId].usd;
        
        // Format price with commas
        const formattedPrice = currentPrice >= 1 
            ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : currentPrice.toFixed(8);
        
        livePrice.textContent = `$${formattedPrice}`;
        currentPriceElement.textContent = `$${formattedPrice}`;
        
        // Recalculate results with new price
        calculateResults();
    } catch (error) {
        console.error('Error fetching price:', error);
        livePrice.textContent = 'Error loading price';
    } finally {
        livePrice.classList.remove('loading');
    }
}

function calculateResults() {
    const investment = getNumericValue(investmentInput);
    const profit = getNumericValue(profitTarget);
    const targetPrice = getNumericValue(priceTarget);
    const targetBalance = getNumericValue(balanceTarget);

    if (!investment || !currentPrice) return;

    const coins = investment / currentPrice;
    const activeStrategy = document.querySelector('.strategy-btn.active').dataset.strategy;

    switch(activeStrategy) {
        case 'profit':
            if (profit) {
                const targetValue = investment + profit;
                const requiredPriceValue = targetValue / coins;
                const returnPct = (profit / investment) * 100;
                
                requiredPrice.textContent = `$${requiredPriceValue.toLocaleString(undefined, 
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                returnNeeded.textContent = `${returnPct.toFixed(2)}%`;
            }
            break;

        case 'price':
            if (targetPrice) {
                const finalValue = coins * targetPrice;
                const profitAmount = finalValue - investment;
                const returnPct = (profitAmount / investment) * 100;
                
                requiredPrice.textContent = `$${targetPrice.toLocaleString()}`;
                returnNeeded.textContent = `${returnPct.toFixed(2)}% (Profit: $${profitAmount.toLocaleString()})`;
            }
            break;

        case 'holdings':
            if (targetBalance) {
                document.querySelector('.required-holdings').classList.remove('hidden');
                const requiredCoins = targetBalance / currentPrice;
                const currentCoins = investment / currentPrice;
                const additionalCoins = requiredCoins - currentCoins;
                
                requiredHoldings.innerHTML = `
                    Current: ${currentCoins.toFixed(8)} coins<br>
                    Required: ${requiredCoins.toFixed(8)} coins<br>
                    Additional needed: ${additionalCoins.toFixed(8)} coins
                `;
            }
            break;
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
    if (!marketCap) return 'N/A';
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
            sparkline: 'false',
            price_change_percentage: '24h'
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
            { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', market_cap: 0, price_change_percentage_24h: 0, current_price: 0 },
            { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', market_cap: 0, price_change_percentage_24h: 0, current_price: 0 },
            { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png', market_cap: 0, price_change_percentage_24h: 0, current_price: 0 },
            { id: 'solana', symbol: 'sol', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png', market_cap: 0, price_change_percentage_24h: 0, current_price: 0 }
        ];
    }
}

// Update the dropdown with filtered results
function updateDropdown(searchTerm = '') {
    if (!coinCache.data.length) return;

    const filteredCoins = coinCache.data.filter(coin => 
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
                    Mkt Cap: ${formatMarketCap(coin.market_cap)} | 
                    24h: <span class="${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}">
                        ${coin.price_change_percentage_24h?.toFixed(2)}%
                    </span>
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
        const data = await fetchCryptoData();
        updateDropdown();
        
        // Set initial selection to Bitcoin
        const bitcoin = data.find(coin => coin.id === 'bitcoin');
        if (bitcoin) {
            selectedCryptoText.textContent = `${bitcoin.name} (${bitcoin.symbol.toUpperCase()})`;
            selectedCryptoIcon.src = bitcoin.image;
            selectedCryptoIcon.classList.remove('hidden');
            selectedCryptoId = bitcoin.id;
            updatePrice();
        }
    } catch (error) {
        console.error('Error initializing dropdown:', error);
    }
}

// Initial price update
updatePrice();

document.addEventListener('DOMContentLoaded', () => {
    initializeCustomSelect();
    initStarryBackground();
});

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

// Add these functions to handle the multi-step flow
function initializeMultiStep() {
    // Populate crypto grid
    populateCryptoGrid();
    
    // Add step navigation handlers
    document.getElementById('crypto-grid').addEventListener('click', handleCryptoSelection);
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.addEventListener('click', handleMethodSelection);
    });
}

function populateCryptoGrid() {
    const grid = document.getElementById('crypto-grid');
    
    // Show loading state
    grid.innerHTML = '<div class="col-span-full text-center">Loading cryptocurrencies...</div>';
    
    fetchCryptoData().then(data => {
        grid.innerHTML = data.slice(0, 12).map(coin => `
            <button class="crypto-card" data-id="${coin.id}">
                <div class="bg-card/80 backdrop-blur-xl rounded-xl p-4 border border-white/10 
                            hover:border-primary/50 transition-all hover:-translate-y-1 
                            flex flex-col items-center space-y-2">
                    <img src="${coin.image}" alt="${coin.symbol}" class="w-12 h-12 rounded-full">
                    <div class="text-center">
                        <div class="font-medium">${coin.symbol.toUpperCase()}</div>
                        <div class="text-sm text-gray-400">${formatPrice(coin.current_price)}</div>
                    </div>
                </div>
            </button>
        `).join('');
    });
}

function handleCryptoSelection(e) {
    const cryptoCard = e.target.closest('.crypto-card');
    if (!cryptoCard) return;

    // Update selected crypto
    selectedCryptoId = cryptoCard.dataset.id;
    
    // Remove active state from all cards and add to selected
    document.querySelectorAll('.crypto-card').forEach(card => {
        card.querySelector('div').classList.remove('border-primary');
    });
    cryptoCard.querySelector('div').classList.add('border-primary');

    // Show next step
    document.getElementById('step-2').classList.remove('hidden');
    document.getElementById('step-2').scrollIntoView({ behavior: 'smooth' });
}

function handleMethodSelection(e) {
    const btn = e.target.closest('.method-btn');
    if (!btn) return;

    // Update active state
    document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Show calculator step
    document.getElementById('step-3').classList.remove('hidden');
    document.getElementById('step-3').scrollIntoView({ behavior: 'smooth' });

    // Show appropriate inputs
    const mode = btn.dataset.mode;
    showCalculatorInputs(mode);
}

function showCalculatorInputs(mode) {
    // Hide all input sections
    document.querySelectorAll('#step-3 > div > div[id$="-inputs"]').forEach(div => {
        div.classList.add('hidden');
    });

    // Show selected section
    document.getElementById(`${mode}-inputs`).classList.remove('hidden');
}

// Add styles for the method buttons
const methodBtnStyles = `
    .method-btn {
        @apply px-4 py-3 rounded-lg text-left transition-all flex flex-col
               hover:bg-primary/10;
    }
    .method-btn.active {
        @apply bg-primary/20 border-primary text-primary;
    }
`;

// Add to your existing styles
const styles = document.createElement('style');
styles.textContent = methodBtnStyles;
document.head.appendChild(styles);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeMultiStep();
    initStarryBackground();
});

// Update price every 30 seconds
setInterval(updatePrice, 30000);
