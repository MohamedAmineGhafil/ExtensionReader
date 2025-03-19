"use strict";
class TableAnalyzer {
    constructor(omittedCodes) {
        this.omittedCodes = omittedCodes;
    }
    isValidFileNumber(text) {
        const pattern = /^\d+\/26\d{2}\/20\d{2}$/;
        return pattern.test(text);
    }
    analyzeTable() {
        const uniqueFilesByYear = new Map();
        const peopleCountByYear = new Map();
        const omittedCountByYear = new Map();
        const rows = Array.from(document.querySelectorAll('tr'));
        rows.forEach((row) => {
            var _a, _b;
            const cells = Array.from(row.querySelectorAll('td'));
            for (const cell of cells) {
                const text = ((_a = cell.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                if (this.isValidFileNumber(text)) {
                    const [fileNumber, code, year] = text.split('/');
                    // Initialize year data if not exists
                    if (!uniqueFilesByYear.has(year)) {
                        uniqueFilesByYear.set(year, new Set());
                    }
                    if (!peopleCountByYear.has(year)) {
                        peopleCountByYear.set(year, 0);
                    }
                    if (!omittedCountByYear.has(year)) {
                        omittedCountByYear.set(year, 0);
                    }
                    if (this.omittedCodes.includes(code)) {
                        // Count omitted files
                        omittedCountByYear.set(year, (omittedCountByYear.get(year) || 0) + 1);
                    }
                    else {
                        // Add file and increment people count
                        (_b = uniqueFilesByYear.get(year)) === null || _b === void 0 ? void 0 : _b.add(fileNumber);
                        peopleCountByYear.set(year, (peopleCountByYear.get(year) || 0) + 1);
                    }
                    break;
                }
            }
        });
        let totalFileCount = 0;
        let totalPeopleCount = 0;
        let totalOmittedCount = 0;
        const yearlyStats = {};
        uniqueFilesByYear.forEach((files, year) => {
            const fileCount = files.size;
            const peopleCount = peopleCountByYear.get(year) || 0;
            const omittedCount = omittedCountByYear.get(year) || 0;
            yearlyStats[year] = {
                fileCount,
                peopleCount,
                omittedCount
            };
            totalFileCount += fileCount;
            totalPeopleCount += peopleCount;
            totalOmittedCount += omittedCount;
        });
        return {
            totalFileCount,
            totalPeopleCount,
            totalOmittedCount,
            yearlyStats
        };
    }
}
// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'ANALYZE_TABLE') {
        try {
            const tableAnalyzer = new TableAnalyzer(message.omittedCodes || []);
            const results = tableAnalyzer.analyzeTable();
            sendResponse({ data: results });
        }
        catch (error) {
            console.error('❌ EXTENSION: Error:', error);
            sendResponse({ error: 'Failed to analyze table' });
        }
    }
    return true;
});
