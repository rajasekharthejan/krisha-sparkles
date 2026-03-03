"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

export interface ParsedAddress {
  line1: string;      // "123 Main St"
  city: string;       // "Austin"
  state: string;      // "TX"
  zipCode: string;    // "78701"
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onAddressSelect: (addr: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

// Track global script load state
let scriptLoaded = false;
let scriptLoading = false;
const callbacks: Array<() => void> = [];

function loadGoogleMaps(apiKey: string, onReady: () => void) {
  if (scriptLoaded) { onReady(); return; }
  callbacks.push(onReady);
  if (scriptLoading) return;
  scriptLoading = true;

  // Expose callback for the script to call
  (window as unknown as Record<string, unknown>).__gmapsReady = () => {
    scriptLoaded = true;
    callbacks.forEach(cb => cb());
    callbacks.length = 0;
  };

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__gmapsReady`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

function parseAddressComponents(
  components: google.maps.GeocoderAddressComponent[]
): ParsedAddress {
  const get = (type: string, short = false) =>
    components.find(c => c.types.includes(type))?.[short ? "short_name" : "long_name"] || "";

  const streetNumber = get("street_number");
  const route = get("route");
  const line1 = [streetNumber, route].filter(Boolean).join(" ");
  const city = get("locality") || get("sublocality_level_1") || get("administrative_area_level_2");
  const state = get("administrative_area_level_1", true); // 2-letter code
  const zipCode = get("postal_code");

  return { line1, city, state, zipCode };
}

export default function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Address line 1 *",
  className,
  style,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "no-key">("idle");

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  useEffect(() => {
    if (!apiKey) { setStatus("no-key"); return; }
    setStatus("loading");

    loadGoogleMaps(apiKey, () => {
      setStatus("ready");
      if (!inputRef.current) return;

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "us" },
        fields: ["address_components", "formatted_address"],
        types: ["address"],
      });

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current?.getPlace();
        if (!place?.address_components) return;

        const parsed = parseAddressComponents(place.address_components);
        onChange(parsed.line1); // update the input value
        onAddressSelect(parsed); // propagate to parent to fill city/state/zip
      });
    });

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // If no API key configured → plain input fallback
  if (status === "no-key") {
    return (
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        style={style}
        disabled={disabled}
        autoComplete="address-line1"
      />
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        style={{ ...style, paddingRight: status === "loading" ? "2.25rem" : undefined }}
        disabled={disabled}
        autoComplete="off" // prevent browser autocomplete conflicting with Google Places
      />
      {status === "loading" && (
        <Loader2
          size={14}
          style={{
            position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
            color: "var(--gold)", opacity: 0.6, animation: "spin 1s linear infinite", pointerEvents: "none",
          }}
        />
      )}
      {status === "ready" && value && (
        <MapPin
          size={13}
          style={{
            position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
            color: "var(--gold)", opacity: 0.5, pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
