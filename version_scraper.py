import json
import requests
from bs4 import BeautifulSoup

def get_google_play_version(package_name):
    url = f"https://play.google.com/store/apps/details?id={package_name}&hl=en&gl=SE"
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(url, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')
    try:
        print(str(response.text))
        with open("google_play_response.html", "w") as f:
          json.dump(str(response.text), f, indent=2)

        classes = soup.find_all('div', class_='hAyfc')
        version = classes[3].find('span', class_='htlgb').text
        return version.strip()
    except Exception as e:
        return f"Error: {e}"

def get_app_store_version(app_id):
    url = f"https://itunes.apple.com/lookup?id={app_id}&country=SE"
    response = requests.get(url)
    data = response.json()
    try:
        return data["results"][0]["version"]
    except Exception as e:
        return f"Error: {e}"

apps = json.load(open("apps.json"))
results = []

for app in apps:
    android_version = get_google_play_version(app["androidPackage"])
    ios_version = get_app_store_version(app["iosAppId"])
    results.append({
        "name": app["name"],
        "googlePlayVersion": android_version,
        "appStoreVersion": ios_version
    })

with open("version_data.json", "w") as f:
    print('\n' + str(results))
    json.dump(results, f, indent=2)