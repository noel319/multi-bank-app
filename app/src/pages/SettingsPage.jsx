// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAppData } from '../contexts/AppDataContext';
import { useAuth } from '../contexts/AuthContext'; // For Google Sign-In UI
import Button from '../components/Core/Button';

const SettingsPage = () => {
  const { settings, updateSetting, createNewYearSpreadsheet } = useAppData();
  const { user: googleUser } = useAuth(); // From frontend Google Sign-In

  const [currentGSheetId, setCurrentGSheetId] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear() + 1);

  useEffect(() => {
    setCurrentGSheetId(settings.current_year_gsheet_id || '');
  }, [settings.current_year_gsheet_id]);

  const handleSheetIdSave = () => {
    updateSetting('current_year_gsheet_id', currentGSheetId);
    alert('Google Sheet ID saved!');
  };

  const handleCreateNewYearFile = async () => {
    if (!googleUser || !googleUser.tokenData) { // Assuming tokenData is stored on user object after sign-in
        alert("Please sign in with Google first via the header button to authorize Google Sheets access.");
        // In a real app, you'd trigger the Google OAuth flow from AuthContext more robustly here
        // or check if tokens are already stored securely.
        return;
    }
    // THIS IS A SIMPLIFICATION. In a real app, googleUser.tokenData might not be the raw JSON string
    // needed by the Python backend. You need to ensure the `tokens_json_string` sent to Python
    // is what `google.oauth2.credentials.Credentials.from_authorized_user_info` expects.
    // The frontend Google Sign-In primarily gives an ID token or access token for client-side calls.
    // For server-side/Python backend access, you often need an authorization code flow to get
    // a refresh token that the backend can use.
    // For now, let's assume you have a way to get the full credential JSON.
    
    // const googleAuthTokensJson = JSON.stringify(googleUser.tokenData); // Highly dependent on your OAuth setup

    alert("New Year GSheet creation requires securely passing Google Auth tokens to the Python backend. This part needs robust OAuth handling. See console for details.");
    console.warn("TODO: Implement secure Google OAuth token retrieval and passing for createNewYearSpreadsheet.");
    console.log("User info from frontend auth:", googleUser);
    
    // Example call (won't work without proper token string):
    // const result = await createNewYearSpreadsheet(newYear, "PLACEHOLDER_GOOGLE_TOKENS_JSON_STRING");
    // if (result) {
    //   setCurrentGSheetId(result.spreadsheetId);
    // }
  };

  const handleBankApiSetup = (accountId) => {
    // This would open a modal or new view to:
    // 1. Guide user through Plaid Link / Fintoc Widget (rendered in an iframe or new Electron window).
    // 2. On success, the widget gives a public_token.
    // 3. Send public_token to Python backend to exchange for access_token & item_id.
    // 4. Python backend securely stores access_token (OS keychain) and saves item_id to account in SQLite.
    alert(`Bank API setup for account ${accountId} would start here. This involves secure OAuth with a bank aggregator.`);
  };
  
  const handleManualBankSync = (accountId) => {
    // This is a placeholder. Real sync needs secure access token retrieval.
    alert(`Manual sync for account ${accountId} initiated. This is a placeholder.`);
    // In real app, you'd retrieve the secure token and call:
    // useAppData().syncBankAccount(accountId, 'SECURELY_RETRIEVED_ACCESS_TOKEN');
  };


  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Application Settings</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-slate-700 mb-3">Google Sheets Integration</h2>
        <div className="mb-4">
          <label htmlFor="gsheetId" className="block text-sm font-medium text-slate-700 mb-1">
            Current Year Google Sheet ID:
          </label>
          <input
            type="text"
            id="gsheetId"
            value={currentGSheetId}
            onChange={(e) => setCurrentGSheetId(e.target.value)}
            placeholder="Enter Google Sheet File ID"
            className="w-full md:w-1/2 px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <Button onClick={handleSheetIdSave} variant="primary">Save Sheet ID</Button>
        
        <div className="mt-6 pt-4 border-t">
            <h3 className="text-lg font-medium text-slate-700 mb-2">New Year File</h3>
            <div className="flex items-center gap-2">
                <input type="number" value={newYear} onChange={e => setNewYear(parseInt(e.target.value))} className="w-24 px-3 py-2 border border-slate-300 rounded-md"/>
                <Button onClick={handleCreateNewYearFile} variant="secondary">Create Google Sheet for {newYear}</Button>
            </div>
             <p className="text-xs text-slate-500 mt-1">Requires Google Sign-In (via header) to authorize access.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-slate-700 mb-3">Bank Account API (Conceptual)</h2>
        <p className="text-sm text-slate-600 mb-4">
          Connect your bank accounts via a secure aggregator (e.g., Plaid, Fintoc) to enable automatic transaction fetching and balance updates.
          This requires setting up developer accounts with these services.
        </p>
        {/* List accounts and provide a "Connect" or "Sync" button */}
        {/* This UI would be more elaborate */}
        <div className="space-y-2">
            <Button onClick={() => handleBankApiSetup('some_account_id')} variant="primary">Connect Bank Account (Example)</Button>
            <Button onClick={() => handleManualBankSync('some_account_id')} variant="secondary">Manual Sync (Example)</Button>
        </div>
         <p className="text-xs text-slate-500 mt-2">Secure token management and API calls handled by Python backend.</p>
      </div>
    </div>
  );
};

export default SettingsPage;