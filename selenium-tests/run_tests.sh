#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# run_tests.sh — Krisha Sparkles Selenium Test Runner
# Usage:
#   ./run_tests.sh              → Run all tests
#   ./run_tests.sh smoke        → Run smoke tests only
#   ./run_tests.sh store        → Run store page tests
#   ./run_tests.sh admin        → Run admin panel tests
#   ./run_tests.sh auth         → Run auth flow tests
#   ./run_tests.sh account      → Run account tests (need login)
#   ./run_tests.sh nav          → Run navigation tests
#   ./run_tests.sh headless     → Run all tests headlessly
#   ./run_tests.sh parallel     → Run tests in parallel (4 workers)
# ─────────────────────────────────────────────────────────────────

set -e

cd "$(dirname "$0")"

# Load env
export PYTHONPATH="$(pwd)"
source .env.test 2>/dev/null || true

FILTER="${1:-all}"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║        Krisha Sparkles — Selenium Test Runner             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "  Base URL : ${BASE_URL:-http://localhost:3000}"
echo "  Browser  : ${BROWSER:-chrome}"
echo "  Headless : ${HEADLESS:-false}"
echo "  Filter   : $FILTER"
echo ""

case "$FILTER" in
  smoke)
    echo "▶ Running SMOKE tests..."
    pytest -m smoke -v "$@"
    ;;
  store)
    echo "▶ Running STORE page tests..."
    pytest -m store -v "$@"
    ;;
  admin)
    echo "▶ Running ADMIN panel tests..."
    HEADLESS=true pytest -m admin -v "$@"
    ;;
  auth)
    echo "▶ Running AUTH flow tests..."
    pytest tests/store/auth/ -v "$@"
    ;;
  account)
    echo "▶ Running ACCOUNT tests (requires login)..."
    pytest -m account -v "$@"
    ;;
  nav)
    echo "▶ Running NAVIGATION tests..."
    pytest tests/test_navigation.py -v "$@"
    ;;
  headless)
    echo "▶ Running ALL tests (headless mode)..."
    HEADLESS=true pytest -v "$@"
    ;;
  parallel)
    echo "▶ Running ALL tests in parallel (4 workers)..."
    HEADLESS=true pytest -n 4 -v "$@"
    ;;
  blog)
    echo "▶ Running BLOG tests..."
    pytest tests/store/test_blog.py -v "$@"
    ;;
  checkout)
    echo "▶ Running CHECKOUT tests..."
    pytest tests/store/test_checkout.py -v "$@"
    ;;
  all|*)
    echo "▶ Running ALL tests..."
    pytest -v "$@"
    ;;
esac

echo ""
echo "✅ Tests complete! Report: reports/test_report.html"
