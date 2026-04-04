import { supabase } from '../supabase';
import type { Database } from '../database.types';

type GetWalkRequestsForOwnerRow = Database['public']['Functions']['get_walk_requests_for_owner']['Returns'][number];
type GetWalkParticipantsRow = Database['public']['Functions']['get_walk_participants']['Returns'][number];

import type { UserProfile } from './profiles';
import type { Walk } from './walks';

export interface WalkRequest {
  id: string;
  walk_id: string;
  requester_id: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface WalkRequestWithProfile extends WalkRequest {
  requester: UserProfile;
  walk: Walk;
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
  // Update the request status - the database trigger will automatically add participant to group chat if accepted
  const { error } = await supabase
    .from('walk_requests')
    .update({ status })
    .eq('id', requestId);

  if (error) {
    throw error;
  }
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

/**
 * Get walk requests for the owner using optimized RPC (single JOIN query).
 * Replaces getMyWalkRequests, getPendingWalkRequests, and getPastWalkRequests.
 *
 * @param userId - Walk owner's user ID
 * @param status - 'pending' for active requests, 'past' for accepted/rejected
 */
export async function getWalkRequests(
  userId: string,
  status: 'pending' | 'past'
): Promise<WalkRequestWithProfile[]> {
  const { data, error } = await supabase.rpc('get_walk_requests_for_owner', {
    p_user_id: userId,
    p_status: status,
  });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((row: GetWalkRequestsForOwnerRow) => ({
    id: row.request_id,
    walk_id: row.walk_id,
    requester_id: row.requester_id,
    message: row.message,
    status: row.status as 'pending' | 'accepted' | 'rejected',
    created_at: row.request_created_at,
    updated_at: row.request_updated_at,
    requester: {
      id: row.requester_id,
      first_name: row.requester_first_name,
      last_name: row.requester_last_name ?? null,
      bio: row.requester_bio ?? null,
      avatar_url: row.requester_avatar_url ?? null,
      gender: row.requester_gender ?? null,
      occupation: row.requester_occupation ?? null,
      languages: row.requester_languages ?? [],
      interests: row.requester_interests ?? [],
      social_instagram: row.requester_social_instagram ?? null,
      social_telegram: row.requester_social_telegram ?? null,
    },
    walk: {
      id: row.walk_id,
      user_id: row.walk_user_id,
      title: row.walk_title ?? null,
      start_time: row.walk_start_time,
      duration: row.walk_duration,
      description: row.walk_description ?? null,
      latitude: row.walk_latitude,
      longitude: row.walk_longitude,
      image_url: row.walk_image_url ?? null,
      type: (row.walk_type as 'event' | 'live') ?? undefined,
    },
  }));
}

/** @deprecated Use getWalkRequests(userId, 'pending') instead */
export async function getPendingWalkRequests(userId: string): Promise<WalkRequestWithProfile[]> {
  return getWalkRequests(userId, 'pending');
}

/** @deprecated Use getWalkRequests(userId, 'past') instead */
export async function getPastWalkRequests(userId: string): Promise<WalkRequestWithProfile[]> {
  return getWalkRequests(userId, 'past');
}

export async function getWalkParticipants(walkId: string): Promise<UserProfile[]> {
  const { data, error } = await supabase.rpc('get_walk_participants', {
    p_walk_id: walkId,
  });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((row: GetWalkParticipantsRow) => ({
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name ?? null,
    bio: row.bio ?? null,
    avatar_url: row.avatar_url ?? null,
    gender: row.gender ?? null,
    occupation: row.occupation ?? null,
    languages: row.languages ?? [],
    interests: row.interests ?? [],
    social_instagram: row.social_instagram ?? null,
    social_telegram: row.social_telegram ?? null,
  }));
}
