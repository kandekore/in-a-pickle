'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { locationService } from '@/lib/location/LocationService';
import type { AddressSuggestion } from '@/lib/location/types';

interface Props {
  value: string;
  onChange: (text: string) => void;
  onSelect: (s: AddressSuggestion) => void;
  /** Bias suggestions toward this point (e.g. the user's coarse/GPS location). */
  focus?: [number, number] | null;
  name?: string;
  placeholder?: string;
  className?: string;
}

/**
 * Predictive-text address field. Debounces keystrokes, queries the backend ORS
 * autocomplete proxy, and lets the user pick a suggestion (mouse or keyboard).
 * Picking a suggestion yields real coordinates so the manual path places the
 * user correctly — no hardcoded fallback.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  focus,
  name = 'address',
  placeholder,
  className,
}: Props) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  // Latest-request guard so a slow earlier response can't overwrite a newer one.
  const seq = useRef(0);
  // Skip the fetch that would otherwise fire on the value change from a pick.
  const justPicked = useRef(false);

  useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    const mine = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      const results = await locationService.autocomplete(q, focus ?? null);
      if (mine !== seq.current) return; // a newer keystroke superseded this one
      setSuggestions(results);
      setOpen(results.length > 0);
      setActive(-1);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [value, focus]);

  // Close the dropdown on any outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function pick(s: AddressSuggestion) {
    justPicked.current = true;
    onSelect(s);
    setOpen(false);
    setSuggestions([]);
    setActive(-1);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      if (active >= 0) {
        e.preventDefault();
        pick(suggestions[active]!);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        className={className}
      />
      {loading && value.trim().length >= 3 && (
        <span className="absolute right-3 top-2.5 text-xs text-secondary">…</span>
      )}
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-trim bg-white shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.label}-${i}`}
              role="option"
              aria-selected={i === active}
              // onMouseDown (not click) so the pick fires before input blur closes the list.
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === active ? 'bg-mint-100 text-forest' : 'text-night'
              }`}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
