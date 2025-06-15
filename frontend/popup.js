// Defining Mock Data (as if it came from the backend)
const MOCK_TWEET_DATA = [
    {
        id: "mock_tweet_001",
        text: "Hello world! This is my first mock tweet for the X Feed Simulator. #FrontendFun",
        author_name: "Mocking Bird",
        author_handle: "@mockUserDev",
        author_avatar: "https://placehold.co/48x48/007bff/ffffff/png?text=MB" // CHANGED to placehold.co
    },
    {
        id: "mock_tweet_002",
        text: "Just enjoying a lovely day coding. This extension is going to be awesome! 🎉💻",
        author_name: "Dev Enthusiast",
        author_handle: "@codeLover23",
        author_avatar: "https://placehold.co/48x48/28a745/ffffff/png?text=DE" // CHANGED to placehold.co
    },
    {
        id: "mock_tweet_003",
        text: "A slightly longer mock tweet to see how the text rendering will behave. We need to ensure that long strings of text wrap correctly and do not break the layout of our beautifully crafted custom tweet elements. Hopefully, this is long enough!",
        author_name: "Ms. Verbose",
        author_handle: "@talksalot",
        author_avatar: "https://placehold.co/48x48/ffc107/000000/png?text=MV" // CHANGED to placehold.co
    },
    {
        id: "mock_tweet_004",
        text: "Short and sweet.",
        author_name: "Concise Coder",
        author_handle: "@briefBits",
        author_avatar: "https://placehold.co/48x48/6f42c1/ffffff/png?text=CC" // CHANGED to placehold.co
    }
];

document.addEventListener('DOMContentLoaded', function() {
    console.log("Popup DOM fully loaded and parsed");

    const saveButton = document.getElementById('saveAccountButton');

    if (saveButton) {
        saveButton.addEventListener('click', saveAccount);
    } else {
        console.error("Save button not found!");
    }

    // Calling displayAccounts when the popup is loaded to show any existing accounts
    displayAccounts();

    // --- Function to save a new account ---
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
            console.log("Existing accounts from storage (before save):", accounts);

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

    // --- Function to display saved accounts ---
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
                viewButton.addEventListener('click', handleViewAccount); 

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

    // --- Function to handle account deletion ---
    function handleDeleteAccount(event) {
        const accountIdToDelete = event.target.dataset.accountId;
        console.log("Attempting to delete account with ID:", accountIdToDelete);

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

    // --- Function to handle viewing an account's feed (MOCKED) ---
    function handleViewAccount(event) {
        const accountIdToView = event.target.dataset.accountId;
        console.log("View button clicked for account ID (MOCK MODE):", accountIdToView);

        if (!accountIdToView) {
            console.error("No account ID found on view button (MOCK MODE).");
            alert("Error: Could not identify the account to view.");
            return;
        }

        chrome.storage.local.get({ accounts: [] }, function(storageData) {
            const accountToView = storageData.accounts.find(acc => acc.id === accountIdToView);
            const accountDisplayName = accountToView ? accountToView.name : `(Unknown/Mocked Account: ${accountIdToView})`;

            console.log(`Simulating feed view for account: ${accountDisplayName}.`);

            const responseData = MOCK_TWEET_DATA; // Our mock data

            console.log('Mock backend call successful. "Received" data (in popup):', responseData);

            if (responseData && responseData.length > 0) {
                chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
                    const activeTab = tabs[0];
                    if (activeTab && activeTab.id) {
                        chrome.scripting.executeScript({
                            target: { tabId: activeTab.id },
                            files: ['content.js']
                        }, () => {
                            if (chrome.runtime.lastError) {
                                console.error('popup.js: Error injecting content script:', chrome.runtime.lastError.message);
                                alert('Error injecting script. Check console. Is the page protected (e.g. chrome:// pages)? Are you on x.com?');
                                return;
                            }
                            console.log("popup.js: Content script presumed injected/already present. Sending message...");
                            chrome.tabs.sendMessage(activeTab.id, {
                                action: "displayFeed",
                                data: responseData
                            }, (responseFromContentScript) => {
                                if (chrome.runtime.lastError) {
                                    console.error("popup.js: Error sending message to content script:", chrome.runtime.lastError.message);
                                } else if (responseFromContentScript) {
                                    console.log("popup.js: Response from content script:", responseFromContentScript);
                                } else {
                                    console.log("popup.js: Message sent to content script, no specific response received (which can be normal).");
                                }
                            });
                        });
                    } else {
                        console.error("popup.js: Could not get active tab ID to inject script.");
                        alert("Error: Could not identify active tab.");
                    }
                });
            } else {
                console.error("popup.js: No MOCK_TWEET_DATA to send to content script.");
                alert("No data available to display.");
            }
        });
    }
});