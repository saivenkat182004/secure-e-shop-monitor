-- Create products table
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for user data
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    encrypted_password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_sessions table for tracking login activity
CREATE TABLE public.user_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    logout_time TIMESTAMP WITH TIME ZONE,
    ip_address TEXT,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create user_activity table for tracking user actions
CREATE TABLE public.user_activity (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.user_sessions(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    action_details JSONB,
    page_visited TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles table for admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Products are publicly viewable
CREATE POLICY "Products are publicly viewable" ON public.products FOR SELECT USING (true);

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User sessions policies
CREATE POLICY "Users can view their own sessions" ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions" ON public.user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.user_sessions FOR UPDATE USING (auth.uid() = user_id);

-- User activity policies
CREATE POLICY "Users can view their own activity" ON public.user_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own activity" ON public.user_activity FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Admin function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Admin can view all data
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all sessions" ON public.user_sessions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view all activity" ON public.user_activity FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Insert sample products
INSERT INTO public.products (name, description, price, category, image_url, stock) VALUES
('iPhone 15 Pro', 'Latest Apple smartphone with A17 Pro chip', 999.99, 'Smartphones', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', 50),
('MacBook Pro 14"', 'M3 Pro chip, 18GB RAM, 512GB SSD', 1999.99, 'Laptops', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400', 30),
('Sony WH-1000XM5', 'Premium noise-canceling headphones', 349.99, 'Audio', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 100),
('Samsung 55" OLED TV', '4K Smart TV with Dolby Vision', 1299.99, 'TVs', 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400', 25),
('iPad Pro 12.9"', 'M2 chip, Liquid Retina XDR display', 1099.99, 'Tablets', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400', 40),
('AirPods Pro 2', 'Active noise cancellation, spatial audio', 249.99, 'Audio', 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400', 150),
('Dell XPS 15', 'Intel Core i9, 32GB RAM, RTX 4060', 2199.99, 'Laptops', 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400', 20),
('Samsung Galaxy S24', 'AI-powered smartphone with Galaxy AI', 899.99, 'Smartphones', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', 60);