// Constants
const COINGECKO_MARKETS_URL = 'https://api.coingecko.com/api/v3/coins/markets';
const QUERY_PARAMS = '?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false';

// State management
let currentStep = 1;
let selectedCrypto = null;
let selectedStrategy = null;
let cryptoList = [];

// DOM Elements
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const cryptoGrid = document.getElementById('cryptoGrid');
const cryptoSearch = document.getElementById('cryptoSearch');
const calculateBtn = document.getElementById('calculateBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');
const inputFields = document.getElementById('inputFields');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeStarryBackground();
    fetchCryptoData().then(() => {
        // Pre-select Bitcoin after data is fetched
        const bitcoinId = 'bitcoin';
        handleCryptoSelection(bitcoinId);
        document.getElementById('cryptoSearch').value = 'Bitcoin';
    });
    setupEventListeners();
});

// Create starry background
function initializeStarryBackground() {
    const starsContainer = document.getElementById('stars');
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.width = Math.random() * 3 + 'px';
        star.style.height = star.style.width;
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 4 + 's';
        starsContainer.appendChild(star);
    }
}

// Fetch crypto data from CoinGecko
async function fetchCryptoData() {
    try {
        const response = await fetch(COINGECKO_MARKETS_URL + QUERY_PARAMS);
        cryptoList = await response.json();
        renderCryptoDropdown(cryptoList);
    } catch (error) {
        cryptoGrid.innerHTML = '<p class="text-red-500">Error fetching cryptocurrency data. Please try again later.</p>';
        console.error('Error fetching crypto data:', error);
    }
}

// Render crypto grid
function renderCryptoDropdown(coins) {
    const dropdown = document.getElementById('cryptoDropdown');
    dropdown.innerHTML = coins.map(coin => `
        <div class="crypto-option p-3 hover:bg-gray-700 cursor-pointer" data-id="${coin.id}">
            <div class="flex items-center space-x-3">
                <img src="${coin.image}" alt="${coin.name}" class="w-6 h-6">
                <div class="flex-1">
                    <h3 class="font-medium">${coin.name}</h3>
                    <p class="text-sm text-gray-400">${coin.symbol.toUpperCase()}</p>
                </div>
                <div class="text-right">
                    <p class="font-medium">$${formatNumber(coin.current_price)}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('cryptoSearch');
    const dropdown = document.getElementById('cryptoDropdown');
    const strategyInputs = document.getElementById('strategyInputs');

    // Show dropdown when clicking on search input
    searchInput.addEventListener('focus', () => {
        dropdown.classList.remove('hidden');
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    // Filter coins on input
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredCoins = cryptoList.filter(coin => 
            coin.name.toLowerCase().includes(searchTerm) || 
            coin.symbol.toLowerCase().includes(searchTerm)
        );
        renderCryptoDropdown(filteredCoins);
        dropdown.classList.remove('hidden');
    });

    // Handle crypto selection
    dropdown.addEventListener('click', (e) => {
        const option = e.target.closest('.crypto-option');
        if (!option) return;
        
        const cryptoId = option.dataset.id;
        handleCryptoSelection(cryptoId);
        searchInput.value = selectedCrypto.name;
        dropdown.classList.add('hidden');
    });

    // Strategy selection - fix the duplication issue
    document.querySelectorAll('.strategy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active state from all buttons
            document.querySelectorAll('.strategy-btn').forEach(b => {
                b.classList.remove('active');
                // Reset button content to original state
                b.innerHTML = `
                    <h3 class="text-lg font-semibold">${b.querySelector('h3').textContent}</h3>
                    <p class="text-sm text-gray-400">${b.querySelector('p').textContent}</p>
                `;
            });
            
            // Add active state to clicked button
            btn.classList.add('active');
            selectedStrategy = btn.dataset.strategy;
            
            // Setup input fields in the separate container
            setupInputFields(selectedStrategy);
        });
    });

    // Calculate button
    calculateBtn.addEventListener('click', calculateResults);
}

// Setup input fields based on strategy
function setupInputFields(strategy) {
    const inputsContainer = document.getElementById('strategyInputs');
    
    const fields = {
        profit: `
            <div class="space-y-4">
                <div class="input-group">
                    <label class="block text-sm text-gray-400 mb-1">Investment Amount ($)</label>
                    <input type="number" id="investmentAmount" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3" placeholder="Enter amount">
                </div>
                <div class="input-group">
                    <label class="block text-sm text-gray-400 mb-1">Profit Target ($)</label>
                    <input type="number" id="profitTarget" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3" placeholder="Enter target profit">
                </div>
                <button id="calculateBtn" class="calculate-btn w-full">Calculate</button>
            </div>
        `,
        price: `
            <div class="space-y-4">
                <div class="input-group">
                    <label class="block text-sm text-gray-400 mb-1">Investment Amount ($)</label>
                    <input type="number" id="investmentAmount" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3" placeholder="Enter amount">
                </div>
                <div class="input-group">
                    <label class="block text-sm text-gray-400 mb-1">Target Price ($)</label>
                    <input type="number" id="targetPrice" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3" placeholder="Enter target price">
                </div>
                <button id="calculateBtn" class="calculate-btn w-full">Calculate</button>
            </div>
        `,
        holdings: `
            <div class="space-y-4">
                <div class="input-group">
                    <label class="block text-sm text-gray-400 mb-1">Investment Amount ($)</label>
                    <input type="number" id="investmentAmount" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3" placeholder="Enter amount">
                </div>
                <div class="input-group">
                    <label class="block text-sm text-gray-400 mb-1">Target Balance ($)</label>
                    <input type="number" id="targetBalance" class="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3" placeholder="Enter target balance">
                </div>
                <button id="calculateBtn" class="calculate-btn w-full">Calculate</button>
            </div>
        `
    };

    inputsContainer.innerHTML = fields[strategy];
    inputsContainer.classList.remove('hidden');

    // Add calculate button event listener
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateResults);
    }
}

// Calculate results based on strategy
function calculateResults() {
    const investmentAmount = parseFloat(document.getElementById('investmentAmount').value);
    if (!investmentAmount || isNaN(investmentAmount)) {
        alert('Please enter a valid investment amount');
        return;
    }

    const currentPrice = selectedCrypto.current_price;
    const initialCoins = investmentAmount / currentPrice;
    let results = '';

    switch (selectedStrategy) {
        case 'profit': {
            const profitTarget = parseFloat(document.getElementById('profitTarget').value);
            if (!profitTarget || isNaN(profitTarget)) {
                alert('Please enter a valid profit target');
                return;
            }
            const profitTargetBalance = investmentAmount + profitTarget;
            const requiredPrice = profitTargetBalance / initialCoins;
            const percentageIncrease = ((requiredPrice - currentPrice) / currentPrice) * 100;

            results = `
                <div class="space-y-4">
                    <div class="stat-box">
                        <span class="stat-label">Required Price</span>
                        <span class="stat-value">$${formatNumber(requiredPrice)}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Price Increase Needed</span>
                        <span class="stat-value">${percentageIncrease.toFixed(2)}%</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Your Holdings</span>
                        <span class="stat-value">${formatNumber(initialCoins)} ${selectedCrypto.symbol.toUpperCase()}</span>
                    </div>
                </div>
            `;
            break;
        }

        case 'price': {
            const targetPrice = parseFloat(document.getElementById('targetPrice').value);
            if (!targetPrice || isNaN(targetPrice)) {
                alert('Please enter a valid target price');
                return;
            }
            const potentialValue = initialCoins * targetPrice;
            const potentialProfit = potentialValue - investmentAmount;
            const pricePercentageChange = ((targetPrice - currentPrice) / currentPrice) * 100;

            results = `
                <div class="space-y-4">
                    <div class="stat-box">
                        <span class="stat-label">Potential Value</span>
                        <span class="stat-value">$${formatNumber(potentialValue)}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Potential Profit</span>
                        <span class="stat-value">$${formatNumber(potentialProfit)}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Price Percentage Change</span>
                        <span class="stat-value">${pricePercentageChange.toFixed(2)}%</span>
                    </div>
                </div>
            `;
            break;
        }

        case 'holdings': {
            const holdingsTargetBalance = parseFloat(document.getElementById('targetBalance').value);
            if (!holdingsTargetBalance || isNaN(holdingsTargetBalance)) {
                alert('Please enter a valid target balance');
                return;
            }
            const requiredCoins = holdingsTargetBalance / currentPrice;
            const additionalInvestment = (requiredCoins - initialCoins) * currentPrice;

            results = `
                <div class="space-y-4">
                    <div class="stat-box">
                        <span class="stat-label">Required Holdings</span>
                        <span class="stat-value">${formatNumber(requiredCoins)} ${selectedCrypto.symbol.toUpperCase()}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Additional Investment Needed</span>
                        <span class="stat-value">$${formatNumber(additionalInvestment)}</span>
                    </div>
                </div>
            `;
            break;
        }
    }

    resultsContent.innerHTML = results;
    showResults();
}

// Show results
function showResults() {
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Navigation between steps
function goToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.step-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show current step
    const currentStepElement = document.getElementById(`step${stepNumber}`);
    if (currentStepElement) {
        currentStepElement.classList.remove('hidden');
        // Scroll into view smoothly
        currentStepElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Hide results when going back to earlier steps
    if (stepNumber < 3) {
        resultsSection.classList.add('hidden');
    }
    
    currentStep = stepNumber;
}

// Helper functions
function formatNumber(num) {
    if (num >= 1) {
        return num.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    return num.toFixed(8);
}

// Update the crypto selection handler
function handleCryptoSelection(cryptoId) {
    selectedCrypto = cryptoList.find(coin => coin.id === cryptoId);
    
    // Create Pokemon/MTG style card
    const card = document.getElementById('cryptoCard');
    card.innerHTML = `
        <div class="crypto-card-inner">
            <!-- Card Frame -->
            <div class="card-frame">
                <!-- Card Header -->
                <div class="card-header glass p-4 rounded-t-xl border-b border-gray-700">
                    <div class="flex items-center justify-between">
                        <h3 class="text-xl font-bold">${selectedCrypto.name}</h3>
                        <span class="text-sm font-mono bg-gray-700 px-2 py-1 rounded">
                            ${selectedCrypto.symbol.toUpperCase()}
                        </span>
                    </div>
                </div>
                
                <!-- Card Image -->
                <div class="card-image p-6 bg-gradient-to-b from-gray-800 to-gray-900 flex justify-center items-center">
                    <img src="${selectedCrypto.image}" alt="${selectedCrypto.name}" class="w-24 h-24">
                </div>
                
                <!-- Card Stats -->
                <div class="card-stats p-4 space-y-2 bg-gray-800 rounded-b-xl">
                    <div class="stat-row flex justify-between items-center">
                        <span class="text-gray-400">Rank</span>
                        <span class="font-mono">#${selectedCrypto.market_cap_rank}</span>
                    </div>
                    <div class="stat-row flex justify-between items-center">
                        <span class="text-gray-400">Price</span>
                        <span class="font-mono">$${formatNumber(selectedCrypto.current_price)}</span>
                    </div>
                    <div class="stat-row flex justify-between items-center">
                        <span class="text-gray-400">24h Change</span>
                        <span class="font-mono ${selectedCrypto.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}">
                            ${selectedCrypto.price_change_percentage_24h.toFixed(2)}%
                        </span>
                    </div>
                    <div class="stat-row flex justify-between items-center">
                        <span class="text-gray-400">Market Cap</span>
                        <span class="font-mono">$${formatNumber(selectedCrypto.market_cap)}</span>
                    </div>
                    <div class="stat-row flex justify-between items-center">
                        <span class="text-gray-400">Volume</span>
                        <span class="font-mono">$${formatNumber(selectedCrypto.total_volume)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    card.classList.remove('hidden');
}
