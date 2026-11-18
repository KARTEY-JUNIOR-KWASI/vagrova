'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { colors } from '@vagrova/ui';

const GHANA_LOGISTICS_PLACES = [
  'Tema Port, Container Terminal 3',
  'Tema Port, Gate 4',
  'Tema Free Zones Enclave',
  'Spintex Road Industrial Area, Accra',
  'George W. Bush Hwy (N1), Accra',
  'Lapaz, N1 Highway, Accra',
  'Achimota Mile 7, Accra',
  'Circle / Kwame Nkrumah Interchange, Accra',
  'East Legon, Accra',
  'Airport Residential Area, Accra',
  'Accra Central / Makola',
  'Kasoa North Quarry Site',
  'Weija Junction, Accra',
  'Pokuase Interchange, Accra',
  'Nsawam Road Industrial Zone',
  'Takoradi Port, Western Region',
  'Tarkwa Mining Concession, Western Region',
  'Obuasi Mine Site, Ashanti Region',
  'Suame Magazine, Kumasi',
  'Adum / Kejetia, Kumasi',
  'Tamale Central Logistics Hub',
  'Cape Coast, Central Region',
  'Ho Central, Volta Region',
  'Koforidua, Eastern Region',
];

interface LocationAutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  inputStyle?: React.CSSProperties;
}

export default function LocationAutocompleteInput({
  value,
  onChange,
  placeholder = 'Search Ghana location...',
  inputStyle,
}: LocationAutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    const q = value.trim();
    if (!open || q.length < 2) {
      setSuggestions([]);
      return;
    }

    const lower = q.toLowerCase();
    const localMatches = GHANA_LOGISTICS_PLACES.filter((p) =>
      p.toLowerCase().includes(lower),
    ).slice(0, 4);
    setSuggestions(localMatches);

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=gh&limit=5&q=${encodeURIComponent(q)}`,
          {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          },
        );
        if (!res.ok) return;
        const data = (await res.json()) as Array<{ display_name?: string }>;
        const remote = data
          .map((d) =>
            (d.display_name || '')
              .split(',')
              .slice(0, 3)
              .map((s) => s.trim())
              .join(', '),
          )
          .filter(Boolean);
        const merged = Array.from(new Set([...localMatches, ...remote])).slice(0, 6);
        setSuggestions(merged);
      } catch {
        // Keep local Ghana matches if offline or aborted
      }
    }, 280);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, open]);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        style={{
          width: '100%',
          height: '40px',
          border: 'none',
          borderBottom: `1px solid ${colors.grey300}`,
          backgroundColor: 'transparent',
          fontSize: '16px',
          fontWeight: 600,
          ...inputStyle,
        }}
      />

      {open && suggestions.length > 0 && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 60,
            marginTop: '4px',
            backgroundColor: colors.roadWhite,
            border: `1.5px solid ${colors.asphalt}`,
            borderRadius: '10px',
            boxShadow: '0 12px 28px rgba(8, 77, 85, 0.2)',
            overflow: 'hidden',
          }}
        >
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(item);
                setOpen(false);
              }}
              onClick={() => {
                onChange(item);
                setOpen(false);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                backgroundColor: colors.roadWhite,
                border: 'none',
                borderBottom: `1px solid ${colors.grey100}`,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: colors.asphalt,
                cursor: 'pointer',
              }}
            >
              <MapPin size={14} color={colors.safetyAmber} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
