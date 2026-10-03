import os
import urllib.request

BASE_URL = os.environ.get("NEXT_PUBLIC_BASE_URL", "https://crm-dashboard-shell.preview.emergentagent.com").rstrip("/")


def request(path):
    url = f"{BASE_URL}{path}"
    request = urllib.request.Request(url, headers={"User-Agent": "backend-health-check/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=15) as response:
        body = response.read().decode("utf-8")
        return response.status, response.headers.get("content-type", ""), body


def main():
    checks = ["/api", "/api/health", "/api/anything"]
    for path in checks:
        try:
            status, content_type, body = request(path)
            print(f"PASS {path}: status={status}, content_type={content_type}, body={body}")
            if status != 200 or '"ok":true' not in body:
                print(f"FINDING: unexpected health response for {path}")
        except Exception as exc:
            print(f"FINDING: request failed for {path}: {exc}")


if __name__ == "__main__":
    main()
