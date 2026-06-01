-- Tighten the public SELECT policy on food_truck_locations so only locations
-- belonging to approved businesses are visible to anonymous/non-owner users.
DROP POLICY IF EXISTS "Anyone can view active food truck locations" ON food_truck_locations;

CREATE POLICY "Anyone can view active food truck locations"
  ON food_truck_locations
  FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = food_truck_locations.business_id
        AND b.status = 'approved'
    )
  );
