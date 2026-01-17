import requests
import json

def test_summarize():
    url = "http://localhost:3001/api/summarize"
    payload = {
        "transcript": "Hello world. This is a test transcript about complex numbers. The square root of minus 1 is i."
    }
    headers = {"Content-Type": "application/json"}
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_summarize()
