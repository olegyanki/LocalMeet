import { supabase } from '../supabase';
import type { Database } from '../database.types';

type GetNearbyWalksRow = Database['public']['Functions']['get_nearby_walks']['Returns'][number];
type GetNearbyWalksFilteredRow = Database['public']['Functions']['get_nearby_walks_filtered']['Returns'][number];
type GetWalksByUserIdRow = Database['public']['Functions']['get_walks_by_user_id']['Returns'][number];

import type { WalkHost } from './profiles';

export interface Walk {
  id: string;
  user_id: string;
  title: string | null;
  start_time: string;
  duration: number;
  description: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  type?: 'event' | 'live';
}

export interface NearbyWalk {
  distance: number; // in meters
  walk: Walk | null;
  host?: WalkHost;
  my_request_status?: string | null;
}

export interface CreateLiveWalkParams {
  userId: string;
  latitude: number;
  longitude: number;
  statusText: string;
}

export async function createWalk(data: {
  userId: string;
  title: string;
  startTime: string;
  duration: number;
  description?: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
}) {
  // Insert the walk - the database trigger will automatically create a group chat
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
      image_url: data.imageUrl || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return walk;
}

export async function createLiveWalk(params: CreateLiveWalkParams): Promise<Walk> {
  const { data: walk, error } = await supabase
    .from('walks')
    .insert({
      user_id: params.userId,
      title: null,
      start_time: new Date().toISOString(),
      duration: 7200,
      description: params.statusText || null,
      latitude: params.latitude,
      longitude: params.longitude,
      image_url: null,
      type: 'live',
    })
    .select()
    .single();

  if (error) {
    if (error.message?.includes('TIME_OVERLAP')) {
      throw new Error('TIME_OVERLAP');
    }
    throw error;
  }

  return walk;
}

export async function deleteWalk(walkId: string) {
  const { data, error } = await supabase
    .from('walks')
    .update({
      deleted: true
    })
    .eq('id', walkId)
    .select();

  if (error) {
    throw error;
  }
}

export async function getWalksByUserId(userId: string): Promise<Walk[]> {
  const { data, error } = await supabase.rpc('get_walks_by_user_id', {
    p_user_id: userId,
  });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((row: GetWalksByUserIdRow) => ({
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    start_time: row.start_time,
    duration: row.duration,
    description: row.description ?? null,
    latitude: row.latitude,
    longitude: row.longitude,
    image_url: row.image_url ?? null,
    type: (row.type as 'event' | 'live') ?? undefined,
  }));
}

export async function getWalkById(walkId: string): Promise<Walk | null> {
  const { data, error } = await supabase
    .from('walks')
    .select('*')
    .eq('id', walkId)
    .eq('deleted', false)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function getNearbyWalks(
  latitude: number,
  longitude: number,
  radiusKm: number = 15
): Promise<NearbyWalk[]> {
  const { data, error } = await supabase.rpc('get_nearby_walks', {
    p_latitude: latitude,
    p_longitude: longitude,
    p_radius_km: radiusKm,
  });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((row: GetNearbyWalksRow) => ({
    distance: row.distance,
    walk: {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      start_time: row.start_time,
      duration: row.duration,
      description: row.description ?? null,
      latitude: row.latitude,
      longitude: row.longitude,
      image_url: row.image_url ?? null,
    },
  }));
}

export async function getNearbyWalksFiltered(
  latitude: number,
  longitude: number,
  radiusKm: number = 15,
  interests?: string[],
  timeFilter?: 'now' | 'today' | 'tomorrow' | 'this_week' | 'all',
  maxDistanceKm?: number,
  userId?: string
): Promise<NearbyWalk[]> {
  try {
    const { data, error } = await supabase.rpc('get_nearby_walks_filtered', {
      p_latitude: latitude,
      p_longitude: longitude,
      p_radius_km: radiusKm,
      p_interests: interests,
      p_time_filter: timeFilter,
      p_max_distance_km: maxDistanceKm,
      p_user_id: userId,
    });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform RPC result to NearbyWalk format
    return data.map((row: GetNearbyWalksFilteredRow) => ({
      distance: row.distance,
      walk: {
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        start_time: row.start_time,
        duration: row.duration,
        description: row.description ?? null,
        latitude: row.latitude,
        longitude: row.longitude,
        image_url: row.image_url ?? null,
        type: (row.walk_type as 'event' | 'live') ?? 'event',
      },
      host: {
        first_name: row.host_first_name,
        last_name: row.host_last_name ?? null,
        avatar_url: row.host_avatar_url ?? null,
        occupation: row.host_occupation ?? null,
      },
      my_request_status: row.my_request_status ?? null,
    }));
  } catch (error) {
    console.error('Error fetching filtered nearby walks:', error);
    throw error;
  }
}
