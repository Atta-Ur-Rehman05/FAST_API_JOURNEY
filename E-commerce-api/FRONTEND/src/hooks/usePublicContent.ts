import { useState, useEffect } from 'react';
import type { HomeSlide, Banner, Blog, SiteLogo } from '../types/api';
import { apiClient } from '../lib/api-client';

export interface PublicContent {
  slides: HomeSlide[];
  banners: Banner[];
  blogs: Blog[];
  logo: SiteLogo | null;
  loading: boolean;
}

export const usePublicContent = (): PublicContent => {
  const [slides, setSlides] = useState<HomeSlide[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [logo, setLogo] = useState<SiteLogo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [slidesRes, bannersRes, blogsRes, logoRes] = await Promise.all([
          apiClient.get<HomeSlide[]>('/slides/'),
          apiClient.get<Banner[]>('/banners/'),
          apiClient.get<{ items: Blog[]; total: number; page: number; page_size: number; next_page: number | null }>('/blogs/public'),
          apiClient.get<SiteLogo>('/logo/'),
        ]);
        if (!cancelled) {
          setSlides(slidesRes.data);
          setBanners(bannersRes.data);
          setBlogs(blogsRes.data.items);
          setLogo(logoRes.data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading public content:', err);
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return { slides, banners, blogs, logo, loading };
};
