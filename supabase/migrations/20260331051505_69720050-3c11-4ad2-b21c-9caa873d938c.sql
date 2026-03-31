
-- Product variants table (RAM, colors, storage etc.)
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_type TEXT NOT NULL,
  variant_value TEXT NOT NULL,
  price_adjustment NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Product reviews table
CREATE TABLE public.product_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Competitor prices table (AI-generated estimates)
CREATE TABLE public.competitor_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  competitor_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_prices ENABLE ROW LEVEL SECURITY;

-- Product variants: publicly viewable
CREATE POLICY "Product variants are publicly viewable" ON public.product_variants FOR SELECT TO public USING (true);

-- Product variants: admins can manage
CREATE POLICY "Admins can insert product variants" ON public.product_variants FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update product variants" ON public.product_variants FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete product variants" ON public.product_variants FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Product reviews: publicly viewable, authenticated users can insert their own
CREATE POLICY "Reviews are publicly viewable" ON public.product_reviews FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can insert reviews" ON public.product_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON public.product_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reviews" ON public.product_reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Competitor prices: publicly viewable
CREATE POLICY "Competitor prices are publicly viewable" ON public.competitor_prices FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert competitor prices" ON public.competitor_prices FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete competitor prices" ON public.competitor_prices FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage products (insert, update, delete)
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage user_roles (for assigning roles)
CREATE POLICY "Admins can insert user roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
