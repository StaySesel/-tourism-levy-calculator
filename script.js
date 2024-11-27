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
// Add jsPDF library in index.html first
function exportToPDF() {
    const doc = new jsPDF();
    const currentMonth = document.getElementById('exportMonth').value;
    const monthlyCalculations = calculations.filter(calc => 
        calc.date.startsWith(currentMonth)
    );

    // Add form header
    doc.setFontSize(16);
    doc.text('Tourism Environment Sustainability Levy', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Tourism Environmental Sustainability Levy Regulations, 2023', 105, 30, { align: 'center' });

    // Add form details
    doc.setFontSize(10);
    doc.text(`Month/Year: ${new Date(currentMonth).toLocaleDateString('default', { month: 'long', year: 'numeric' })}`, 20, 45);
    doc.text(`Taxpayer's Name: ${document.getElementById('establishmentName').value}`, 20, 55);
    doc.text(`Trading Name: ${document.getElementById('tradingName').value}`, 20, 65);
    doc.text(`TIN: ${document.getElementById('tin').value}`, 20, 75);

    // Add establishment type checkboxes
    doc.text('Classification of accommodation establishment:', 20, 90);
    doc.rect(20, 95, 5, 5);
    doc.text('Small', 30, 99);
    doc.rect(70, 95, 5, 5);
    doc.text('Medium', 80, 99);
    doc.rect(120, 95, 5, 5);
    doc.text('Large/Yacht/Island Resort', 130, 99);

    // Add statistics
    doc.text(`Total number of guests: ${monthlyCalculations.reduce((sum, calc) => sum + parseInt(calc.totalGuests), 0)}`, 20, 115);
    doc.text(`Number of guests exempted: ${monthlyCalculations.reduce((sum, calc) => sum + parseInt(calc.exemptedGuests || 0), 0)}`, 20, 125);
    doc.text(`Total nights: ${monthlyCalculations.reduce((sum, calc) => sum + parseInt(calc.nights), 0)}`, 20, 135);
    doc.text(`Total Levy Collected: SCR ${monthlyCalculations.reduce((sum, calc) => sum + calc.totalLevy, 0).toFixed(2)}`, 20, 145);

    // Add declaration
    doc.text('DECLARATIONS', 20, 165);
    doc.text('I _________________ declare that the particulars provided on this form are true and correct.', 20, 175);
    doc.text('Signature: _________________', 20, 190);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 200);

    // Add notes
    doc.setFontSize(8);
    doc.text('Notes:', 20, 220);
    doc.text('Small accommodation establishments means-having rooms between 1-24.', 20, 230);
    doc.text('Medium accommodation establishments means-having rooms between 25-50.', 20, 235);
    doc.text('Large accommodation establishments means- having rooms more than 50.', 20, 240);

    // Save the PDF
    doc.save(`tourism-levy-return-${currentMonth}.pdf`);
}
function exportToPDF() {
    // Create new PDF document
    const doc = new jsPDF();
    const currentMonth = document.getElementById('exportMonth').value || new Date().toISOString().slice(0, 7);

    try {
        // Add content to PDF
        doc.setFontSize(16);
        doc.text('Tourism Environment Sustainability Levy', 20, 20);
        
        // Add establishment details
        doc.setFontSize(12);
        const establishmentName = document.getElementById('establishmentName').value;
        doc.text(`Establishment: ${establishmentName}`, 20, 40);
        
        // Add levy calculations
        doc.text(`Month: ${currentMonth}`, 20, 50);
        doc.text(`Total Levy: SCR ${calculateMonthlyTotal(currentMonth)}`, 20, 60);
        
        // Save the PDF
        doc.save(`tourism-levy-${currentMonth}.pdf`);
    } catch (error) {
        alert('Error creating PDF. Please try again.');
        console.error('PDF Error:', error);
    }
}

function calculateMonthlyTotal(month) {
    return calculations
        .filter(calc => calc.date.startsWith(month))
        .reduce((sum, calc) => sum + calc.totalLevy, 0)
        .toFixed(2);
}
