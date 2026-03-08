#!/usr/bin/env bash
# =============================================================================
# run_all.sh — Krisha Sparkles E2E Suite Runner
# =============================================================================
# Runs all 12 bot flows sequentially; prints a colour-coded summary table.
#
# Usage:
#   cd selenium-tests
#   ./run_all.sh                # headless (default)
#   ./run_all.sh --headed       # visible browser for all flows
#   ./run_all.sh --slow         # slow-motion for all flows
#   ./run_all.sh --flows 3,5,11 # run only FLOW-03, FLOW-05, FLOW-11
#   ./run_all.sh --skip 1,2     # skip FLOW-01 and FLOW-02
#
# Exit code:
#   0  All flows passed
#   1  One or more flows failed
# =============================================================================

set -euo pipefail

# ── colours ───────────────────────────────────────────────────────────────────
R="\033[0m"
BOLD="\033[1m"
DIM="\033[2m"
G="\033[92m"
RED="\033[91m"
Y="\033[93m"
B="\033[94m"
CYAN="\033[96m"

# ── helpers ───────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"
PYTHON=""

find_python() {
    for candidate in "$VENV_DIR/bin/python" "$VENV_DIR/Scripts/python.exe" \
                     "$(command -v python3 2>/dev/null)" "$(command -v python 2>/dev/null)"; do
        if [[ -x "$candidate" ]]; then
            PYTHON="$candidate"
            return 0
        fi
    done
    echo -e "${RED}❌  Python not found. Create a venv first:${R}"
    echo -e "    cd selenium-tests && python -m venv .venv && source .venv/bin/activate"
    echo -e "    pip install playwright python-dotenv requests"
    echo -e "    playwright install chromium"
    exit 1
}

# ── flow definitions: "FLOW_NUM|LABEL|SCRIPT_NAME" ───────────────────────────
declare -a ALL_FLOWS=(
    "01|Checkout Flow            |e2e_checkout_bot.py"
    "02|Order + Loyalty Points   |e2e_order_bot.py"
    "03|Customer Registration    |e2e_registration_bot.py"
    "04|Product Browse+Search    |e2e_shop_browse_bot.py"
    "05|Cart Operations          |e2e_cart_bot.py"
    "06|Admin Product CRUD       |e2e_admin_products_bot.py"
    "07|Admin Inventory Mgmt     |e2e_admin_inventory_bot.py"
    "08|Coupon at Checkout       |e2e_coupon_bot.py"
    "09|Bundle Add to Cart       |e2e_bundles_bot.py"
    "10|Back-in-Stock Subscribe  |e2e_back_in_stock_bot.py"
    "11|Admin Dashboard + Orders |e2e_admin_orders_bot.py"
    "12|Blog Browse              |e2e_blog_bot.py"
)

# ── parse args ────────────────────────────────────────────────────────────────
EXTRA_ARGS=""
RUN_ONLY=""     # comma-separated flow numbers to include (e.g. "3,5,11")
SKIP_FLOWS=""   # comma-separated flow numbers to skip   (e.g. "1,2")

while [[ $# -gt 0 ]]; do
    case "$1" in
        --headed) EXTRA_ARGS="$EXTRA_ARGS --headed" ;;
        --slow)   EXTRA_ARGS="$EXTRA_ARGS --slow"   ;;
        --flows)  shift; RUN_ONLY="$1"              ;;
        --skip)   shift; SKIP_FLOWS="$1"            ;;
        -h|--help)
            sed -n '3,20p' "$0" | sed 's/^# //; s/^#//'
            exit 0 ;;
        *) echo -e "${RED}Unknown option: $1${R}"; exit 1 ;;
    esac
    shift
done

# ── resolve python ────────────────────────────────────────────────────────────
find_python
echo -e "${DIM}Python: $PYTHON${R}"

# ── build run list ────────────────────────────────────────────────────────────
declare -a RUN_LIST=()
for flow_def in "${ALL_FLOWS[@]}"; do
    flow_num="${flow_def%%|*}"
    num_int="${flow_num#0}"   # strip leading zero for comparison

    # --flows filter
    if [[ -n "$RUN_ONLY" ]]; then
        match=false
        IFS=',' read -ra only_list <<< "$RUN_ONLY"
        for n in "${only_list[@]}"; do
            [[ "$n" == "$num_int" || "$n" == "$flow_num" ]] && match=true && break
        done
        $match || continue
    fi

    # --skip filter
    if [[ -n "$SKIP_FLOWS" ]]; then
        skip=false
        IFS=',' read -ra skip_list <<< "$SKIP_FLOWS"
        for n in "${skip_list[@]}"; do
            [[ "$n" == "$num_int" || "$n" == "$flow_num" ]] && skip=true && break
        done
        $skip && continue
    fi

    RUN_LIST+=("$flow_def")
done

if [[ ${#RUN_LIST[@]} -eq 0 ]]; then
    echo -e "${RED}No flows selected. Check --flows / --skip arguments.${R}"
    exit 1
fi

# ── banner ────────────────────────────────────────────────────────────────────
SUITE_START=$(date +%s)
echo -e "\n${BOLD}╔══════════════════════════════════════════════════════════════╗${R}"
echo -e "${BOLD}║   ✦ Krisha Sparkles E2E Suite — $(date +"%Y-%m-%d %H:%M:%S")       ║${R}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${R}"
echo -e "  Flows selected: ${BOLD}${#RUN_LIST[@]}${R} of ${#ALL_FLOWS[@]}"
[[ -n "$EXTRA_ARGS" ]] && echo -e "  Extra args:     ${CYAN}${EXTRA_ARGS}${R}"
echo ""

# ── result tracking ───────────────────────────────────────────────────────────
declare -a RESULTS_NUM=()
declare -a RESULTS_LABEL=()
declare -a RESULTS_STATUS=()
declare -a RESULTS_SECS=()

TOTAL_PASSED=0
TOTAL_FAILED=0

# ── run each flow ─────────────────────────────────────────────────────────────
for flow_def in "${RUN_LIST[@]}"; do
    IFS='|' read -r flow_num flow_label flow_script <<< "$flow_def"
    flow_label="${flow_label%"${flow_label##*[![:space:]]}"}"  # rtrim

    script_path="$SCRIPT_DIR/$flow_script"
    if [[ ! -f "$script_path" ]]; then
        echo -e "${Y}[FLOW-${flow_num}]${R} ${DIM}${flow_label}${R}"
        echo -e "    ${Y}⚠️  Script not found: ${flow_script} — SKIPPED${R}"
        RESULTS_NUM+=("$flow_num")
        RESULTS_LABEL+=("$flow_label")
        RESULTS_STATUS+=("SKIP")
        RESULTS_SECS+=("0")
        continue
    fi

    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}"
    echo -e "${BOLD}▶  FLOW-${flow_num}: ${flow_label}${R}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${R}"

    t_start=$(date +%s)
    set +e
    "$PYTHON" "$script_path" $EXTRA_ARGS
    exit_code=$?
    set -e
    t_end=$(date +%s)
    elapsed=$(( t_end - t_start ))

    RESULTS_NUM+=("$flow_num")
    RESULTS_LABEL+=("$flow_label")
    RESULTS_SECS+=("$elapsed")

    if [[ $exit_code -eq 0 ]]; then
        echo -e "\n${G}✅  FLOW-${flow_num} PASSED in ${elapsed}s${R}\n"
        RESULTS_STATUS+=("PASS")
        (( TOTAL_PASSED++ ))
    else
        echo -e "\n${RED}❌  FLOW-${flow_num} FAILED (exit ${exit_code}) in ${elapsed}s${R}\n"
        RESULTS_STATUS+=("FAIL")
        (( TOTAL_FAILED++ ))
    fi
done

# ── summary table ─────────────────────────────────────────────────────────────
SUITE_END=$(date +%s)
SUITE_ELAPSED=$(( SUITE_END - SUITE_START ))

echo -e "\n${BOLD}╔══════════════════════════════════════════════════════════════╗${R}"
echo -e "${BOLD}║               E2E SUITE SUMMARY                              ║${R}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${R}"
echo ""
printf "  %-6s  %-28s  %-6s  %s\n" "FLOW" "LABEL" "TIME" "RESULT"
printf "  %-6s  %-28s  %-6s  %s\n" "------" "----------------------------" "------" "--------"

for i in "${!RESULTS_NUM[@]}"; do
    num="${RESULTS_NUM[$i]}"
    label="${RESULTS_LABEL[$i]}"
    status="${RESULTS_STATUS[$i]}"
    secs="${RESULTS_SECS[$i]}"

    case "$status" in
        PASS) colour="$G" icon="✅" ;;
        FAIL) colour="$RED" icon="❌" ;;
        SKIP) colour="$Y"   icon="⚠️ " ;;
        *)    colour="$DIM" icon="•" ;;
    esac

    printf "  %-6s  %-28s  %-6s  " "FLOW-$num" "$label" "${secs}s"
    echo -e "${colour}${icon} ${status}${R}"
done

echo ""
printf "  %s\n" "──────────────────────────────────────────────────────────"
TOTAL=$(( TOTAL_PASSED + TOTAL_FAILED ))
if [[ $TOTAL_FAILED -eq 0 ]]; then
    echo -e "  ${BOLD}${G}ALL ${TOTAL_PASSED} FLOW(S) PASSED ✅${R}  (${SUITE_ELAPSED}s total)"
else
    echo -e "  ${BOLD}${RED}${TOTAL_FAILED} FLOW(S) FAILED ❌  ${TOTAL_PASSED} passed / ${TOTAL} total${R}  (${SUITE_ELAPSED}s total)"
fi
echo ""

# Reports directory hint
REPORTS_DIR="$SCRIPT_DIR/reports"
if [[ -d "$REPORTS_DIR" ]]; then
    REPORT_COUNT=$(find "$REPORTS_DIR" -name "*.html" -newer "$REPORTS_DIR" 2>/dev/null | wc -l | tr -d ' ')
    echo -e "  📄 HTML reports → ${DIM}${REPORTS_DIR}/${R}"
fi

echo ""

# ── exit code ─────────────────────────────────────────────────────────────────
[[ $TOTAL_FAILED -eq 0 ]]
