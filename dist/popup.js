"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const initialLoader = document.querySelector('.initial-loader');
    const mainPanel = document.querySelector('.main-panel');
    const analyzeButton = document.getElementById('analyzeButton');
    const resultsDiv = document.getElementById('results');
    const settingsBtn = document.querySelector('.settings-btn');
    const closeSettingsBtn = document.querySelector('.close-settings');
    const settingsPanel = document.querySelector('.settings-panel');
    const codeForm = document.getElementById('codeForm');
    const newCodeInput = document.getElementById('newCode');
    const codesContainer = document.querySelector('.codes-container');
    const errorMessage = document.querySelector('.error-message');
    const body = document.body;
    // Show main panel after initial load
    setTimeout(() => {
        initialLoader.style.display = 'none';
        mainPanel.style.display = 'block';
        // Set initial height of settings panel
        settingsPanel.style.height = '400px';
    }, 500);
    // Load saved settings
    function loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield chrome.storage.local.get('settings');
            return result.settings || {
                omittedCodes: [
                    '2602', '2604', '2606', '2608', '2609', '2611', '2613', '2615',
                    '2623', '2625', '2635', '2637', '2639', '2641', '2643', '2645',
                    '2701', '2702', '2703', '2704'
                ]
            };
        });
    }
    // Save settings
    function saveSettings(settings) {
        return __awaiter(this, void 0, void 0, function* () {
            yield chrome.storage.local.set({ settings });
        });
    }
    // Render codes in settings panel
    function renderCodes(codes) {
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
    codeForm.addEventListener('submit', (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        const code = newCodeInput.value;
        if (/^\d{4}$/.test(code)) {
            const settings = yield loadSettings();
            if (!settings.omittedCodes.includes(code)) {
                settings.omittedCodes.push(code);
                yield saveSettings(settings);
                renderCodes(settings.omittedCodes);
                newCodeInput.value = '';
                errorMessage.style.display = 'none';
            }
        }
        else {
            errorMessage.style.display = 'block';
        }
    }));
    // Remove code
    codesContainer.addEventListener('click', (e) => __awaiter(void 0, void 0, void 0, function* () {
        const target = e.target;
        if (target.classList.contains('remove-code')) {
            const code = target.dataset.code;
            const settings = yield loadSettings();
            settings.omittedCodes = settings.omittedCodes.filter(c => c !== code);
            yield saveSettings(settings);
            renderCodes(settings.omittedCodes);
        }
    }));
    // Analyze button click
    analyzeButton.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
        body.classList.add('loading');
        resultsDiv.innerHTML = '';
        const settings = yield loadSettings();
        const [tab] = yield chrome.tabs.query({ active: true, currentWindow: true });
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
                }
                else {
                    resultsDiv.innerHTML = '<p style="color: red;">لم يتم العثور على بيانات</p>';
                }
            });
        }
    }));
});
