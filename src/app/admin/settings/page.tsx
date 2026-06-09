'use client';
import { Activity } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-sans font-semibold text-2xl text-text">Settings</h1>
        <p className="text-muted text-sm font-sans mt-1">System configuration</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <Activity size={32} className="text-muted mx-auto mb-3" />
        <p className="text-muted font-sans text-sm">
          Strategy settings are configured in <span className="font-mono text-text">config.py</span> on the server.
          <br />This panel is reserved for future web-based config management.
        </p>
      </div>
    </div>
  );
}
