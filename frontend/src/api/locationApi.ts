import API from './index';

export type LocationVisitSummary = {
  location: string;
  visitCount: number;
  lastVisitedAt: string;
};

export type FriendLocationVisit = {
  authUserId: string;
  visitCount: number;
  lastVisitedAt: string;
};

export type VisitSyncResponse = {
  completedHangoutsProcessed: number;
  visitsRecorded: number;
};

/** Immediately processes completed hangouts; the backend also runs this every minute. */
export async function syncLocationVisits() {
  const response = await API.post<VisitSyncResponse>('/api/locations/visits/sync');
  return response.data;
}

export async function getUserLocationVisits(authUserId: string) {
  const response = await API.get<LocationVisitSummary[]>(
    `/api/locations/visits/users/${encodeURIComponent(authUserId)}`,
  );
  return response.data;
}

export async function getFriendLocationVisits(location: string, friendAuthUserIds: string[]) {
  if (!location.trim() || friendAuthUserIds.length === 0) return [];

  const response = await API.post<FriendLocationVisit[]>('/api/locations/visits/friends', {
    location: location.trim(),
    friendAuthUserIds,
  });
  return response.data;
}
