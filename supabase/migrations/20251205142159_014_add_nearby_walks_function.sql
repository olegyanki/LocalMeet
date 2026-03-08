-- Create RPC function to get nearby walks with distance calculation
CREATE OR REPLACE FUNCTION public.get_nearby_walks(
  user_lat NUMERIC,
  user_lng NUMERIC,
  radius_km NUMERIC DEFAULT 15
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  start_time TIMESTAMPTZ,
  duration BIGINT,
  description TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.user_id,
    w.title,
    w.start_time,
    w.duration,
    w.description,
    w.latitude,
    w.longitude,
    w.image_url,
    w.created_at,
    w.updated_at,
    -- Calculate distance using Haversine formula (result in km)
    (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(user_lat)) * 
          cos(radians(w.latitude)) * 
          cos(radians(w.longitude) - radians(user_lng)) + 
          sin(radians(user_lat)) * 
          sin(radians(w.latitude))
        ))
      )
    ) AS distance
  FROM public.walks w
  WHERE 
    w.deleted = false AND
    w.start_time > NOW() AND
    -- Bounding box filter (faster pre-filter)
    w.latitude BETWEEN user_lat - (radius_km / 111.0) AND user_lat + (radius_km / 111.0) AND
    w.longitude BETWEEN user_lng - (radius_km / (111.0 * cos(radians(user_lat)))) AND user_lng + (radius_km / (111.0 * cos(radians(user_lat))))
  HAVING
    -- Exact distance filter
    (
      6371 * acos(
        LEAST(1.0, GREATEST(-1.0,
          cos(radians(user_lat)) * 
          cos(radians(w.latitude)) * 
          cos(radians(w.longitude) - radians(user_lng)) + 
          sin(radians(user_lat)) * 
          sin(radians(w.latitude))
        ))
      )
    ) <= radius_km
  ORDER BY distance ASC;
END;
$$ LANGUAGE plpgsql STABLE;
