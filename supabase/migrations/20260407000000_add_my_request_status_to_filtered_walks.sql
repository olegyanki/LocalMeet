-- Migration: Add my_request_status to get_nearby_walks_filtered
-- 
-- Adds p_user_id parameter and my_request_status return field.
-- LEFT JOINs walk_requests to return the current user's request status per walk.

DROP FUNCTION IF EXISTS public.get_nearby_walks_filtered(double precision, double precision, double precision, text[], text, double precision);

CREATE OR REPLACE FUNCTION public.get_nearby_walks_filtered(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km double precision DEFAULT 15,
  p_interests text[] DEFAULT NULL,
  p_time_filter text DEFAULT 'all',
  p_max_distance_km double precision DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  title text,
  start_time timestamp with time zone,
  duration bigint,
  description text,
  latitude double precision,
  longitude double precision,
  image_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  distance double precision,
  host_first_name text,
  host_last_name text,
  host_avatar_url text,
  host_interests text[],
  walk_type text,
  host_occupation text,
  my_request_status text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_time_start TIMESTAMP WITH TIME ZONE;
  v_time_end TIMESTAMP WITH TIME ZONE;
BEGIN
  CASE p_time_filter
    WHEN 'now' THEN
      v_time_start := NOW();
      v_time_end := NOW() + INTERVAL '2 hours';
    WHEN 'today' THEN
      v_time_start := DATE_TRUNC('day', NOW());
      v_time_end := DATE_TRUNC('day', NOW()) + INTERVAL '1 day';
    WHEN 'tomorrow' THEN
      v_time_start := DATE_TRUNC('day', NOW()) + INTERVAL '1 day';
      v_time_end := DATE_TRUNC('day', NOW()) + INTERVAL '2 days';
    WHEN 'this_week' THEN
      v_time_start := DATE_TRUNC('week', NOW());
      v_time_end := DATE_TRUNC('week', NOW()) + INTERVAL '1 week';
    ELSE
      v_time_start := NOW();
      v_time_end := NOW() + INTERVAL '100 years';
  END CASE;

  RETURN QUERY
  SELECT 
    w.id,
    w.user_id,
    w.title,
    w.start_time,
    w.duration::BIGINT,
    w.description,
    w.latitude::DOUBLE PRECISION,
    w.longitude::DOUBLE PRECISION,
    w.image_url,
    w.created_at,
    w.updated_at,
    earth_distance(
      ll_to_earth(p_latitude, p_longitude),
      ll_to_earth(w.latitude, w.longitude)
    ) / 1000.0 AS distance,
    p.first_name AS host_first_name,
    p.last_name AS host_last_name,
    p.avatar_url AS host_avatar_url,
    p.interests AS host_interests,
    w.type AS walk_type,
    p.occupation AS host_occupation,
    wr.status AS my_request_status
  FROM walks w
  INNER JOIN profiles p ON w.user_id = p.id
  LEFT JOIN walk_requests wr 
    ON wr.walk_id = w.id 
    AND wr.requester_id = p_user_id
  WHERE 
    w.deleted = false
    AND earth_box(ll_to_earth(p_latitude, p_longitude), p_radius_km * 1000) 
      @> ll_to_earth(w.latitude, w.longitude)
    AND (
      w.start_time BETWEEN v_time_start AND v_time_end
      OR
      (w.start_time <= NOW() AND w.start_time + (w.duration * INTERVAL '1 second') > NOW())
    )
    AND (p_interests IS NULL OR p.interests && p_interests)
    AND (p_max_distance_km IS NULL OR 
         earth_distance(
           ll_to_earth(p_latitude, p_longitude),
           ll_to_earth(w.latitude, w.longitude)
         ) / 1000.0 <= p_max_distance_km)
  ORDER BY distance;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_nearby_walks_filtered(
  double precision, double precision, double precision, text[], text, double precision, uuid
) TO authenticated;
