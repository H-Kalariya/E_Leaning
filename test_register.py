import requests, json
url = 'http://127.0.0.1:3001/api/auth/register'
payload = {'username': 'testuser_cli', 'password': 'test123', 'role': 'student'}
try:
    r = requests.post(url, json=payload)
    print('Status:', r.status_code)
    print('Headers:', r.headers.get('Content-Type'))
    print('Body:', r.text)
except Exception as e:
    print('Error:', e)
