import React, { useState, useEffect } from 'react';
import { Upload, Save } from 'lucide-react';
import type { SiteLogo } from '../../types/api';

const DEFAULT_LOGO: SiteLogo = {
  id: 1,
  logo_url: 'https://picsum.photos/seed/logo/200/60',
  favicon_url: 'https://picsum.photos/seed/favicon/32/32',
  updated_at: '2026-01-01T00:00:00Z',
};

export const AdminManageLogo: React.FC = () => {
  const [logo, setLogo] = useState<SiteLogo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const fetchLogo = async () => {
    setLoading(true);
    try {
      // const res = await apiClient.get<SiteLogo>('/logo/');
      // setLogo(res.data);
      await new Promise((r) => setTimeout(r, 300));
      setLogo(DEFAULT_LOGO);
      setLogoUrl(DEFAULT_LOGO.logo_url);
      setFaviconUrl(DEFAULT_LOGO.favicon_url || '');
    } catch {
      console.error('Error fetching logo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogo();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      // await apiClient.put('/logo/', { logo_url: logoUrl, favicon_url: faviconUrl || undefined });
      await new Promise((r) => setTimeout(r, 500));
      setLogo({ id: logo?.id || 1, logo_url: logoUrl, favicon_url: faviconUrl || null, updated_at: new Date().toISOString() });
      setMessage('Logo settings saved successfully.');
    } catch {
      setMessage('Failed to save logo settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center text-zinc-400 text-xs py-12">Loading logo settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100">Manage Logo</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Update the storefront logo and favicon</p>
      </div>

      <div className="ui-surface p-6 rounded-sm border border-zinc-700 shadow-xs space-y-6 max-w-xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Logo Preview</label>
            <div className="flex items-center gap-4">
              <div className="w-40 h-16 bg-zinc-900 border border-zinc-700 rounded-xs flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                ) : (
                  <span className="text-zinc-600 text-[10px]">No logo</span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Logo URL</label>
            <input
              type="url"
              required
              placeholder="https://example.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
            />
            <p className="text-[10px] text-zinc-500">Recommended: transparent PNG, max 200px wide</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Favicon URL</label>
            <input
              type="url"
              placeholder="https://example.com/favicon.ico"
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700"
            />
            <p className="text-[10px] text-zinc-500">Recommended: 32x32 or 64x64 ICO/PNG</p>
          </div>

          {message && (
            <p role="status" className={`text-xs rounded-xs p-3 border ${message.includes('success') ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
              {message}
            </p>
          )}

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary text-xs font-bold py-2 px-4 flex items-center space-x-1.5 shadow-xs disabled:opacity-50">
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Logo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
