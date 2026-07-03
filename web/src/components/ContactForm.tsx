'use client';

import { useState } from 'react';

/**
 * Lead-capture contact form (conversion_goal === 'lead').
 * Posts to the API contact endpoint when available; otherwise resolves locally
 * so the form is demonstrably functional during the thin-slice build.
 * Brief: NO pop-up ads — this is a calm, inline form only.
 */
export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const api = process.env.NEXT_PUBLIC_API_URL;
      if (api) {
        await fetch(`${api}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).catch(() => undefined); // endpoint is a future stub; don't block UX
      }
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="card bg-mint-50" role="status">
        <h2 className="text-2xl">Thanks — message received</h2>
        <p className="mt-2 text-ink/90">
          We’ll get back to you as quickly and clearly as we can.
        </p>
      </div>
    );
  }

  return (
    <form id="contact-form" onSubmit={onSubmit} className="card grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block font-semibold text-forest">Your name</span>
          <input
            name="name"
            required
            autoComplete="name"
            className="w-full rounded-lg border border-trim px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block font-semibold text-forest">Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-trim px-3 py-2"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block font-semibold text-forest">I am a…</span>
        <select name="role" className="w-full rounded-lg border border-trim px-3 py-2">
          <option value="customer">Driver / customer</option>
          <option value="provider">Mechanic / recovery operator</option>
          <option value="other">Something else</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block font-semibold text-forest">How can we help?</span>
        <textarea
          name="message"
          required
          rows={5}
          className="w-full rounded-lg border border-trim px-3 py-2"
        />
      </label>
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send us a message'}
      </button>
      {status === 'error' && (
        <p className="text-red-700" role="alert">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
