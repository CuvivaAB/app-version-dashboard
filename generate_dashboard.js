import fs from 'fs';
import gplay from 'google-play-scraper';

// Using built-in fetch API available in Node.js v18+
const cmApps = JSON.parse(fs.readFileSync('cm_apps.json', 'utf8'));
const ctmApps = JSON.parse(fs.readFileSync('ctm_apps.json', 'utf8'));

const customerEnvMapping = {
  "SWE05": {
    customerId: "508b2c5e-85d7-4f44-b721-6dd2cd4f3c9a",
    url: "https://swe05.fapi.ck8s.cuvivapro.com/graphql"
  },
  "SWE06": {
    customerId: "6d079766-16a0-4b6d-b282-c5ce01c1e645",
    url: "https://swe06.fapi.ck8s.cuvivapro.com/graphql"
  },
  "SWE09": {
    customerId: "75aa75db-deac-4e8c-9217-7374cd3540c4",
    url: "https://swe09.fapi.ck8s.cuvivapro.com/graphql"
  },
  "SWE10": {
    customerId: "9888f685-def6-4fcb-abf1-7042a7158a90",
    url: "https://swe10.fapi.ck8s.cuvivapro.com/graphql"
  },
  "SWE12": {
    customerId: "c936e79c-d9c0-485d-90a6-ce97866115dc",
    url: "https://swe12.fapi.ck8s.cuvivapro.com/graphql"
  },
  "SWE17": {
    customerId: "78bf483e-a81f-4c8d-9619-79c859c87275",
    url: "https://swe17.fapi.ck8s.cuvivapro.com/graphql"
  },
  "SWE18": {
    customerId: "6a83ed6a-42af-4aec-939c-97f1df176a74",
    url: "https://swe18.fapi.ck8s.cuvivapro.com/graphql"
  },
  "SWE20": {
    customerId: "7cfad80c-62bc-48ef-8792-4d4a0ca3b59f",
    url: "https://swe20.fapi.ck8s.cuvivapro.com/graphql"
  },
  "SWE21": {
    customerId: "342285c8-9e14-4fd8-b5dc-a26847d7594a",
    url: "https://swe21.fapi.ck8s.cuvivapro.com/graphql"
  },
  "SWE22": {
    customerId: "164c44cc-ccb0-4c3c-94fb-d71016da6e88",
    url: "https://swe22.fapi.ck8s.cuvivapro.com/graphql"
  },
  "SWE23": {
    customerId: "e59cd4d0-ee0f-44e1-bdeb-9a8366738803",
    url: "https://swe23.fapi.ck8s.cuvivapro.com/graphql"
  },
  "SWE24": {
    customerId: "54731e7a-24bb-4f06-a97e-cd6697dbda89",
    url: "https://swe24.fapi.ck8s.cuvivapro.com/graphql"
  },
  "SWE25": {
    customerId: "ad78cc98-8d1c-497a-ab80-caaa93ede5a4",
    url: "https://swe25.fapi.ck8s.cuvivapro.com/graphql"
  },
  "SWE26": {
    customerId: "36980b95-8b94-4077-86bb-1e79895a6a6e",
    url: "https://swe26.fapi.ck8s.cuvivapro.com/graphql"
  },
  "SWE27": {
    customerId: "8cee4d07-cecf-4ecf-a10e-aa3b87faf7c7",
    url: "https://swe27.fapi.ck8s.cuvivapro.com/graphql"
  },
  "SWE28": {
    customerId: "7a5b5151-294f-4a34-bc4c-9c31b72692b1",
    url: "https://swe28.fapi.ck8s.cuvivapro.com/graphql"
  }
};

async function fetchMinimumVersion(customer) {
  const query = `
    query unAuthenticatedMobileSettings($customerId: UUID!) {
      companionMobileSettings(customerId: $customerId) {
        requiredAppVersion
      }
    }
  `;

  try {
    const res = await fetch(customer.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Add Authorization if needed
      },
      body: JSON.stringify({
        query,
        variables: { customerId: customer.customerId }
      })
    });

    const json = await res.json();
    return json.data?.companionMobileSettings?.requiredAppVersion || 'N/A';
  } catch (e) {
    return 'Fetch Error';
  }
}

async function fetchVersions(app ,includeRequiredVersion = true) {
  let androidVersion = 'Error';
  let iosVersion = 'Error';
  let requiredVersion = 'Error';
  let androidUpdateDate = 'Error';
  let iosUpdateDate = 'Error';

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
    androidVersion = 'Fetch Error';
    androidUpdateDate = 'Fetch Error';
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
    iosVersion = 'Fetch Error';
    iosUpdateDate = 'Fetch Error';
  }

  if(includeRequiredVersion) {
    requiredVersion = await fetchMinimumVersion(customerEnvMapping[app.env]);
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
  const cmResults = await Promise.all(cmApps.map(app => fetchVersions(app)));
  const ctmResults = await Promise.all(ctmApps.map(app => fetchVersions(app, false)));

  const cmRows = cmResults.map(app => `
    <tr>
      <td>${app.env}</td>
      <td>${app.name}</td>
      <td>${app.androidVersion}<br><small style="color: #666;">${app.androidUpdateDate}</small></td>
      <td>${app.iosVersion}<br><small style="color: #666;">${app.iosUpdateDate}</small></td>
      <td>${app.requiredVersion}</td>
      <td><a href="https://play.google.com/store/apps/details?id=${app.androidPackage}" target="_blank">Play Store</a></td>
      <td><a href="https://apps.apple.com/app/id${app.iosAppId}" target="_blank">App Store</a></td>
    </tr>
  `).join('');

  const ctmRows = ctmResults.map(app => `
    <tr>
      <td>${app.env}</td>
      <td>${app.name}</td>
      <td>${app.androidVersion}<br><small style="color: #666;">${app.androidUpdateDate}</small></td>
      <td>${app.iosVersion}<br><small style="color: #666;">${app.iosUpdateDate}</small></td>
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
        table { width: 100%; border-collapse: collapse; background: white; }
        th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
        th { background: #333; color: white; }
        .timestamp { color: #666; font-size: 0.9em; margin-bottom: 20px; }
      </style>
      <meta http-equiv="refresh" content="200">
    </head>
    <body>
      <h1>App Version Dashboard</h1>
      <div class="timestamp">Last updated: ${now}</div>
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
      <h2>Control Tower Mobile</h2>
      <table>
        <thead>
          <tr>
            <th>Environment</th>
            <th>App Name</th>
            <th>Google Play</th>
            <th>App Store</th>
            <th>Play Link</th>
            <th>App Store Link</th>
          </tr>
        </thead>
        <tbody>${ctmRows}</tbody>
      </table>
    </body>
    </html>
  `;

  fs.writeFileSync('output.html', html);
  console.log('✅ Dashboard generated: output.html');
}

generateHTML();
