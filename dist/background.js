"use strict";
// src/background.ts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'TABLE_ANALYZED') {
        console.log('Table analysis results:', message.data);
        // Handle the analyzed table data
        // You can store it, process it further, or send it to a server
    }
});
