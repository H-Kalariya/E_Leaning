import requests
import sys

def test_delete(filename):
    url = f"http://localhost:3001/api/notes/{filename}"
    print(f"Testing DELETE on: {url}")
    try:
        response = requests.delete(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_delete(sys.argv[1])
    else:
        print("Usage: python test_delete.py <filename>")
