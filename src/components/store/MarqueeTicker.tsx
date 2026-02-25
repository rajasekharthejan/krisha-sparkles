const ITEMS = [
  "✦ Free Shipping on orders $75+",
  "✦ New Arrivals Every Week",
  "✦ Premium Jadau Collection",
  "✦ Handcrafted Imitation Jewelry",
  "✦ Easy 7-Day Returns",
  "✦ Inspired by Indian Heritage",
  "✦ Designed for the Modern Woman",
  "✦ Gold-Plated Finish",
  "✦ Exclusive USA Collection",
];

export default function MarqueeTicker() {
  const repeated = [...ITEMS, ...ITEMS];
  return (
    <div
      style={{
        background: "linear-gradient(90deg, var(--gold-dark), var(--gold), var(--gold-light), var(--gold), var(--gold-dark))",
        padding: "0.55rem 0",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div className="marquee-track">
        {repeated.map((item, i) => (
          <span
            key={i}
            style={{
              color: "#0a0a0a",
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
              padding: "0 1.5rem",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
