-- Menu items table for food-type businesses (restaurants, food trucks, cafes)
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER,
  image_url TEXT,
  category TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_menu_items_business_id ON public.menu_items(business_id);
CREATE INDEX idx_menu_items_sort_order ON public.menu_items(business_id, sort_order);

-- Anyone can read menu items for approved businesses
CREATE POLICY "Anyone can view menu items of approved businesses"
  ON public.menu_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = menu_items.business_id
      AND status = 'approved'
    )
    OR
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = menu_items.business_id
      AND owner_user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.business_staff
      WHERE business_id = menu_items.business_id
      AND user_id = auth.uid()
    )
  );

-- Business owner can manage menu items
CREATE POLICY "Business owners can manage menu items"
  ON public.menu_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE id = menu_items.business_id
      AND owner_user_id = auth.uid()
    )
  );

-- Staff can manage menu items
CREATE POLICY "Staff can manage menu items"
  ON public.menu_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.business_staff
      WHERE business_id = menu_items.business_id
      AND user_id = auth.uid()
    )
  );

-- Admins can manage all menu items
CREATE POLICY "Admins can manage all menu items"
  ON public.menu_items FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
