import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import type { Blog, BlogCreate, BlogUpdate, PaginatedResponse } from '../../types/api';
import { ImageUpload } from '../../components/admin/ImageUpload';
import { apiClient } from '../../lib/api-client';
import { toast } from 'sonner';
import { useConfirm } from '../../hooks/useConfirm';
import { Modal } from '../../components/ui/Modal';
import { SkeletonTable } from '../../components/ui/Skeleton';

type BlogDraft = {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  author_name: string;
  is_published: boolean;
  published_at: string;
};

const emptyBlog = (): BlogDraft => ({
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  cover_image_url: '',
  author_name: '',
  is_published: false,
  published_at: '',
});

export const AdminBlogs: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [draft, setDraft] = useState<BlogDraft>(emptyBlog);
  const { confirm, dialog } = useConfirm();

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<PaginatedResponse<Blog>>('/blogs/');
      setBlogs(res.data.items);
    } catch {
      console.error('Error fetching blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const openCreate = () => {
    setEditingBlog(null);
    setDraft(emptyBlog());
    setShowModal(true);
  };

  const openEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setDraft({
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || '',
      content: blog.content,
      cover_image_url: blog.cover_image_url || '',
      author_name: blog.author_name || '',
      is_published: blog.is_published,
      published_at: blog.published_at || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: BlogCreate = {
      title: draft.title.trim(),
      slug: draft.slug.trim(),
      excerpt: draft.excerpt.trim() || undefined,
      content: draft.content,
      cover_image_url: draft.cover_image_url.trim() || undefined,
      author_name: draft.author_name.trim() || undefined,
      is_published: draft.is_published,
      published_at: draft.published_at || undefined,
    };
    try {
      if (editingBlog) {
        await apiClient.patch(`/blogs/${editingBlog.id}`, payload as BlogUpdate);
      } else {
        await apiClient.post('/blogs/', payload);
      }
      setShowModal(false);
      fetchBlogs();
      toast.success(editingBlog ? 'Blog updated' : 'Blog created');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to save blog.');
    }
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: 'Delete blog post',
      message: 'Are you sure you want to delete this blog post?',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await apiClient.delete(`/blogs/${id}`);
      setBlogs((s) => s.filter((x) => x.id !== id));
      toast.success('Blog deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete blog.');
    }
  };

  const togglePublish = async (blog: Blog) => {
    try {
      await apiClient.patch(`/blogs/${blog.id}`, { is_published: !blog.is_published });
      setBlogs((s) => s.map((b) => (b.id === blog.id ? { ...b, is_published: !blog.is_published } : b)));
      toast.success(blog.is_published ? 'Blog unpublished' : 'Blog published');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to update publish status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100">Blogs</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Write and publish storefront articles and announcements</p>
        </div>
        <button onClick={openCreate} className="btn-primary text-xs font-bold flex items-center space-x-1.5 shadow-xs">
          <Plus className="w-4 h-4" />
          <span>Add Blog</span>
        </button>
      </div>

      {loading ? (
        <SkeletonTable rows={4} cols={6} />
      ) : blogs.length === 0 ? (
        <div className="ui-surface p-12 rounded-sm text-center text-zinc-400 text-xs">No blog posts yet.</div>
      ) : (
        <div className="ui-surface rounded-sm overflow-hidden border border-zinc-700 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-100">
              <thead className="bg-zinc-900 text-zinc-400 uppercase text-[11px] font-bold border-b border-zinc-700">
                <tr>
                  <th className="px-4 py-3">Cover</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {blogs.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-900 transition-colors">
                    <td className="px-4 py-3">
                      {b.cover_image_url ? (
                        <div className="w-16 h-10 bg-zinc-900 rounded-xs overflow-hidden border border-zinc-700">
                          <img src={b.cover_image_url} alt={b.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-[10px]">No cover</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-zinc-100">{b.title}</td>
                    <td className="px-4 py-3 font-mono text-zinc-400 text-[11px]">{b.slug}</td>
                    <td className="px-4 py-3 text-zinc-300">{b.author_name || '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => togglePublish(b)} className={`flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase border ${b.is_published ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-zinc-100 text-zinc-600 border-zinc-300'}`}>
                        {b.is_published ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {b.is_published ? 'Published' : 'Draft'}
                      </button>
                    </td>
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingBlog ? 'Edit Blog' : 'Add New Blog'} maxWidth="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-3">
          <input type="text" required placeholder="Title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') })} className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700" />
          <input type="text" required placeholder="Slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-700" />
          <input type="text" placeholder="Excerpt" value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700" />
          <textarea rows={5} required placeholder="Content (HTML supported)" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700 font-mono" />
          <ImageUpload
            label="Cover Image"
            currentImageUrl={draft.cover_image_url}
            onImageUploaded={(url) => setDraft({ ...draft, cover_image_url: url })}
            onImageRemoved={() => setDraft({ ...draft, cover_image_url: '' })}
          />
          <input type="text" placeholder="Author Name" value={draft.author_name} onChange={(e) => setDraft({ ...draft, author_name: e.target.value })} className="w-full p-2.5 border border-zinc-700 rounded-xs text-xs text-zinc-100 focus:outline-none focus:border-zinc-700" />
          <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300"><input type="checkbox" checked={draft.is_published} onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })} /> Publish immediately</label>
          <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-700">
            <button type="button" onClick={() => setShowModal(false)} className="px-3 py-2 border border-zinc-700 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 rounded-xs">Cancel</button>
            <button type="submit" className="btn-primary text-xs font-bold py-2 px-4">{editingBlog ? 'Save Changes' : 'Create Blog'}</button>
          </div>
        </form>
      </Modal>
      {dialog}
    </div>
  );
};