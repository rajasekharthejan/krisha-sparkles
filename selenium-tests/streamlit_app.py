"""
streamlit_app.py — Krisha Sparkles Flow Runner UI

Launch with:
    streamlit run streamlit_app.py

Pick a category, pick one flow via radio button, click Run.
Live step output streams while Chrome executes.
"""

import queue
import time
import streamlit as st
from flow_registry import ALL_FLOWS, FLOWS_BY_CATEGORY, CATEGORIES
from flow_runner import FlowRunner

# ── Page Config ───────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="Krisha Sparkles — Flow Runner",
    page_icon="💎",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── CSS ───────────────────────────────────────────────────────────────────────

st.markdown("""
<style>
.badge-pass { background:#14532d; color:#86efac; padding:4px 12px; border-radius:4px; font-size:0.85rem; font-weight:700; }
.badge-fail { background:#7f1d1d; color:#fca5a5; padding:4px 12px; border-radius:4px; font-size:0.85rem; font-weight:700; }
.badge-run  { background:#1e3a5f; color:#93c5fd; padding:4px 12px; border-radius:4px; font-size:0.85rem; font-weight:700; }
.step-line  { font-family:monospace; font-size:0.82rem; color:#9ca3af; padding:2px 0; line-height:1.6; }
.step-live  { font-family:monospace; font-size:0.82rem; color:#60a5fa; padding:2px 0; line-height:1.6; }
#MainMenu { visibility:hidden; }
footer    { visibility:hidden; }
</style>
""", unsafe_allow_html=True)

# ── Session State ─────────────────────────────────────────────────────────────

for key, val in {
    "result":       None,    # final result dict
    "running":      False,
    "runner":       None,
    "result_queue": None,
    "live_steps":   [],      # steps streaming in while running
}.items():
    if key not in st.session_state:
        st.session_state[key] = val

# ── Sidebar ───────────────────────────────────────────────────────────────────

with st.sidebar:
    st.markdown("## ⚙️ Settings")

    base_url = st.text_input(
        "Base URL",
        value="https://krisha-sparkles.vercel.app",
    )
    headless = st.toggle(
        "Headless Mode", value=False,
        help="Run Chrome without a visible window",
    )

    st.divider()
    st.markdown("## 📋 Pick a Flow")

    selected_category = st.selectbox("Category", options=CATEGORIES, index=0)
    flows_in_cat = FLOWS_BY_CATEGORY[selected_category]
    radio_labels = [f"{f.id} — {f.name}" for f in flows_in_cat]

    chosen_label = st.radio("Flow", options=radio_labels, index=0)
    chosen_idx   = radio_labels.index(chosen_label)
    chosen_flow  = flows_in_cat[chosen_idx]

    st.divider()
    st.caption("🔐 Requires admin" if chosen_flow.requires_admin else "👤 Customer flow")
    st.caption(chosen_flow.description)

# ── Main Area ─────────────────────────────────────────────────────────────────

st.markdown("# 💎 Krisha Sparkles — Flow Runner")

c1, c2, c3 = st.columns([3, 2, 2])
with c1:
    st.markdown(f"### {chosen_flow.id} — {chosen_flow.name}")
    st.caption(f"**Category:** {chosen_flow.category}")
    st.caption(f"**Description:** {chosen_flow.description}")
with c2:
    st.markdown("**Base URL**")
    st.code(base_url, language=None)
with c3:
    st.markdown("**Mode**")
    st.write("🖥 Headless" if headless else "🪟 Visible browser")

st.divider()

# ── Poll queue (drains all pending messages each rerun) ───────────────────────

def _poll():
    q = st.session_state.result_queue
    if not q:
        return
    while True:
        try:
            msg = q.get_nowait()
        except queue.Empty:
            break

        t = msg.get("type")

        if t == "step":
            st.session_state.live_steps.append(msg["step"])

        elif t == "result":
            st.session_state.result = {
                "status":   "pass" if msg["passed"] else "fail",
                "passed":   msg["passed"],
                "message":  msg["message"],
                "duration": msg["duration"],
                "steps":    msg.get("steps", []),
            }

        elif t == "done":
            st.session_state.running = False

        elif t == "error":
            st.session_state.running = False
            st.session_state.result  = {
                "status":   "fail",
                "passed":   False,
                "message":  f"Runner error: {msg.get('message', '')}",
                "duration": 0.0,
                "steps":    st.session_state.live_steps[:],
            }

if st.session_state.running:
    _poll()

# ── Buttons ───────────────────────────────────────────────────────────────────

b1, b2, b3 = st.columns([2, 1, 1])

with b1:
    run_label = (
        f"▶  Run  {chosen_flow.id} — {chosen_flow.name}"
        if not st.session_state.running else "⏳  Running…"
    )
    if st.button(run_label, type="primary",
                 disabled=st.session_state.running,
                 use_container_width=True):
        st.session_state.result      = None
        st.session_state.live_steps  = []
        rq = queue.Queue()
        st.session_state.result_queue = rq
        runner = FlowRunner(
            flows=[chosen_flow],
            result_queue=rq,
            base_url=base_url,
            headless=headless,
            stop_on_fail=False,
        )
        st.session_state.runner  = runner
        st.session_state.running = True
        runner.start()
        st.rerun()

with b2:
    if st.button("⏹  Stop",
                 disabled=not st.session_state.running,
                 use_container_width=True):
        if st.session_state.runner:
            st.session_state.runner.stop()
        st.session_state.running = False

with b3:
    if st.button("🗑  Clear", use_container_width=True):
        st.session_state.result     = None
        st.session_state.live_steps = []
        st.rerun()

# ── Auto-refresh while running ────────────────────────────────────────────────

if st.session_state.running:
    time.sleep(0.5)
    st.rerun()

# ── Output Area ───────────────────────────────────────────────────────────────

r     = st.session_state.result
live  = st.session_state.live_steps

if st.session_state.running or live or r:
    st.divider()

# Live streaming while running
if st.session_state.running:
    st.markdown('<span class="badge-run">⏳ RUNNING</span>', unsafe_allow_html=True)
    st.markdown("")
    if live:
        st.markdown("**Live steps:**")
        lines = "\n".join(f"{i}. {s}" for i, s in enumerate(live, 1))
        st.code(lines, language=None)

# Final result
if r and not st.session_state.running:
    status  = r["status"]
    message = r["message"]
    dur     = r.get("duration", 0.0)
    steps   = r.get("steps", [])

    if status == "pass":
        st.markdown('<span class="badge-pass">✅ PASSED</span>', unsafe_allow_html=True)
        st.success(f"{message}  ({dur:.1f}s)")
    else:
        st.markdown('<span class="badge-fail">❌ FAILED</span>', unsafe_allow_html=True)
        st.error(f"{message}  ({dur:.1f}s)" if dur else message)

    if steps:
        st.markdown("**Steps executed:**")
        lines = "\n".join(f"{i}. {s}" for i, s in enumerate(steps, 1))
        st.code(lines, language=None)

# ── Footer ────────────────────────────────────────────────────────────────────

st.divider()
st.caption(
    f"💎 Krisha Sparkles Flow Runner · {len(ALL_FLOWS)} flows · {len(CATEGORIES)} categories"
)
