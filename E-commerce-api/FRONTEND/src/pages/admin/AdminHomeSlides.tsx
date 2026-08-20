import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import type { HomeSlide, HomeSlideCreate, HomeSlideUpdate } from '../../types/api';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { apiClient } from '../../lib/api-client';

type SlideDraft = {
  id?: number;
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  sort_order: number;
};

const emptySlide = (): SlideDraft => ({
  title: '',
  subtitle: '',
  image_url: '',
  link_url: '',
  is_active: true,
  sort_order: 0,
});

export const AdminHomeSlides: React.FC = () => {
  const [slides, setSlides] = useState<HomeSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HomeSlide | null>(null);
  const [draft, setDraft] = useState<SlideDraft>(emptySlide);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<HomeSlide[]>('/slides/');
      setSlides(res.data);
    } catch {
      console.error('Error fetching slides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const openCreate = () => {
    setEditingSlide(null);
    setDraft(emptySlide());
    setShowModal(true);
  };

  const openEdit = (slide: HomeSlide) => {
    setEditingSlide(slide);
    setDraft({
      id: slide.id,
      title: slide.title,
      subtitle: slide.subtitle || '',
      image_url: slide.image_url,
      link_url: slide.link_url || '',
      is_active: slide.is_active,
      sort_order: slide.sort_order,
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: HomeSlideCreate = {
      title: draft.title.trim(),
      subtitle: draft.subtitle.trim() || undefined,
      image_url: draft.image_url.trim(),
      link_url: draft.link_url.trim() || undefined,
      is_active: draft.is_active,
      sort_order: draft.sort_order,
    };
    try {
      if (editingSlide) {
        await apiClient.patch(`/slides/${editingSlide.id}`, payload as HomeSlideUpdate);
      } else {
        await apiClient.post('/slides/', payload);
      }
      setShowModal(false);
      fetchSlides();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to save slide.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this slide?')) return;
    try {
      await apiClient.delete(`/slides/${id}`);
      setSlides((s) => s.filter((x) => x.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete slide.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100">Home Slides</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Manage hero carousel slides on the storefront</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-xs font-bold flex items-center space-x-1.5 shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Add Slide</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center text-zinc-400 text-xs py-12">Loading slides...</div>
      ) : slides.length === 0 ? (
        <div className="ui-surface p-12 rounded-sm text-center text-zinc-400 text-xs">No slides configured yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {slides.map((slide) => (
            <div key={slide.id} className="ui-surface rounded-sm overflow-hidden border border-zinc-700 shadow-xs">
              <div className="aspect-video bg-zinc-900 overflow-hidden">
                <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-100 truncate">{slide.title}</h3>
                  <span className={`px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${slide.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-600 border-zinc-300'}`}>
                    {slide.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-2">{slide.subtitle || 'No subtitle'}</p>
                <div className="text-[10px] font-mono text-zinc-500">Order: {slide.sort_order}</div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => openEdit(slide)} className="text-xs text-zinc-100 font-bold flex items-center gap-1"><Pencil className="w-3.5 h-3.5" /> Edit</button>
                  <button onClick={() => handleDelete(slide.id)} className="text-xs text-rose-600 font-bold flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-zinc-900 p-6 rounded-sm space-y-4 shadow-xl border border-zinc-700">
            <h2 className="text-base font-bold text-zinc-100 border-b border-zinc-700 pb-2">{editingSlide ? 'Edit Slide' : 'Add New Slide'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <input type="text" required placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700" />
              <input type="text" placeholder="Subtitle" value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700" />
              <ImageUpload
                label="Slide Image"
                currentImageUrl={draft.image_url}
                onImageUploaded={(url) => setDraft({ ...draft, image_url: url })}
                onImageRemoved={() => setDraft({ ...draft, image_url: '' })}
              />
              <input type="url" placeholder="Link URL (optional)" value={draft.link_url} onChange={(e) => setDraft({ ...draft, link_url: e.target.value })} className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700" />
              <input type="number" placeholder="Sort Order" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700" />
              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300"><input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} /> Slide is active</label>
              <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-700">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-2 border border-zinc-700 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 rounded-xs">Cancel</button>
                <button type="submit" className="btn-primary text-xs font-bold py-2 px-4">{editingSlide ? 'Save Changes' : 'Create Slide'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
