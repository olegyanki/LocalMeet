-- Bug 1.8: Client-Side Filtering and Sorting
-- Create enhanced RPC function with server-side filtering
-- 
-- Current Behavior (Defect):
-- - SearchScreen fetches all nearby walks
-- - Filters by interests, time range, distance in JavaScript
-- - Sorts in JavaScript
-- - Wastes network bandwidth and CPU cycles
--
-- Expected Behavior (After Fix):
-- - Database performs filtering and sorting
-- - Only matching walks returned
-- - Reduced data transfer and improved performance
--
-- Parameters:
-- - p_latitude, p_longitude: User's location
-- - p_radius_km: Search radius (default 15km)
-- - p_interests: Array of interest tags to filter by (NULL = no filter)
-- - p_time_filter: Time range filter ('now', 'today', 'tomorrow', 'this_week', 'all')
-- - p_max_distance_km: Maximum distance filter (NULL = use radius)
--
-- Returns:
-- - Walks matching all filters, sorted by distance ascending
-- - Includes host profile info and interests for client display

CREATE OR REPLACE FUNCTION public.get_nearby_walks_filtered(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km double precision DEFAULT 15,
  p_interests text[] DEFAULT NULL,
  p_time_filter text DEFAULT 'all',
  p_max_distance_km double precision DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  title text,
  start_time timestamp with time zone,
  duration integer,
  description text,
  latitude double precision,
  longitude double precision,
  image_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  distance double precision,
  host_username text,
  host_display_name text,
  host_avatar_url text,
  host_interests text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.user_id,
    w.title,
    w.start_time,
    w.duration::integer,
    w.description,
    w.latitude::double precision,
    w.longitude::double precision,
    w.image_url,
    w.created_at,
    w.updated_at,
    earth_distance(
      ll_to_earth(w.latitude::double precision, w.longitude::double precision),
      ll_to_earth(p_latitude::double precision, p_longitude::double precision)
    ) AS distance,
    p.username AS host_username,
    p.display_name AS host_display_name,
    p.avatar_url AS host_avatar_url,
    p.interests AS host_interests
  FROM public.walks w
  INNER JOIN public.profiles p ON w.user_id = p.id
  WHERE 
    -- Basic filters (always applied)
    (w.deleted IS NULL OR w.deleted = FALSE)
    AND (w.start_time + (w.duration || ' seconds')::interval) > now()
    
    -- Time range filter
    AND (
      CASE p_time_filter
        WHEN 'now' THEN 
          w.start_time <= now() + interval '30 minutes'
        WHEN 'today' THEN 
          w.start_time::date = CURRENT_DATE
        WHEN 'tomorrow' THEN 
          w.start_time::date = CURRENT_DATE + 1
        WHEN 'this_week' THEN 
          w.start_time < now() + interval '7 days'
        ELSE 
          TRUE  -- 'all' or NULL: no time filter
      END
    )
    
    -- Interest filter using array overlap operator
    AND (p_interests IS NULL OR p.interests && p_interests)
    
    -- Distance filter (use max_distance if specified, otherwise use radius)
    AND earth_distance(
      ll_to_earth(w.latitude::double precision, w.longitude::double precision),
      ll_to_earth(p_latitude::double precision, p_longitude::double precision)
    ) <= (COALESCE(p_max_distance_km, p_radius_km) * 1000)
  
  -- Sort by distance ascending (closest first)
  ORDER BY distance ASC;
END;
$function$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_nearby_walks_filtered(
  double precision,
  double precision,
  double precision,
  text[],
  text,
  double precision
) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.get_nearby_walks_filtered IS 
  'Returns nearby walks with server-side filtering by interests, time range, and distance. Replaces client-side filtering in SearchScreen for better performance.';
