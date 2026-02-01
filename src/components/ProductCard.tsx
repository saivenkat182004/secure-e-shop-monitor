import React from 'react';
import { ShoppingCart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  stock: number;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  description,
  price,
  image_url,
  category,
  stock,
}) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({
      id,
      name,
      price,
      image_url: image_url || '/placeholder.svg',
    });
    toast.success(`${name} added to cart!`);
  };

  return (
    <div className="group relative bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      {/* Image */}
      <div className="aspect-square overflow-hidden bg-secondary/50">
        <img
          src={image_url || '/placeholder.svg'}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Category Badge */}
      <div className="absolute top-3 left-3">
        <span className="px-3 py-1 text-xs font-medium bg-primary/20 text-primary rounded-full backdrop-blur-sm">
          {category}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-lg text-foreground mb-1 line-clamp-1">
          {name}
        </h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
          {description}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-primary">₹{price.toFixed(2)}</span>
            <p className="text-xs text-muted-foreground">
              {stock > 0 ? `${stock} in stock` : 'Out of stock'}
            </p>
          </div>
          
          <Button
            onClick={handleAddToCart}
            disabled={stock === 0}
            size="sm"
            className="glow-primary"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
