import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import type { Banner, BannerCreate, BannerUpdate } from '../../types/api';

type BannerDraft = {
  id?: number;
  title: string;
  image_url: string;
  link_url: string;
  position: 'hero' | 'sidebar' | 'footer' | 'top';
  is_active: boolean;
  sort_order: number;
};

const emptyBanner = (): BannerDraft => ({
  title: '',
  image_url: '',
  link_url: '',
  position: 'hero',
  is_active: true,
  sort_order: 0,
});

const MOCK_BANNERS: Banner[] = [
  { id: 1, title: 'Summer Sale Banner', image_url: 'https://picsum.photos/seed/banner1/1200/300', link_url: '/products', position: 'hero', is_active: true, sort_order: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 2, title: 'Sidebar Promo', image_url: 'https://picsum.photos/seed/banner2/300/250', link_url: '/products', position: 'sidebar', is_active: true, sort_order: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 3, title: 'Footer Brand', image_url: 'https://picsum.photos/seed/banner3/1200/100', link_url: '/', position: 'footer', is_active: false, sort_order: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

export const AdminBanners: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [draft, setDraft] = useState<BannerDraft>(emptyBanner());

  const fetchBanners = async () => {
    setLoading(true);
    try {
      // const res = await apiClient.get<Banner[]>('/banners/');
      // setBanners(res.data);
      await new Promise((r) => setTimeout(r, 300));
      setBanners(MOCK_BANNERS);
    } catch {
      console.error('Error fetching banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreate = () => {
    setEditingBanner(null);
    setDraft(emptyBanner());
    setShowModal(true);
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setDraft({
      id: banner.id,
      title: banner.title,
      image_url: banner.image_url,
      link_url: banner.link_url || '',
      position: banner.position,
      is_active: banner.is_active,
      sort_order: banner.sort_order,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: BannerCreate = {
      title: draft.title.trim(),
      image_url: draft.image_url.trim(),
      link_url: draft.link_url.trim() || undefined,
      position: draft.position,
      is_active: draft.is_active,
      sort_order: draft.sort_order,
    };
    // if (editingBanner) {
    //   await apiClient.patch(`/banners/${editingBanner.id}`, payload as BannerUpdate);
    // } else {
    //   await apiClient.post('/banners/', payload);
    // }
    setShowModal(false);
    fetchBanners();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this banner?')) return;
    // await apiClient.delete(`/banners/${id}`);
    setBanners((s) => s.filter((x) => x.id !== id));
  };

  const positionColors: Record<string, string> = {
    hero: 'bg-purple-50 text-purple-700 border-purple-200',
    sidebar: 'bg-blue-50 text-blue-700 border-blue-200',
    footer: 'bg-zinc-100 text-zinc-600 border-zinc-300',
    top: 'bg-amber-50 text-amber-800 border-amber-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100">Banners</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Promotional banners for hero, sidebar, footer, and top placements</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-xs font-bold flex items-center space-x-1.5 shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Add Banner</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center text-zinc-400 text-xs py-12">Loading banners...</div>
      ) : banners.length === 0 ? (
        <div className="ui-surface p-12 rounded-sm text-center text-zinc-400 text-xs">No banners configured yet.</div>
      ) : (
        <div className="ui-surface rounded-sm overflow-hidden border border-zinc-700 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-100">
              <thead className="bg-zinc-900 text-zinc-400 uppercase text-[11px] font-bold border-b border-zinc-700">
                <tr>
                  <th className="px-4 py-3">Preview</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {banners.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-900 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-24 h-12 bg-zinc-900 rounded-xs overflow-hidden border border-zinc-700">
                        <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-zinc-100">{b.title}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${positionColors[b.position] || 'bg-zinc-100 text-zinc-600 border-zinc-300'}`}>
                        {b.position}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${b.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-600 border-zinc-300'}`}>
                        {b.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-300">{b.sort_order}</td>
                    <td className="px-4 py-3 flex gap-1.5">
                      <button onClick={() => openEdit(b)} className="p-1.5 text-zinc-400 hover:text-zinc-100 border border-zinc-700 rounded-xs"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(b.id)} className="p-1.5 text-zinc-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 p-6 rounded-sm space-y-4 shadow-xl border border-zinc-700">
            <h2 className="text-base font-bold text-zinc-100 border-b border-zinc-700 pb-2">{editingBanner ? 'Edit Banner' : 'Add New Banner'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <input type="text" required placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700" />
              <input type="url" required placeholder="Image URL" value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700" />
              <input type="url" placeholder="Link URL (optional)" value={draft.link_url} onChange={(e) => setDraft({ ...draft, link_url: e.target.value })} className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700" />
              <select value={draft.position} onChange={(e) => setDraft({ ...draft, position: e.target.value as BannerDraft['position'] })} className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700">
                <option value="hero">Hero</option>
                <option value="sidebar">Sidebar</option>
                <option value="footer">Footer</option>
                <option value="top">Top</option>
              </select>
              <input type="number" placeholder="Sort Order" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700" />
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300"><input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} /> Banner is active</label>
              <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-700">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-2 border border-zinc-700 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 rounded-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs font-bold py-2 px-4">{editingBanner ? 'Save Changes' : 'Create Banner'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
