import { useState, useEffect } from 'react';
import type { HomeSlide, Banner, Blog, SiteLogo } from '../types/api';

const MOCK_SLIDES: HomeSlide[] = [
  { id: 1, title: 'Summer Sale', subtitle: 'Up to 50% off on selected items', image_url: 'https://picsum.photos/seed/slide1/1200/500', link_url: '/products', is_active: true, sort_order: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 2, title: 'New Arrivals', subtitle: 'Check out the latest drops', image_url: 'https://picsum.photos/seed/slide2/1200/500', link_url: '/products', is_active: true, sort_order: 2, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 3, title: 'Free Shipping', subtitle: 'On orders over Rs. 5,000', image_url: 'https://picsum.photos/seed/slide3/1200/500', link_url: '/products', is_active: true, sort_order: 3, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const MOCK_BANNERS: Banner[] = [
  { id: 1, title: 'Summer Sale Banner', image_url: 'https://picsum.photos/seed/banner1/1200/200', link_url: '/products', position: 'hero', is_active: true, sort_order: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 2, title: 'Sidebar Promo', image_url: 'https://picsum.photos/seed/banner2/300/250', link_url: '/products', position: 'sidebar', is_active: true, sort_order: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const MOCK_BLOGS: Blog[] = [
  { id: 1, title: 'Getting Started with Our Store', slug: 'getting-started', excerpt: 'A quick guide to finding the best products on ZetaMall.', content: '<p>Full content here...</p>', cover_image_url: 'https://picsum.photos/seed/blog1/800/400', author_name: 'Admin', is_published: true, published_at: '2026-01-15T00:00:00Z', created_at: '2026-01-15T00:00:00Z', updated_at: '2026-01-15T00:00:00Z' },
  { id: 2, title: 'Summer Fashion Trends 2026', slug: 'summer-fashion-2026', excerpt: 'Top picks for the season.', content: '<p>Full content here...</p>', cover_image_url: 'https://picsum.photos/seed/blog2/800/400', author_name: 'Editor', is_published: true, published_at: '2026-02-01T00:00:00Z', created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
  { id: 3, title: 'Draft: Upcoming Sale', slug: 'upcoming-sale', excerpt: 'Preview of our next big sale.', content: '<p>Full content here...</p>', cover_image_url: '', author_name: 'Admin', is_published: false, published_at: null, created_at: '2026-03-01T00:00:00Z', updated_at: '2026-03-01T00:00:00Z' },
];

const MOCK_LOGO: SiteLogo = {
  id: 1,
  logo_url: 'https://picsum.photos/seed/logo/200/60',
  favicon_url: 'https://picsum.photos/seed/favicon/32/32',
  updated_at: '2026-01-01T00:00:00Z',
};

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
      // Replace these with real API calls when backend is ready:
      // const [slidesRes, bannersRes, blogsRes, logoRes] = await Promise.all([
      //   apiClient.get<HomeSlide[]>('/slides/'),
      //   apiClient.get<Banner[]>('/banners/'),
      //   apiClient.get<Blog[]>('/blogs/'),
      //   apiClient.get<SiteLogo>('/logo/'),
      // ]);
      await new Promise((r) => setTimeout(r, 200));
      if (!cancelled) {
        setSlides(MOCK_SLIDES);
        setBanners(MOCK_BANNERS);
        setBlogs(MOCK_BLOGS.filter((b) => b.is_published));
        setLogo(MOCK_LOGO);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return { slides, banners, blogs, logo, loading };
};
