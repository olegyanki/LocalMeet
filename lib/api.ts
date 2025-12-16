import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  status: string | null;
  age: number | null;
  gender: string | null;
  languages: string[];
  interests: string[];
  social_instagram: string | null;
  social_telegram: string | null;
  looking_for: string | null;
}

export interface Walk {
  id: string;
  user_id: string;
  title: string;
  start_time: string;
  duration: string;
  description: string | null;
  latitude: number;
  longitude: number;
  is_active: boolean;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserLocation {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  updated_at: string;
}

export interface NearbyUser extends UserProfile {
  distance: number;
  location: UserLocation | null;
  walk: Walk | null;
}

export async function updateProfile(userId: string, data: Partial<UserProfile>) {
  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', userId);

  if (error) {
    throw error;
  }
}

export async function updateLocation(userId: string, latitude: number, longitude: number) {
  const { data: existing } = await supabase
    .from('user_locations')
    .select()
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('user_locations')
      .update({ latitude, longitude, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('user_locations').insert({
      user_id: userId,
      latitude,
      longitude,
    });
    if (error) throw error;
  }
}

function parseDuration(duration: string | null): number {
  if (!duration) return 0;

  const parts = duration.toLowerCase().split(' ');
  let totalMinutes = 0;

  for (let i = 0; i < parts.length; i += 2) {
    const value = parseInt(parts[i]);
    const unit = parts[i + 1];

    if (unit?.includes('hour') || unit?.includes('год')) {
      totalMinutes += value * 60;
    } else if (unit?.includes('minute') || unit?.includes('хв')) {
      totalMinutes += value;
    }
  }

  return totalMinutes;
}

function isWalkStillActive(walkStartTime: string | null, walkDuration: string | null): boolean {
  if (!walkStartTime) return false;

  const now = new Date();
  const startTime = new Date(walkStartTime);

  if (isNaN(startTime.getTime())) return false;

  const durationMinutes = parseDuration(walkDuration);
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

  return now < endTime;
}

export async function getNearbyUsers(latitude: number, longitude: number, radiusKm: number = 5) {
  // Отримуємо всі активні прогулянки
  const { data: walks, error: walksError } = await supabase
    .from('walks')
    .select('*')
    .eq('is_active', true)
    .or('deleted.is.null,deleted.eq.false');

  console.log('getNearbyUsers: raw walks from DB:', walks?.map(w => ({
    id: w.id,
    user_id: w.user_id,
    start_time: w.start_time,
    duration: w.duration
  })));

  if (walksError) {
    throw walksError;
  }

  if (!walks || walks.length === 0) {
    return [];
  }

  // Фільтруємо тільки активні прогулянки за часом
  const activeWalks = walks.filter(walk =>
    isWalkStillActive(walk.start_time, walk.duration)
  );

  if (activeWalks.length === 0) {
    return [];
  }

  // Отримуємо профілі користувачів, які мають активні прогулянки
  const userIds = activeWalks.map(w => w.user_id);
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds);

  if (profileError) {
    throw profileError;
  }

  if (!profiles || profiles.length === 0) {
    return [];
  }

  // Отримуємо локації користувачів
  const { data: locations, error } = await supabase.from('user_locations').select('*');

  if (error) {
    throw error;
  }

  const profilesWithDistance = profiles
    ?.map((profile) => {
      const walk = activeWalks.find(w => w.user_id === profile.id);
      if (!walk) return null;

      const userLocation = locations?.find((loc) => loc.user_id === profile.id);

      // Використовуємо координати з прогулянки
      const markerLat = walk.latitude;
      const markerLng = walk.longitude;

      // Відстань рахуємо від локації прогулянки
      const distance = calculateDistance(latitude, longitude, markerLat, markerLng);

      // Створюємо location об'єкт з координатами прогулянки
      const location = {
        id: userLocation?.id || '',
        user_id: profile.id,
        latitude: markerLat,
        longitude: markerLng,
        updated_at: walk.updated_at,
      };

      return {
        ...profile,
        distance,
        location,
        walk,
      };
    })
    .filter((profile): profile is NonNullable<typeof profile> =>
      profile !== null && profile.distance <= radiusKm
    );

  return profilesWithDistance?.sort((a, b) => a.distance - b.distance) || [];
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function sendConnectionRequest(fromUserId: string, toUserId: string) {
  const { data, error } = await supabase
    .from('connection_requests')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      status: 'pending',
    })
    .select();

  if (error) {
    throw error;
  }

  return data?.[0];
}

export async function respondToConnectionRequest(
  requestId: string,
  status: 'accepted' | 'rejected'
) {
  const { error } = await supabase
    .from('connection_requests')
    .update({ status })
    .eq('id', requestId);

  if (error) {
    throw error;
  }
}

export async function getConnectionRequests(userId: string) {
  const { data, error } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('to_user_id', userId)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getConnectionRequestsSent(userId: string) {
  const { data, error } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('from_user_id', userId)
    .eq('status', 'pending');

  if (error) {
    throw error;
  }

  return data || [];
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export async function createWalk(data: {
  userId: string;
  title: string;
  startTime: string;
  duration: string;
  description?: string;
  latitude: number;
  longitude: number;
}) {
  const { data: walk, error } = await supabase
    .from('walks')
    .insert({
      user_id: data.userId,
      title: data.title,
      start_time: data.startTime,
      duration: data.duration,
      description: data.description || null,
      latitude: data.latitude,
      longitude: data.longitude,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return walk;
}

export async function endWalk(walkId: string) {
  const { error } = await supabase
    .from('walks')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', walkId);

  if (error) {
    throw error;
  }
}

export async function deleteWalk(walkId: string) {
  const { data, error } = await supabase
    .from('walks')
    .update({
      deleted: true,
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', walkId)
    .select();

  if (error) {
    throw error;
  }
}

export async function getActiveWalkByUserId(userId: string): Promise<Walk | null> {
  const { data, error } = await supabase
    .from('walks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .or('deleted.is.null,deleted.eq.false')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateWalkStatus(userId: string, data: {
  isWalking: boolean;
  walkTitle?: string;
  walkStartTime?: string;
  walkDuration?: string;
  walkDescription?: string;
  walkLatitude?: number;
  walkLongitude?: number;
}) {
  if (data.isWalking) {
    // Деактивуємо всі попередні прогулянки користувача
    await supabase
      .from('walks')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    // Створюємо нову прогулянку
    await createWalk({
      userId,
      title: data.walkTitle!,
      startTime: data.walkStartTime!,
      duration: data.walkDuration!,
      description: data.walkDescription,
      latitude: data.walkLatitude!,
      longitude: data.walkLongitude!,
    });
  } else {
    // Завершуємо всі активні прогулянки користувача
    await supabase
      .from('walks')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_active', true);
  }
}

export interface WalkRequest {
  id: string;
  walk_id: string;
  requester_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export async function createWalkRequest(data: {
  walkId: string;
  requesterId: string;
  message: string;
}) {
  const { data: request, error } = await supabase
    .from('walk_requests')
    .insert({
      walk_id: data.walkId,
      requester_id: data.requesterId,
      message: data.message,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return request;
}

export async function updateWalkRequestStatus(
  requestId: string,
  status: 'accepted' | 'rejected'
) {
  const { error } = await supabase
    .from('walk_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', requestId);

  if (error) {
    throw error;
  }
}

export async function getWalkRequestsForWalk(walkId: string): Promise<WalkRequest[]> {
  const { data, error } = await supabase
    .from('walk_requests')
    .select('*')
    .eq('walk_id', walkId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getMyRequestForWalk(
  walkId: string,
  requesterId: string
): Promise<WalkRequest | null> {
  const { data, error } = await supabase
    .from('walk_requests')
    .select('*')
    .eq('walk_id', walkId)
    .eq('requester_id', requesterId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export interface WalkRequestWithProfile extends WalkRequest {
  requester: UserProfile;
  walk: Walk;
}

export async function getMyWalkRequests(userId: string): Promise<WalkRequestWithProfile[]> {
  const { data: myWalks, error: walksError } = await supabase
    .from('walks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .or('deleted.is.null,deleted.eq.false');

  if (walksError) {
    throw walksError;
  }

  if (!myWalks || myWalks.length === 0) {
    return [];
  }

  const walkIds = myWalks.map(w => w.id);

  const { data: requests, error: requestsError } = await supabase
    .from('walk_requests')
    .select('*')
    .in('walk_id', walkIds)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (requestsError) {
    throw requestsError;
  }

  if (!requests || requests.length === 0) {
    return [];
  }

  const requesterIds = [...new Set(requests.map(r => r.requester_id))];

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .in('id', requesterIds);

  if (profilesError) {
    throw profilesError;
  }

  const requestsWithProfiles = requests.map(request => {
    const requester = profiles?.find(p => p.id === request.requester_id);
    const walk = myWalks.find(w => w.id === request.walk_id);

    return {
      ...request,
      requester: requester!,
      walk: walk!,
    };
  }).filter(r => r.requester && r.walk);

  return requestsWithProfiles;
}
