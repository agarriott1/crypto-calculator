// API endpoints
const COINGECKO_MARKETS_URL = 'https://api.coingecko.com/api/v3/coins/markets';
const CRYPTO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';

// Store current state
let selectedCryptoId = 'bitcoin';
let currentPrice = 0;
let coinCache = {
    timestamp: 0,
    data: []
};

// DOM Elements
const cryptoGrid = document.getElementById('crypto-grid');
const cryptoSearch = document.getElementById('crypto-search');
const selectedCryptoIcon = document.getElementById('selected-crypto-icon');
const selectedCryptoText = document.getElementById('selected-crypto-text');
const livePrice = document.getElementById('live-price');
const currentPriceElement = document.getElementById('current-price');
const requiredPrice = document.getElementById('required-price');
const returnNeeded = document.getElementById('return-needed');
const investmentInput = document.getElementById('investment');
const profitTarget = document.getElementById('profit-target');
const priceTarget = document.getElementById('price-target');
const balanceTarget = document.getElementById('balance-target');
const requiredHoldings = document.getElementById('required-holdings');

// Fetch top cryptocurrencies
async function fetchCryptoData() {
    try {
        const params = new URLSearchParams({
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: '250',
            page: '1',
            sparkline: 'false',
            price_change_percentage: '24h'
        });

        const response = await fetch(`${COINGECKO_MARKETS_URL}?${params}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        coinCache = { timestamp: Date.now(), data: data };
        return data;
    } catch (error) {
        console.error('Error fetching cryptocurrency data:', error);
        if (coinCache.data.length > 0) return coinCache.data;
        
        // Fallback data
        return [
            { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
            { id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' }
        ];
    }
}

// Update dropdown with filtered results
function updateDropdown(searchTerm = '') {
    if (!coinCache.data.length) return;

    const filteredCoins = coinCache.data.filter(coin => 
        coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

    cryptoGrid.innerHTML = filteredCoins.map(coin => `
        <div class="crypto-option cursor-pointer p-3 hover:bg-input/50 transition-all flex items-center gap-3"
             data-value="${coin.id}">
            <img src="${coin.image}" alt="${coin.symbol}" class="w-6 h-6 rounded-full">
            <div class="flex-1">
                <div class="font-medium">${coin.name} (${coin.symbol.toUpperCase()})</div>
                <div class="text-sm text-gray-400">
                    Mkt Cap: ${formatMarketCap(coin.market_cap)} | 
                    24h: ${formatPriceChange(coin.price_change_percentage_24h)}
                </div>
            </div>
            <div class="text-right text-primary font-mono">
                ${formatPrice(coin.current_price)}
            </div>
        </div>
    `).join('');
}

// Helper functions
function formatMarketCap(marketCap) {
    if (!marketCap) return 'N/A';
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
}

function formatPriceChange(change) {
    if (!change) return '0.00%';
    return `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
}

function formatPrice(price) {
    if (typeof price !== 'number') return '$0.00';
    return price >= 1
        ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$${price.toFixed(8)}`;
}

function formatVolume(volume) {
    if (!volume) return 'N/A';
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    return `$${volume.toLocaleString()}`;
}

function formatSupply(supply) {
    if (!supply) return 'N/A';
    if (supply >= 1e9) return `${(supply / 1e9).toFixed(2)}B`;
    if (supply >= 1e6) return `${(supply / 1e6).toFixed(2)}M`;
    return `${supply.toLocaleString()}`;
}

// Update price for selected crypto
async function updatePrice() {
    try {
        livePrice.textContent = 'Fetching price...';
        livePrice.classList.add('loading');

        const response = await fetch(`${CRYPTO_API_URL}?ids=${selectedCryptoId}&vs_currencies=usd`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        currentPrice = data[selectedCryptoId].usd;
        
        const formattedPrice = currentPrice >= 1 
            ? currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : currentPrice.toFixed(8);
        
        livePrice.textContent = `$${formattedPrice}`;
        currentPriceElement.textContent = `$${formattedPrice}`;
        calculateResults();
    } catch (error) {
        console.error('Error fetching price:', error);
        livePrice.textContent = 'Error loading price';
    } finally {
        livePrice.classList.remove('loading');
    }
}

// Initialize dropdown functionality
function initializeDropdown() {
    // Toggle dropdown on selector click
    cryptoGrid.addEventListener('click', async (e) => {
        e.stopPropagation();
        cryptoGrid.classList.toggle('hidden');
        
        if (!cryptoGrid.classList.contains('hidden')) {
            cryptoSearch.focus();
            // Fetch data if we haven't already
            if (coinCache.data.length === 0) {
                await fetchCryptoData();
            }
            updateDropdown('');
        }
    });

    // Handle search input
    cryptoSearch.addEventListener('input', (e) => {
        updateDropdown(e.target.value);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!cryptoGrid.contains(e.target) && e.target !== cryptoGrid) {
            cryptoGrid.classList.add('hidden');
        }
    });

    // Handle crypto selection
    cryptoGrid.addEventListener('click', (e) => {
        const option = e.target.closest('.crypto-option');
        if (option) {
            const selectedId = option.dataset.value;
            const selectedCoin = coinCache.data.find(coin => coin.id === selectedId);
            
            if (selectedCoin) {
                selectedCryptoText.textContent = `${selectedCoin.name} (${selectedCoin.symbol.toUpperCase()})`;
                selectedCryptoIcon.src = selectedCoin.image;
                selectedCryptoIcon.classList.remove('hidden');
                selectedCryptoId = selectedId;
                cryptoGrid.classList.add('hidden');
                updatePrice();
            }
        }
    });
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize dropdown functionality
        initializeDropdown();
        
        // Fetch initial data
        const data = await fetchCryptoData();
        
        // Set initial selection to Bitcoin
        const bitcoin = data.find(coin => coin.id === 'bitcoin');
        if (bitcoin) {
            selectedCryptoText.textContent = `${bitcoin.name} (${bitcoin.symbol.toUpperCase()})`;
            selectedCryptoIcon.src = bitcoin.image;
            selectedCryptoIcon.classList.remove('hidden');
            updatePrice();
        }
        
        // Add calculation event listeners
        [investmentInput, profitTarget, priceTarget, balanceTarget].forEach(input => {
            if (input) {
                input.addEventListener('input', calculateResults);
            }
        });
        
        // Initialize strategy buttons
        document.querySelectorAll('.strategy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.strategy-btn').forEach(b => 
                    b.classList.remove('active', 'bg-primary/20', 'text-primary'));
                btn.classList.add('active', 'bg-primary/20', 'text-primary');
                
                document.querySelectorAll('#profit-inputs, #price-inputs, #holdings-inputs')
                    .forEach(el => el.classList.add('hidden'));
                
                const strategy = btn.dataset.strategy;
                document.getElementById(`${strategy}-inputs`).classList.remove('hidden');
                calculateResults();
            });
        });
    } catch (error) {
        console.error('Error initializing app:', error);
        selectedCryptoText.textContent = 'Error loading cryptocurrencies';
    }
});

// Calculate results based on inputs
function calculateResults() {
    const investment = parseFloat(investmentInput?.value || 0);
    if (!investment || !currentPrice) return;

    const coins = investment / currentPrice;
    const activeStrategy = document.querySelector('.strategy-btn.active')?.dataset.strategy;

    switch(activeStrategy) {
        case 'profit':
            const profit = parseFloat(profitTarget?.value || 0);
            if (profit) {
                const targetValue = investment + profit;
                const requiredPriceValue = targetValue / coins;
                const returnPct = (profit / investment) * 100;
                
                requiredPrice.textContent = formatPrice(requiredPriceValue);
                returnNeeded.textContent = `${returnPct.toFixed(2)}%`;
            }
            break;

        case 'price':
            const targetPrice = parseFloat(priceTarget?.value || 0);
            if (targetPrice) {
                const finalValue = coins * targetPrice;
                const profitAmount = finalValue - investment;
                const returnPct = (profitAmount / investment) * 100;
                
                requiredPrice.textContent = formatPrice(targetPrice);
                returnNeeded.textContent = `${returnPct.toFixed(2)}% (Profit: ${formatPrice(profitAmount)})`;
            }
            break;

        case 'holdings':
            const targetBalance = parseFloat(balanceTarget?.value || 0);
            if (targetBalance) {
                document.querySelector('.required-holdings').classList.remove('hidden');
                const requiredCoins = targetBalance / currentPrice;
                const currentCoins = investment / currentPrice;
                const additionalCoins = requiredCoins - currentCoins;
                
                requiredHoldings.innerHTML = `
                    Current: ${formatCoinAmount(currentCoins)} coins<br>
                    Required: ${formatCoinAmount(requiredCoins)} coins<br>
                    Additional needed: ${formatCoinAmount(additionalCoins)} coins
                `;
            }
            break;
    }
}

function formatCoinAmount(amount) {
    return amount >= 1 ? amount.toLocaleString(undefined, { maximumFractionDigits: 8 }) 
                      : amount.toFixed(8);
}

// Update price every 30 seconds
setInterval(updatePrice, 30000);

// Add these new helper functions

function getRarityBadge(rank) {
    const rarityConfig = {
        legendary: { max: 10, color: 'from-yellow-400 to-orange-500' },
        epic: { max: 50, color: 'from-purple-600 to-indigo-600' },
        rare: { max: 100, color: 'from-blue-400 to-cyan-400' },
        uncommon: { max: 250, color: 'from-green-400 to-emerald-500' },
        common: { max: Infinity, color: 'from-gray-400 to-gray-500' }
    };

    const rarity = Object.entries(rarityConfig).find(([_, config]) => rank <= config.max);
    
    return `
        <div class="px-3 py-1 rounded-full bg-gradient-to-r ${rarity[1].color} 
                    text-white text-xs font-bold uppercase tracking-wider">
            ${rarity[0]}
        </div>
    `;
}

function getAchievementBadges(coin) {
    const achievements = [];
    
    // Market Cap Achievements
    if (coin.market_cap >= 1e11) achievements.push({
        name: 'Titan',
        description: '$100B+ Market Cap',
        color: 'bg-yellow-500'
    });
    
    // Price Achievements
    if (coin.current_price >= 10000) achievements.push({
        name: 'Whale',
        description: '$10k+ Price',
        color: 'bg-blue-500'
    });
    
    // Age Achievements
    const ageInYears = (new Date() - new Date(coin.genesis_date)) / (1000 * 60 * 60 * 24 * 365);
    if (ageInYears >= 10) achievements.push({
        name: 'Elder',
        description: `${Math.floor(ageInYears)} years old`,
        color: 'bg-green-500'
    });
}
