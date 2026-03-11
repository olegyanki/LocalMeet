-- Fix get_nearby_walks function to use correct search_path
-- Bug: Function has SET search_path TO '' which prevents finding ll_to_earth and earth_distance functions
-- Fix: Set search_path to 'public' to access earthdistance extension functions

CREATE OR REPLACE FUNCTION public.get_nearby_walks(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km double precision
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
  distance double precision
)
LANGUAGE sql
STABLE
SET search_path TO 'public'  -- Changed from '' to 'public' to access extension functions
AS $function$
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
    earth_distance(
      ll_to_earth(w.latitude::double precision, w.longitude::double precision),
      ll_to_earth(p_latitude::double precision, p_longitude::double precision)
    ) AS distance
  FROM public.walks w
  JOIN public.profiles p ON w.user_id = p.id
  WHERE
    (w.deleted IS NULL OR w.deleted = FALSE)
    AND (w.start_time + (w.duration || ' seconds')::interval) > now()
    AND earth_distance(
          ll_to_earth(w.latitude::double precision, w.longitude::double precision),
          ll_to_earth(p_latitude::double precision, p_longitude::double precision)
        ) <= (p_radius_km * 1000)
  ORDER BY distance;
$function$;

-- Rollback SQL:
-- CREATE OR REPLACE FUNCTION public.get_nearby_walks(p_latitude double precision, p_longitude double precision, p_radius_km double precision)
-- RETURNS TABLE(id uuid, user_id uuid, title text, start_time timestamp with time zone, duration integer, description text, latitude double precision, longitude double precision, image_url text, distance double precision)
-- LANGUAGE sql STABLE SET search_path TO ''
-- AS $function$
--   SELECT w.id, w.user_id, w.title, w.start_time, w.duration, w.description, w.latitude, w.longitude, w.image_url,
--     earth_distance(ll_to_earth(w.latitude::double precision, w.longitude::double precision), ll_to_earth(p_latitude::double precision, p_longitude::double precision)) AS distance
--   FROM public.walks w JOIN public.profiles p ON w.user_id = p.id
--   WHERE (w.deleted IS NULL OR w.deleted = FALSE) AND (w.start_time + (w.duration || ' seconds')::interval) > now()
--     AND earth_distance(ll_to_earth(w.latitude::double precision, w.longitude::double precision), ll_to_earth(p_latitude::double precision, p_longitude::double precision)) <= (p_radius_km * 1000)
--   ORDER BY distance;
-- $function$;
