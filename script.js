// Constants for establishment types and rates
const ESTABLISHMENT_TYPES = {
    small: {
        name: "Small (1-24 rooms)",
        rate: 25
    },
    medium: {
        name: "Medium (25-50 rooms)",
        rate: 75
    },
    large: {
        name: "Large (50+ rooms)/Yacht/Island Resort",
        rate: 100
    }
};

// Initialize calculations array from localStorage
let calculations = JSON.parse(localStorage.getItem('calculations') || '[]');

// DOM Elements
const calculateButton = document.getElementById('calculateButton');
const saveButton = document.getElementById('saveButton');
const result = document.getElementById('result');
const calculationResult = document.getElementById('calculationResult');
const calculationHistory = document.getElementById('calculationHistory');

// Validation functions
function validateForm() {
    const errors = [];
    
    const establishmentName = document.getElementById('establishmentName').value;
    const establishmentType = document.querySelector('input[name="establishmentType"]:checked');
    const nights = document.getElementById('nights').value;
    const totalGuests = document.getElementById('totalGuests').value;
    const exemptedGuests = document.getElementById('exemptedGuests').value || '0';
    const tin = document.getElementById('tin').value;

    if (!establishmentName) errors.push('Establishment name is required');
    if (!establishmentType) errors.push('Please select an establishment type');
    if (!nights || nights < 1) errors.push('Number of nights must be at least 1');
    if (!totalGuests || totalGuests < 1) errors.push('Total number of guests must be at least 1');
    if (tin && !/^\d{9}$/.test(tin)) errors.push('TIN must be exactly 9 digits');
    if (parseInt(exemptedGuests) > parseInt(totalGuests)) errors.push('Exempted guests cannot exceed total guests');

    return errors;
}

// Calculate levy
function calculateLevy() {
    const errors = validateForm();
    clearErrors();

    if (errors.length > 0) {
        showErrors(errors);
        return;
    }

    const establishmentType = document.querySelector('input[name="establishmentType"]:checked').value;
    const nights = parseInt(document.getElementById('nights').value);
    const totalGuests = parseInt(document.getElementById('totalGuests').value);
    const exemptedGuests = parseInt(document.getElementById('exemptedGuests').value || '0');

    const nonExemptGuests = totalGuests - exemptedGuests;
    const rate = ESTABLISHMENT_TYPES[establishmentType].rate;
    const totalLevy = nonExemptGuests * nights * rate;

    displayResult(totalLevy);
}

// Display functions
function displayResult(totalLevy) {
    result.classList.remove('hidden');
    calculationResult.innerHTML = `
        <p>Total Levy: SCR ${totalLevy.toFixed(2)}</p>
    `;
}

function showErrors(errors) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.innerHTML = errors.map(error => `<p>${error}</p>`).join('');
    calculateButton.parentNode.insertBefore(errorDiv, calculateButton);
}

function clearErrors() {
    const errorElements = document.querySelectorAll('.error');
    errorElements.forEach(element => element.remove());
}

// Save calculation
function saveCalculation() {
    const calculation = {
        id: Date.now(),
        date: new Date().toISOString(),
        establishmentName: document.getElementById('establishmentName').value,
        establishmentType: document.querySelector('input[name="establishmentType"]:checked').value,
        nights: document.getElementById('nights').value,
        totalGuests: document.getElementById('totalGuests').value,
        exemptedGuests: document.getElementById('exemptedGuests').value || '0',
        totalLevy: parseFloat(calculationResult.textContent.match(/\d+\.\d+/)[0])
    };

    calculations.unshift(calculation);
    localStorage.setItem('calculations', JSON.stringify(calculations));
    updateHistory();
}

// Update history display
function updateHistory() {
    calculationHistory.innerHTML = calculations.map(calc => `
        <div class="calculation-item">
            <p><strong>Date:</strong> ${new Date(calc.date).toLocaleDateString()}</p>
            <p><strong>Establishment:</strong> ${calc.establishmentName}</p>
            <p><strong>Guests:</strong> ${parseInt(calc.totalGuests) - parseInt(calc.exemptedGuests)}</p>
            <p><strong>Nights:</strong> ${calc.nights}</p>
            <p><strong>Total Levy:</strong> SCR ${calc.totalLevy.toFixed(2)}</p>
            <button onclick="deleteCalculation(${calc.id})">Delete</button>
        </div>
    `).join('');
}

// Delete calculation
function deleteCalculation(id) {
    if (confirm('Are you sure you want to delete this calculation?')) {
        calculations = calculations.filter(calc => calc.id !== id);
        localStorage.setItem('calculations', JSON.stringify(calculations));
        updateHistory();
    }
}

// Event listeners
calculateButton.addEventListener('click', calculateLevy);
saveButton.addEventListener('click', saveCalculation);

// Initialize history on page load
updateHistory();
