import fs from 'fs';
import gplay from 'google-play-scraper';

// Using built-in fetch API available in Node.js v18+
const cmApps = JSON.parse(fs.readFileSync('cm_apps.json', 'utf8'));
const ctmApps = JSON.parse(fs.readFileSync('ctm_apps.json', 'utf8'));

async function fetchMinimumVersion(appType, baseUrl, customerId) {

  try {
    if (appType === 'cm') {
      let query = `query unAuthenticatedMobileSettings($customerId: UUID!) {
          companionMobileSettings(customerId: $customerId) {
            requiredAppVersion
          }
        }
      ` ;

      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          variables: { customerId: customerId }
        })
      });

      const json = await res.json();

      let requiredAppVersion = json.data?.companionMobileSettings?.requiredAppVersion;
      return requiredAppVersion || 'N/A';
    }
    else {
      const query = `query {
          versionConfig {
            oldestAcceptableControlTowerMobileVersion
            oldestRecommendedControlTowerMobileVersion
          }
        }`;

      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query
        })
      });

      const json = await res.json();

      console.log('json.data?.versionConfig?.', baseUrl, json);
      let requiredAppVersion = json.data?.versionConfig?.oldestAcceptableControlTowerMobileVersion;
      return requiredAppVersion || 'N/A';
    }
  } catch (e) {
    console.log('error', e)
    return 'N/A';
  }
}

async function fetchVersions(appType, app) {
  let androidVersion = 'N/A';
  let iosVersion = 'N/A';
  let requiredVersion = 'N/A';
  let androidUpdateDate = 'N/A';
  let iosUpdateDate = 'N/A';

  try {
    const gplayData = await gplay.app({ appId: app.androidPackage });
    androidVersion = gplayData.version;
    // Google Play updated date is available in the response
    androidUpdateDate = gplayData.updated ? new Date(gplayData.updated).toLocaleString('sv-SE', {
      timeZone: 'Europe/Stockholm',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'N/A';
  } catch (e) {
    androidVersion = 'N/A';
    androidUpdateDate = 'N/A';
  }

  try {
    const iosRes = await fetch(`https://itunes.apple.com/lookup?id=${app.iosAppId}&country=SE`);
    const iosData = await iosRes.json();
    if (iosData.resultCount > 0) {
      iosVersion = iosData.results[0].version;
      // iTunes API provides currentVersionReleaseDate
      iosUpdateDate = iosData.results[0].currentVersionReleaseDate
        ? new Date(iosData.results[0].currentVersionReleaseDate).toLocaleString('sv-SE', {
          timeZone: 'Europe/Stockholm',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
        : 'N/A';
    }
  } catch (e) {
    iosVersion = 'N/A';
    iosUpdateDate = 'N/A';
  }

  if (app.fapiBaseUrl && app.customerId) {
    requiredVersion = await fetchMinimumVersion(appType, app.fapiBaseUrl, app.customerId);
  }

  return {
    ...app,
    androidVersion,
    iosVersion,
    requiredVersion,
    androidUpdateDate,
    iosUpdateDate
  };
}

async function generateHTML() {
  const cmResults = await Promise.all(cmApps.map(app => fetchVersions('cm', app)));
  const ctmResults = await Promise.all(ctmApps.map(app => fetchVersions('ctm', app)));

  const cmRows = cmResults.map(app => `
    <tr>
      <td>${app.env}</td>
      <td>${app.name}</td>
      <td>${app.androidVersion}<br><small style="color: #666;">${app.androidUpdateDate != 'N/A' ? app.androidUpdateDate : ''}</small></td>
      <td>${app.iosVersion}<br><small style="color: #666;">${app.iosUpdateDate != 'N/A' ? app.iosUpdateDate : ''}</small></td>
      <td>${app.requiredVersion}</td>
      <td><a href="https://play.google.com/store/apps/details?id=${app.androidPackage}" target="_blank">Play Store</a></td>
      <td><a href="https://apps.apple.com/app/id${app.iosAppId}" target="_blank">App Store</a></td>
    </tr>
  `).join('');

  const ctmRows = ctmResults.map(app => `
    <tr>
      <td>${app.env}</td>
      <td>${app.name}</td>
      <td>${app.androidVersion}<br><small style="color: #666;">${app.androidUpdateDate != 'N/A' ? app.androidUpdateDate : ''}</small></td>
      <td>${app.iosVersion}<br><small style="color: #666;">${app.iosUpdateDate != 'N/A' ? app.iosUpdateDate : ''}</small></td>
      <td>${app.requiredVersion}</td>
      <td><a href="https://play.google.com/store/apps/details?id=${app.androidPackage}" target="_blank">Play Store</a></td>
      <td><a href="https://apps.apple.com/app/id${app.iosAppId}" target="_blank">App Store</a></td>
    </tr>
  `).join('');

  const now = new Date().toLocaleString('sv-SE', {
    timeZone: 'Europe/Stockholm',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>App Version Dashboard</title>
      <style>
        body { font-family: Arial; background: #f4f4f4; padding: 20px; }

        .tables-container {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .table-wrapper {
          flex: 1;
        }

        table { 
          width: 100%; 
          border-collapse: collapse; 
          background: white; 
        }

        th, td { 
          padding: 12px; 
          border: 1px solid #ddd; 
          text-align: left; 
        }

        th { 
          background: #333; 
          color: white; 
        }

        .timestamp { 
          color: #666; 
          font-size: 0.9em; 
          margin-bottom: 20px; 
        }
      </style>
      <meta http-equiv="refresh" content="200">
    </head>
    <body>
      <h1>App Version Dashboard</h1>
      <div class="timestamp">Last updated: ${now}</div>
      <div class="tables-container">
      <div class="table-wrapper">
        <h2>Companion Mobile</h2>
        <table>
          <thead>
            <tr>
              <th>Environment</th>
              <th>App Name</th>
              <th>Google Play</th>
              <th>App Store</th>
              <th>Required Version</th>
              <th>Play Link</th>
              <th>App Store Link</th>
            </tr>
          </thead>
          <tbody>${cmRows}</tbody>
        </table>
      </div>

      <div class="table-wrapper">
        <h2>Control Tower Mobile</h2>
        <table>
          <thead>
            <tr>
              <th>Environment</th>
              <th>App Name</th>
              <th>Google Play</th>
              <th>App Store</th>
              <th>Required Version</th>
              <th>Play Link</th>
              <th>App Store Link</th>
            </tr>
          </thead>
          <tbody>${ctmRows}</tbody>
        </table>
      </div>
    </div>
    </body>
    </html>
  `;

  fs.writeFileSync('output.html', html);
  console.log('✅ Dashboard generated: output.html');
}

generateHTML();
