document.addEventListener('DOMContentLoaded', function() {
    console.log("Popup DOM fully loaded and parsed");

    const saveButton = document.getElementById('saveAccountButton');

    if (saveButton) {
        saveButton.addEventListener('click', saveAccount);
    } else {
        console.error("Save button not found!");
    }

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
            console.log("Existing accounts from storage:", accounts);

            accounts.push(newAccount);

            chrome.storage.local.set({ accounts: accounts }, function() {
                if (chrome.runtime.lastError) {
                    console.error("Error saving account:", chrome.runtime.lastError.message); // Access .message for clearer error
                    alert("Error saving account. See console for details.");
                } else {
                    console.log("Account saved successfully!");
                    alert("Account saved!");

                    accountNameInput.value = '';
                    authTokenInput.value = '';
                    ct0TokenInput.value = '';

                    // On Day 3, we will call displayAccounts() here.
                }
            });
        });
    }
});