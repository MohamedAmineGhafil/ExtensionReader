// src/popup.ts
interface Settings {
    omittedCodes: string[];
}

document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const initialLoader = document.querySelector('.initial-loader') as HTMLDivElement;
    const mainPanel = document.querySelector('.main-panel') as HTMLDivElement;
    const analyzeButton = document.getElementById('analyzeButton') as HTMLButtonElement;
    const resultsDiv = document.getElementById('results') as HTMLDivElement;
    const settingsBtn = document.querySelector('.settings-btn') as HTMLButtonElement;
    const closeSettingsBtn = document.querySelector('.close-settings') as HTMLButtonElement;
    const settingsPanel = document.querySelector('.settings-panel') as HTMLDivElement;
    const codeForm = document.getElementById('codeForm') as HTMLFormElement;
    const newCodeInput = document.getElementById('newCode') as HTMLInputElement;
    const codesContainer = document.querySelector('.codes-container') as HTMLDivElement;
    const errorMessage = document.querySelector('.error-message') as HTMLDivElement;
    const body = document.body;

    // Show main panel after initial load
    setTimeout(() => {
        initialLoader.style.display = 'none';
        mainPanel.style.display = 'block';
        // Set initial height of settings panel
        settingsPanel.style.height = '400px';
    }, 500);

    // Load saved settings
    async function loadSettings(): Promise<Settings> {
        const result = await chrome.storage.local.get('settings');
        return result.settings || { 
            omittedCodes: [
                '2602', '2604', '2606', '2608', '2609', '2611', '2613', '2615',
                '2623', '2625', '2635', '2637', '2639', '2641', '2643', '2645',
                '2701', '2702', '2703', '2704'
            ]
        };
    }

    // Save settings
    async function saveSettings(settings: Settings) {
        await chrome.storage.local.set({ settings });
    }

    // Render codes in settings panel
    function renderCodes(codes: string[]) {
        codesContainer.innerHTML = codes.map(code => `
            <div class="code-tag">
                <span>${code}</span>
                <span class="remove-code" data-code="${code}">✕</span>
            </div>
        `).join('');
    }

    // Initialize settings
    loadSettings().then(settings => {
        renderCodes(settings.omittedCodes);
    });

    // Settings button click
    settingsBtn.addEventListener('click', () => {
        mainPanel.style.display = 'none';
        settingsPanel.classList.add('active');
        body.style.minHeight = '400px';
    });

    // Close settings button click
    closeSettingsBtn.addEventListener('click', () => {
        settingsPanel.classList.remove('active');
        mainPanel.style.display = 'block';
        body.style.minHeight = '';
    });

    // Handle form submission (both button click and enter key)
    codeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = newCodeInput.value;
        if (/^\d{4}$/.test(code)) {
            const settings = await loadSettings();
            if (!settings.omittedCodes.includes(code)) {
                settings.omittedCodes.push(code);
                await saveSettings(settings);
                renderCodes(settings.omittedCodes);
                newCodeInput.value = '';
                errorMessage.style.display = 'none';
            }
        } else {
            errorMessage.style.display = 'block';
        }
    });

    // Remove code
    codesContainer.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('remove-code')) {
            const code = target.dataset.code;
            const settings = await loadSettings();
            settings.omittedCodes = settings.omittedCodes.filter(c => c !== code);
            await saveSettings(settings);
            renderCodes(settings.omittedCodes);
        }
    });

    // Analyze button click
    analyzeButton.addEventListener('click', async () => {
        body.classList.add('loading');
        resultsDiv.innerHTML = '';

        const settings = await loadSettings();
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { 
                action: 'ANALYZE_TABLE',
                omittedCodes: settings.omittedCodes
            }, (response) => {
                body.classList.remove('loading');
                
                if (response && response.data) {
                    const { totalFileCount, totalPeopleCount, totalOmittedCount, yearlyStats } = response.data;
                    
                    let html = `
                        <div class="totals">
                            <div class="bold">عدد المعتقلين: ${totalPeopleCount}</div>
                            <div class="bold">عدد الملفات: ${totalFileCount}</div>
                            <div class="bold">عدد الملفات غير ذات صلة: ${totalOmittedCount}</div>
                        </div>
                    `;
                    
                    const years = Object.keys(yearlyStats).sort((a, b) => parseInt(b) - parseInt(a));
                    
                    years.forEach(year => {
                        const stats = yearlyStats[year];
                        html += `
                            <div class="year-stats">
                                سنة ${year}: 
                                <span class="bold">معتقلين ${stats.peopleCount}</span>، 
                                <span class="bold">ملفات ${stats.fileCount}</span>، 
                                <span class="bold">غير ذات صلة ${stats.omittedCount}</span>
                            </div>
                        `;
                    });

                    resultsDiv.innerHTML = html;
                } else {
                    resultsDiv.innerHTML = '<p style="color: red;">لم يتم العثور على بيانات</p>';
                }
            });
        }
    });
});