-- Create role enum
CREATE TYPE public.app_role AS ENUM ('resident', 'business', 'admin');

-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create neighborhoods table
CREATE TABLE public.neighborhoods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    neighborhood_id UUID REFERENCES public.neighborhoods(id),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'resident',
    UNIQUE (user_id, role)
);

-- Create businesses table
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id),
    neighborhood_id UUID REFERENCES public.neighborhoods(id),
    address TEXT,
    phone TEXT,
    website TEXT,
    instagram TEXT,
    description TEXT,
    photos TEXT[] DEFAULT '{}',
    hours JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    verified BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deals table
CREATE TABLE public.deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    redemption_method TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events table
CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date_time TIMESTAMP WITH TIME ZONE,
    location_text TEXT,
    ticket_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create requests table
CREATE TABLE public.requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id),
    neighborhood_id UUID REFERENCES public.neighborhoods(id),
    title TEXT NOT NULL,
    description TEXT,
    budget_min NUMERIC,
    budget_max NUMERIC,
    needed_by_date_time TIMESTAMP WITH TIME ZONE,
    contact_preference TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('request', 'contact')),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    request_id UUID REFERENCES public.requests(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT,
    contact_info TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plans table
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price_monthly NUMERIC NOT NULL,
    features TEXT[] DEFAULT '{}',
    lead_access_level TEXT DEFAULT 'locked',
    boost_credits_per_month INTEGER DEFAULT 0,
    deals_per_month INTEGER DEFAULT 1,
    events_per_month INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    renewal_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create boosts table
CREATE TABLE public.boosts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('deal', 'event', 'business')),
    content_id UUID NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    amount_paid NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved_items table for favorites
CREATE TABLE public.saved_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('business', 'deal', 'event')),
    item_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, item_type, item_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursive RLS)
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
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Function to get user's business id
CREATE OR REPLACE FUNCTION public.get_user_business_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.businesses WHERE owner_user_id = _user_id LIMIT 1
$$;

-- RLS Policies

-- Categories & Neighborhoods (public read)
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view neighborhoods" ON public.neighborhoods FOR SELECT USING (true);
CREATE POLICY "Admins can manage neighborhoods" ON public.neighborhoods FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Plans (public read)
CREATE POLICY "Anyone can view plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage plans" ON public.plans FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User Roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Businesses
CREATE POLICY "Anyone can view approved businesses" ON public.businesses FOR SELECT USING (status = 'approved' OR owner_user_id = auth.uid());
CREATE POLICY "Business owners can manage own business" ON public.businesses FOR ALL TO authenticated USING (owner_user_id = auth.uid());
CREATE POLICY "Admins can manage all businesses" ON public.businesses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Deals
CREATE POLICY "Anyone can view approved deals" ON public.deals FOR SELECT USING (status = 'approved');
CREATE POLICY "Business owners can manage own deals" ON public.deals FOR ALL TO authenticated 
    USING (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Admins can manage all deals" ON public.deals FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Events
CREATE POLICY "Anyone can view approved events" ON public.events FOR SELECT USING (status = 'approved');
CREATE POLICY "Business owners can manage own events" ON public.events FOR ALL TO authenticated 
    USING (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Admins can manage all events" ON public.events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Requests
CREATE POLICY "Anyone authenticated can view open requests" ON public.requests FOR SELECT TO authenticated USING (status = 'open' OR created_by_user_id = auth.uid());
CREATE POLICY "Users can manage own requests" ON public.requests FOR ALL TO authenticated USING (created_by_user_id = auth.uid());
CREATE POLICY "Admins can manage all requests" ON public.requests FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Leads
CREATE POLICY "Business owners can view own leads" ON public.leads FOR SELECT TO authenticated 
    USING (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Users can create leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Business owners can update own leads" ON public.leads FOR UPDATE TO authenticated 
    USING (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Admins can view all leads" ON public.leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Subscriptions
CREATE POLICY "Business owners can view own subscription" ON public.subscriptions FOR SELECT TO authenticated 
    USING (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Boosts
CREATE POLICY "Business owners can view own boosts" ON public.boosts FOR SELECT TO authenticated 
    USING (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Business owners can create boosts" ON public.boosts FOR INSERT TO authenticated 
    WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_user_id = auth.uid()));
CREATE POLICY "Admins can manage all boosts" ON public.boosts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Saved Items
CREATE POLICY "Users can manage own saved items" ON public.saved_items FOR ALL TO authenticated USING (user_id = auth.uid());

-- Trigger to create profile and default role on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'resident');
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();