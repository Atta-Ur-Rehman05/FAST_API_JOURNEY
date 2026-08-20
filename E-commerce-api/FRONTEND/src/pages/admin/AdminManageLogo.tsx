import React, { useState, useEffect } from 'react';
import { Upload, Save } from 'lucide-react';
import type { SiteLogo } from '../../types/api';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { apiClient } from '../../lib/api-client';

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
      const res = await apiClient.get<SiteLogo>('/logo/');
      setLogo(res.data);
      setLogoUrl(res.data.logo_url);
      setFaviconUrl(res.data.favicon_url || '');
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
      await apiClient.put('/logo/', { logo_url: logoUrl, favicon_url: faviconUrl || undefined });
      setMessage('Logo settings saved successfully.');
      fetchLogo();
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
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Logo</label>
            <ImageUpload
              currentImageUrl={logoUrl}
              onImageUploaded={(url) => setLogoUrl(url)}
              onImageRemoved={() => setLogoUrl('')}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Favicon</label>
            <ImageUpload
              currentImageUrl={faviconUrl}
              onImageUploaded={(url) => setFaviconUrl(url)}
              onImageRemoved={() => setFaviconUrl('')}
            />
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
