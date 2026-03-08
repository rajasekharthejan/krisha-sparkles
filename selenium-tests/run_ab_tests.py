#!/usr/bin/env python3
"""
CLI runner for A/B Testing flows (F234-F245).
Usage: python run_ab_tests.py [--headless] [--url URL]
"""
import sys
import os
import queue

# Load .env.test
from dotenv import load_dotenv
load_dotenv(".env.test")

from flow_registry import ALL_FLOWS
from flow_runner import FlowRunner


def main():
    headless = "--headless" in sys.argv
    base_url = os.getenv("BASE_URL", "https://shopkrisha.com")

    # Allow --url override
    for i, arg in enumerate(sys.argv):
        if arg == "--url" and i + 1 < len(sys.argv):
            base_url = sys.argv[i + 1]

    # Filter to A/B testing flows (F234-F245)
    ab_flows = [f for f in ALL_FLOWS if f.category == "A/B Testing"]

    if not ab_flows:
        print("ERROR: No A/B Testing flows found in registry!")
        sys.exit(1)

    print(f"\n{'='*70}")
    print(f"  A/B TESTING TEST SUITE — F234-F245")
    print(f"  Target: {base_url}")
    print(f"  Headless: {headless}")
    print(f"  Flows: {len(ab_flows)}")
    print(f"{'='*70}\n")

    result_queue = queue.Queue()
    runner = FlowRunner(
        flows=ab_flows,
        result_queue=result_queue,
        base_url=base_url,
        headless=headless,
    )

    runner.start()

    results = []
    flow_idx = 0
    done = False

    while not done:
        try:
            msg = result_queue.get(timeout=120)
        except queue.Empty:
            print("TIMEOUT: No response from test runner for 120s")
            break

        if msg["type"] == "step":
            print(f"  {msg['step']}")
        elif msg["type"] == "result":
            flow = ab_flows[flow_idx] if flow_idx < len(ab_flows) else None
            fid = flow.id if flow else f"F{234 + flow_idx}"
            status = "PASS" if msg["passed"] else "FAIL"
            icon = "\u2705" if msg["passed"] else "\u274c"
            print(f"\n{icon} [{status}] {fid}: {msg['message']} ({msg['duration']}s)")
            results.append({
                "id": fid,
                "name": flow.name if flow else "?",
                "passed": msg["passed"],
                "message": msg["message"],
                "duration": msg["duration"],
            })
            flow_idx += 1
        elif msg["type"] == "error":
            print(f"\n\u274c ERROR: {msg['message']}")
        elif msg["type"] == "done":
            done = True

    # Summary
    passed = sum(1 for r in results if r["passed"])
    failed = sum(1 for r in results if not r["passed"])
    total = len(results)

    print(f"\n{'='*70}")
    print(f"  RESULTS: {passed}/{total} passed, {failed} failed")
    print(f"{'='*70}")
    for r in results:
        icon = "\u2705" if r["passed"] else "\u274c"
        print(f"  {icon} {r['id']}: {r['name']}")
        if not r["passed"]:
            print(f"       Reason: {r['message']}")
    print(f"{'='*70}\n")

    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
