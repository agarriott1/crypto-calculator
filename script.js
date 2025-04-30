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
document.addEventListener('DOMContentLoaded', async () => {
    initializeStarryBackground();
    try {
        const response = await fetch(COINGECKO_MARKETS_URL + QUERY_PARAMS);
        cryptoList = await response.json();
        renderCryptoDropdown(cryptoList);
        
        // Pre-select Bitcoin
        const bitcoin = cryptoList.find(coin => coin.id === 'bitcoin');
        if (bitcoin) {
            selectedCrypto = bitcoin;
            document.getElementById('cryptoSearch').value = 'Bitcoin';
            handleCryptoSelection('bitcoin');
        }
        
        setupStrategyButtons();
        setupEventListeners();
    } catch (error) {
        console.error('Error initializing app:', error);
    }
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
function renderCryptoDropdown(cryptoList) {
    const dropdownContent = document.getElementById('cryptoDropdown');
    dropdownContent.innerHTML = '';
    
    cryptoList.forEach(crypto => {
        const option = document.createElement('div');
        option.className = 'crypto-option p-3 cursor-pointer flex items-center justify-between hover:bg-opacity-10';
        option.dataset.id = crypto.id;
        option.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${crypto.image}" alt="${crypto.name}" class="w-8 h-8">
                <div>
                    <div class="font-semibold">${crypto.name}</div>
                    <div class="text-sm text-gray-400">${crypto.symbol.toUpperCase()}</div>
                </div>
            </div>
            <div class="text-right">
                <div class="font-mono">$${formatNumber(crypto.current_price)}</div>
                <div class="text-sm ${crypto.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}">
                    ${crypto.price_change_percentage_24h.toFixed(2)}%
                </div>
            </div>
        `;
        
        option.addEventListener('click', () => {
            selectedCrypto = crypto;
            handleCryptoSelection(crypto.id);
            dropdownContent.classList.add('hidden');
            document.getElementById('cryptoSearch').value = crypto.name;
        });
        
        dropdownContent.appendChild(option);
    });
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
            <div class="space-y-6">
                <div class="input-group">
                    <h3 class="text-xl text-gray-300 mb-2">INVESTMENT AMOUNT ($)</h3>
                    <div class="relative">
                        <input type="text" 
                            id="investmentAmount" 
                            class="w-full bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-4 py-3 font-mono text-xl" 
                            placeholder="0.00"
                            onkeyup="this.value = formatInputNumber(this.value)"
                            onblur="this.value = formatInputNumber(this.value)">
                    </div>
                    <div class="text-sm text-gray-500 mt-2">Enter the amount you want to invest</div>
                </div>
                <div class="input-group">
                    <h3 class="text-xl text-gray-300 mb-2">PROFIT TARGET ($)</h3>
                    <div class="relative">
                        <input type="text" 
                            id="profitTarget" 
                            class="w-full bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-4 py-3 font-mono text-xl" 
                            placeholder="0.00"
                            onkeyup="this.value = formatInputNumber(this.value)"
                            onblur="this.value = formatInputNumber(this.value)">
                    </div>
                    <div class="text-sm text-gray-500 mt-2">Enter your desired profit</div>
                </div>
                <button id="calculateBtn" class="calculate-btn w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 py-3 rounded-lg transition-all duration-200 mt-6">
                    Calculate
                </button>
            </div>
        `,
        price: `
            <div class="space-y-6">
                <div class="input-group">
                    <h3 class="text-xl text-gray-300 mb-2">INVESTMENT AMOUNT ($)</h3>
                    <div class="relative">
                        <input type="text" 
                            id="investmentAmount" 
                            class="w-full bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-4 py-3 font-mono text-xl" 
                            placeholder="0.00"
                            onkeyup="this.value = formatInputNumber(this.value)"
                            onblur="this.value = formatInputNumber(this.value)">
                    </div>
                    <div class="text-sm text-gray-500 mt-2">Enter the amount you want to invest</div>
                </div>
                <div class="input-group">
                    <h3 class="text-xl text-gray-300 mb-2">TARGET PRICE ($)</h3>
                    <div class="relative">
                        <input type="text" 
                            id="targetPrice" 
                            class="w-full bg-[#1a1a2e] border border-gray-700/50 rounded-lg px-4 py-3 font-mono text-xl" 
                            placeholder="0.00"
                            onkeyup="this.value = formatInputNumber(this.value)"
                            onblur="this.value = formatInputNumber(this.value)">
                    </div>
                    <div class="text-sm text-gray-500 mt-2">Enter your target price</div>
                </div>
                <button id="calculateBtn" class="calculate-btn w-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 py-3 rounded-lg transition-all duration-200 mt-6">
                    Calculate
                </button>
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

// Update the formatInputNumber function to handle the dollar sign
function formatInputNumber(value) {
    // Remove any non-digit characters except decimal point
    value = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Format the whole number part with commas
    const numberParts = value.split('.');
    numberParts[0] = numberParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Add dollar sign and combine whole and decimal parts
    return '$' + numberParts.join('.');
}

// Calculate results based on strategy
function calculateResults() {
    const investmentAmount = parseFloat(document.getElementById('investmentAmount').value.replace(/[$,]/g, ''));
    if (!investmentAmount || isNaN(investmentAmount)) {
        alert('Please enter a valid investment amount');
        return;
    }

    const currentPrice = selectedCrypto.current_price;
    const initialCoins = investmentAmount / currentPrice;
    let results = '';

    switch (selectedStrategy) {
        case 'profit': {
            const profitTarget = parseFloat(document.getElementById('profitTarget').value.replace(/[$,]/g, ''));
            if (!profitTarget || isNaN(profitTarget)) {
                alert('Please enter a valid profit target');
                return;
            }
            const profitTargetBalance = investmentAmount + profitTarget;
            const requiredPrice = profitTargetBalance / initialCoins;
            const percentageIncrease = ((requiredPrice - currentPrice) / currentPrice) * 100;

            results = `
                <div class="bg-[#1a1a2e] p-6 rounded-lg max-w-[600px] mx-auto">
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
                </div>
            `;
            break;
        }

        case 'price': {
            const targetPrice = parseFloat(document.getElementById('targetPrice').value.replace(/[$,]/g, ''));
            if (!targetPrice || isNaN(targetPrice)) {
                alert('Please enter a valid target price');
                return;
            }
            const potentialValue = initialCoins * targetPrice;
            const potentialProfit = potentialValue - investmentAmount;
            const pricePercentageChange = ((targetPrice - currentPrice) / currentPrice) * 100;

            results = `
                <div class="bg-[#1a1a2e] p-6 rounded-lg max-w-[600px] mx-auto">
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
    if (num >= 1e12) {
        return (num / 1e12).toFixed(2) + 'T';
    }
    if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
    }
    if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
    }
    if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
    }
    // For all other numbers, including small ones
    return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Update the crypto selection handler
function handleCryptoSelection(cryptoId) {
    selectedCrypto = cryptoList.find(coin => coin.id === cryptoId || coin.symbol.toLowerCase() === cryptoId.toLowerCase());
    if (!selectedCrypto) return;
    
    const cardDisplay = document.getElementById('cryptoCard');
    cardDisplay.innerHTML = `
        <div class="crypto-card-inner">
            <!-- Card Header -->
            <div class="card-header">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <h3 class="text-xl font-bold">${selectedCrypto.name}</h3>
                        <span class="text-sm font-mono bg-gray-700/50 px-2 py-1 rounded">
                            ${selectedCrypto.symbol.toUpperCase()}
                        </span>
                    </div>
                    <span class="text-sm font-mono bg-gray-700/50 px-2 py-1 rounded">
                        Rank #${selectedCrypto.market_cap_rank}
                    </span>
                </div>
            </div>
            
            <!-- Card Image & Price Section -->
            <div class="card-image-section">
                <div class="card-icon">
                    <img src="${selectedCrypto.image}" alt="${selectedCrypto.name}" class="w-full h-full object-contain">
                </div>
                <div class="card-price-info">
                    <div class="text-2xl font-mono font-bold">$${formatNumber(selectedCrypto.current_price)}</div>
                    <div class="text-sm ${selectedCrypto.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'} font-mono">
                        ${selectedCrypto.price_change_percentage_24h >= 0 ? '↑' : '↓'} ${Math.abs(selectedCrypto.price_change_percentage_24h).toFixed(2)}%
                    </div>
                    <div class="price-change-grid">
                        <div class="price-change-item">
                            <div class="price-change-label">1H</div>
                            <div class="price-change-value ${selectedCrypto.price_change_percentage_1h_in_currency >= 0 ? 'text-green-400' : 'text-red-400'}">
                                ${selectedCrypto.price_change_percentage_1h_in_currency?.toFixed(2) || '0.00'}%
                            </div>
                        </div>
                        <div class="price-change-item">
                            <div class="price-change-label">24H</div>
                            <div class="price-change-value ${selectedCrypto.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}">
                                ${selectedCrypto.price_change_percentage_24h?.toFixed(2)}%
                            </div>
                        </div>
                        <div class="price-change-item">
                            <div class="price-change-label">7D</div>
                            <div class="price-change-value ${selectedCrypto.price_change_percentage_7d_in_currency >= 0 ? 'text-green-400' : 'text-red-400'}">
                                ${selectedCrypto.price_change_percentage_7d_in_currency?.toFixed(2) || '0.00'}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Card Stats -->
            <div class="card-stats">
                <div class="stat-box">
                    <div class="stat-label">Market Cap</div>
                    <div class="stat-value">$${formatNumber(selectedCrypto.market_cap)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">24h Volume</div>
                    <div class="stat-value">$${formatNumber(selectedCrypto.total_volume)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">24h High</div>
                    <div class="stat-value">$${formatNumber(selectedCrypto.high_24h)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">24h Low</div>
                    <div class="stat-value">$${formatNumber(selectedCrypto.low_24h)}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Circulating Supply</div>
                    <div class="stat-value">${formatNumber(selectedCrypto.circulating_supply)} ${selectedCrypto.symbol.toUpperCase()}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Max Supply</div>
                    <div class="stat-value">${selectedCrypto.max_supply ? formatNumber(selectedCrypto.max_supply) : '∞'} ${selectedCrypto.symbol.toUpperCase()}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">All Time High</div>
                    <div class="stat-value">$${formatNumber(selectedCrypto.ath)}</div>
                    <div class="text-xs text-gray-500">${new Date(selectedCrypto.ath_date).toLocaleDateString()}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">ATH Change</div>
                    <div class="stat-value ${selectedCrypto.ath_change_percentage >= 0 ? 'text-green-400' : 'text-red-400'}">
                        ${selectedCrypto.ath_change_percentage.toFixed(2)}%
                    </div>
                </div>
            </div>
        </div>
    `;
    cardDisplay.classList.remove('hidden');
}

// Add click outside handler to close dropdown
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('cryptoDropdown');
    const searchInput = document.getElementById('cryptoSearch');
    
    if (!dropdown.contains(e.target) && e.target !== searchInput) {
        dropdown.classList.add('hidden');
    }
});

// Update search input handler
document.getElementById('cryptoSearch').addEventListener('click', () => {
    const dropdown = document.getElementById('cryptoDropdown');
    dropdown.classList.remove('hidden');
});

// Update the strategy buttons setup
function setupStrategyButtons() {
    const strategyContainer = document.querySelector('.strategy-grid');
    const strategies = [
        {
            id: 'profit',
            title: 'Profit Target',
            description: 'Calculate price needed for desired profit'
        },
        {
            id: 'price',
            title: 'Price Target',
            description: 'Calculate profit at target price'
        }
    ];
    
    strategyContainer.innerHTML = strategies.map(strategy => `
        <div class="strategy-card" data-strategy="${strategy.id}">
            <h3 class="strategy-title">${strategy.title}</h3>
            <p class="strategy-description">${strategy.description}</p>
        </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.strategy-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.strategy-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            selectedStrategy = card.dataset.strategy;
            setupInputFields(selectedStrategy);
        });
    });
}
