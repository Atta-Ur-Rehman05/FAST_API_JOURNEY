import React from 'react';
import type { Product } from '../../types/api';
import { productImageUrl } from '../../lib/product-images';

export const ProductVisual: React.FC<{ product: Product; className?: string; priority?: boolean }> = ({ product, className = '', priority = false }) => (
  <img src={productImageUrl(product)} alt={product.name} loading={priority ? 'eager' : 'lazy'} className={`h-full w-full object-cover ${className}`} />
);
