// frontend/popup.js

// MOCK_TWEET_DATA is no longer the primary source but can be kept for fallback/testing if desired,
// or removed completely if you're confident in the backend.
// For now, let's comment it out to ensure we're using the API.
/*
const MOCK_TWEET_DATA = [
    { // ... your mock data ... }
];
*/

document.addEventListener('DOMContentLoaded', function() {
    console.log("Popup DOM fully loaded and parsed");

    const saveButton = document.getElementById('saveAccountButton');
    if (saveButton) {
        saveButton.addEventListener('click', saveAccount);
    } else {
        console.error("Save button not found!");
    }

    displayAccounts();

    function saveAccount() {
        console.log("Save Account button clicked");
        const accountNameInput = document.getElementById('accountName');
        const authTokenInput = document.getElementById('authToken');
        const ct0TokenInput = document.getElementById('ct0Token');

        const accountName = accountNameInput.value.trim();
        const authToken = authTokenInput.value.trim();
        const ct0Token = ct0TokenInput.value.trim();

        if (!accountName || !authToken || !ct0Token) {
            alert("Please fill in all account fields.");
            return;
        }
        const newAccount = {
            name: accountName,
            auth_token: authToken,
            ct0: ct0Token,
            id: `acc_${Date.now()}`
        };
        console.log("New account details:", newAccount);

        chrome.storage.local.get({ accounts: [] }, function(data) {
            const accounts = data.accounts;
            accounts.push(newAccount);
            chrome.storage.local.set({ accounts: accounts }, function() {
                if (chrome.runtime.lastError) {
                    console.error("Error saving account:", chrome.runtime.lastError.message);
                    alert("Error saving account. See console for details.");
                } else {
                    console.log("Account saved successfully!");
                    alert("Account saved!");
                    accountNameInput.value = '';
                    authTokenInput.value = '';
                    ct0TokenInput.value = '';
                    displayAccounts();
                }
            });
        });
    }

    function displayAccounts() {
        console.log("Attempting to display accounts");
        const accountListDiv = document.getElementById('account-list');
        if (!accountListDiv) {
            console.error("Account list div not found!");
            return;
        }
        accountListDiv.innerHTML = '';
        chrome.storage.local.get({ accounts: [] }, function(data) {
            const accounts = data.accounts;
            console.log("Accounts retrieved for display:", accounts);
            if (accounts.length === 0) {
                accountListDiv.textContent = 'No accounts saved yet.';
                return;
            }
            const ul = document.createElement('ul');
            ul.className = 'accounts-ul';
            accounts.forEach(account => {
                const li = document.createElement('li');
                li.className = 'account-item';
                const accountNameSpan = document.createElement('span');
                accountNameSpan.className = 'account-name';
                accountNameSpan.textContent = account.name;
                const viewButton = document.createElement('button');
                viewButton.textContent = 'View';
                viewButton.className = 'view-button';
                viewButton.dataset.accountId = account.id;
                viewButton.addEventListener('click', handleViewAccount); // Now calls async function
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.className = 'delete-button';
                deleteButton.dataset.accountId = account.id;
                deleteButton.addEventListener('click', handleDeleteAccount);
                li.appendChild(accountNameSpan);
                li.appendChild(viewButton);
                li.appendChild(deleteButton);
                ul.appendChild(li);
            });
            accountListDiv.appendChild(ul);
        });
    }

    function handleDeleteAccount(event) {
        const accountIdToDelete = event.target.dataset.accountId;
        if (!accountIdToDelete) {
            console.error("No account ID found on delete button.");
            return;
        }
        if (!confirm("Are you sure you want to delete this account?")) {
            return;
        }
        chrome.storage.local.get({ accounts: [] }, function(data) {
            let accounts = data.accounts;
            const updatedAccounts = accounts.filter(account => account.id !== accountIdToDelete);
            chrome.storage.local.set({ accounts: updatedAccounts }, function() {
                if (chrome.runtime.lastError) {
                    console.error("Error deleting account:", chrome.runtime.lastError.message);
                    alert("Error deleting account. See console.");
                } else {
                    console.log("Account deleted successfully:", accountIdToDelete);
                    alert("Account deleted!");
                    displayAccounts();
                }
            });
        });
    }

    // MODIFIED for Integration: Now async and uses fetch
    async function handleViewAccount(event) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) loadingIndicator.style.display = 'block';

        let responseData = null; // Initialize responseData for the current operation
        let selectedFeedTypeForMessage = 'Following'; // Default for messaging

        try {
            const accountIdToView = event.target.dataset.accountId;
            if (!accountIdToView) {
                alert("Error: Could not identify the account to view.");
                throw new Error("No account ID found on view button.");
            }
            console.log("View button clicked for account ID:", accountIdToView);

            const feedTypeSelect = document.getElementById('feedType');
            selectedFeedTypeForMessage = feedTypeSelect ? feedTypeSelect.value : 'Following';
            console.log("Selected feed type in UI:", selectedFeedTypeForMessage);

            // Promisify chrome.storage.local.get to use await
            const storageData = await new Promise(resolve => {
                chrome.storage.local.get({ accounts: [] }, data => resolve(data));
            });

            const accountToView = storageData.accounts.find(acc => acc.id === accountIdToView);
            if (!accountToView) {
                alert("Error: Account details not found.");
                throw new Error(`Account not found in storage for ID: ${accountIdToView}`);
            }
            if (!accountToView.auth_token || !accountToView.ct0) {
                alert("Error: Account authentication tokens are missing. Please re-save the account with valid tokens.");
                throw new Error("Authentication tokens missing for the selected account.");
            }
            
            const accountDisplayName = accountToView.name;
            console.log(`Preparing to fetch '${selectedFeedTypeForMessage}' feed for account: ${accountDisplayName}.`);

            const backendBaseUrl = 'http://127.0.0.1:5000'; // Make sure this matches Person A's server
            let endpoint = '';

            // Your backend expects 'for_you' or 'following' for the internal feed_type param.
            // The dropdown value is "ForYou" or "Following".
            if (selectedFeedTypeForMessage === 'ForYou') {
                endpoint = '/get_for_you_feed';
            } else { // Default to "Following"
                endpoint = '/get_following_feed'; // Match backend route
            }
            const fullApiUrl = backendBaseUrl + endpoint;

            console.log(`Fetching from API: ${fullApiUrl}`);
            const apiResponse = await fetch(fullApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    auth_token: accountToView.auth_token,
                    ct0: accountToView.ct0
                })
            });

            if (!apiResponse.ok) {
                let errorFromServer = `Server responded with status: ${apiResponse.status} ${apiResponse.statusText}`;
                try {
                    const errorJson = await apiResponse.json();
                    errorFromServer = errorJson.error || errorFromServer; // Use backend's error message if available
                } catch (e) {
                    console.warn("Could not parse error response as JSON from server.", e);
                }
                alert(`Error fetching feed: ${errorFromServer}`);
                throw new Error(errorFromServer);
            }

            responseData = await apiResponse.json();
            console.log(`Successfully received data from backend for '${selectedFeedTypeForMessage}':`, responseData);

        } catch (error) {
            console.error("Error in handleViewAccount:", error.message);
            // Alert for specific fetch failure
            if (error.message.includes("Failed to fetch")) { // Generic network error
                 alert(`Network Error: Could not connect to the backend at ${'http://127.0.0.1:5000'}. Is the server running and CORS enabled?`);
            } else if (!error.message.startsWith("Server responded with status")) { // Avoid double alerting if already handled
                 // General error alerts are handled by specific error messages thrown above
            }
            responseData = null; // Ensure responseData is null or empty on error
        } finally {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }

        // Proceed to send data (or null if error) to content script
        if (responseData) { // Check if responseData is not null (implies success or at least some data)
            if (responseData.length === 0) {
                console.log("Received an empty list of tweets from the backend.");
                // Optionally, you could send this empty array to content.js to display "No tweets"
                // or handle it directly here with an alert. Let's send it for now.
            }
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                const activeTab = tabs[0];
                if (activeTab && activeTab.id) {
                    chrome.scripting.executeScript({
                        target: { tabId: activeTab.id },
                        files: ['content.js']
                    }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('popup.js: Error injecting content script:', chrome.runtime.lastError.message);
                            alert('Error injecting script into the page. Check console.');
                            return;
                        }
                        console.log("popup.js: Content script injected. Sending message with feed type:", selectedFeedTypeForMessage);
                        chrome.tabs.sendMessage(activeTab.id, {
                            action: "displayFeed",
                            feedType: selectedFeedTypeForMessage,
                            data: responseData // This could be an empty array
                        }, (responseFromContentScript) => {
                            if (chrome.runtime.lastError) {
                                console.warn("popup.js: Error sending message or no response from content script:", chrome.runtime.lastError.message);
                            } else if (responseFromContentScript) {
                                console.log("popup.js: Response from content script:", responseFromContentScript);
                            } else {
                                console.log("popup.js: Message sent to content script, no specific response payload.");
                            }
                        });
                    });
                } else {
                    console.error("popup.js: Could not get active tab ID.");
                    alert("Error: Could not identify active tab to inject script.");
                }
            });
        } else {
            console.error("popup.js: No data to send to content script due to an earlier error or empty response not handled as 'data'.");
            // Alert for no data was likely handled in the catch block already.
        }
    }
});