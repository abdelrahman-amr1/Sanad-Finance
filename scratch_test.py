import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# 1. Login
url = "https://pgrblvunsqkyvblyoalf.supabase.co/auth/v1/token?grant_type=password"
headers = {
    "Content-Type": "application/json",
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncmJsdnVuc3FreXZibHlvYWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4ODg1NjEsImV4cCI6MjA5ODQ2NDU2MX0.sq1nIFswfVDYCu7mSQMrPXVAEmqADzN-h2w-Lf2V-vQ"
}
payload = {
    "email": "abdelrahman@sanad.ai",
    "password": "Sanad2026!"
}

try:
    r = requests.post(url, json=payload, headers=headers, verify=False)
    if r.status_code == 200:
        data = r.json()
        token = data["access_token"]
        user_id = data["user"]["id"]
        print("LOGIN SUCCESS. User ID:", user_id)
        
        # 2. Query Profiles
        profile_url = f"https://pgrblvunsqkyvblyoalf.supabase.co/rest/v1/profiles?id=eq.{user_id}&select=*"
        profile_headers = {
            "Content-Type": "application/json",
            "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncmJsdnVuc3FreXZibHlvYWxmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4ODg1NjEsImV4cCI6MjA5ODQ2NDU2MX0.sq1nIFswfVDYCu7mSQMrPXVAEmqADzN-h2w-Lf2V-vQ",
            "Authorization": f"Bearer {token}"
        }
        rp = requests.get(profile_url, headers=profile_headers, verify=False)
        print("PROFILE QUERY STATUS:", rp.status_code)
        print("PROFILE RESPONSE:", rp.text)
    else:
        print("LOGIN FAILED. STATUS:", r.status_code)
        print("RESPONSE:", r.text)
except Exception as e:
    print("ERROR:", e)
