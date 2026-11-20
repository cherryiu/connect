import API from './index';

export type LocationVisitSummary = {
  location: string;
  visitCount: number;
  lastVisitedAt: string;
};

export type LocationVisitDetail = {
  entryId: string;
  authHangoutId?: string | null;
  location: string;
  visitedAt: string;
  companionAuthUserIds: string[];
  orderDescription?: string | null;
  orderRating?: number | null;
  notes?: string | null;
  attendanceConfirmed?: boolean | null;
  standaloneOrder?: boolean;
};

export type PendingLocationVisit = {
  authHangoutId: string;
  hangoutName?: string | null;
  location: string;
  visitedAt: string;
  attendanceConfirmed?: boolean | null;
};

export type VisitJournalRequest = {
  orderDescription?: string;
  orderRating?: number;
  notes?: string;
};

export type StandaloneOrderRequest = VisitJournalRequest & {
  location: string;
  orderDescription: string;
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

export async function getLocationVisitHistory(authUserId: string, location: string) {
  const response = await API.get<LocationVisitDetail[]>(
    `/api/locations/visits/users/${encodeURIComponent(authUserId)}/history`,
    { params: { location } },
  );
  return response.data;
}

export async function getPendingLocationVisits(authUserId: string) {
  const response = await API.get<PendingLocationVisit[]>(
    `/api/locations/visits/users/${encodeURIComponent(authUserId)}/pending`,
  );
  return response.data;
}

export async function confirmLocationVisitAttendance(
  authUserId: string,
  authHangoutId: string,
  attended: boolean,
) {
  await API.put(
    `/api/locations/visits/users/${encodeURIComponent(authUserId)}/hangouts/${encodeURIComponent(authHangoutId)}/attendance`,
    { attended },
  );
}

export async function updateLocationVisitJournal(
  authUserId: string,
  authHangoutId: string,
  journal: VisitJournalRequest,
) {
  const response = await API.put<LocationVisitDetail>(
    `/api/locations/visits/users/${encodeURIComponent(authUserId)}/hangouts/${encodeURIComponent(authHangoutId)}/journal`,
    journal,
  );
  return response.data;
}

export async function createStandaloneLocationOrder(
  authUserId: string,
  order: StandaloneOrderRequest,
) {
  const response = await API.post<LocationVisitDetail>(
    `/api/locations/visits/users/${encodeURIComponent(authUserId)}/orders`,
    order,
  );
  return response.data;
}

export async function updateStandaloneLocationOrder(
  authUserId: string,
  orderId: string,
  journal: VisitJournalRequest,
) {
  const response = await API.put<LocationVisitDetail>(
    `/api/locations/visits/users/${encodeURIComponent(authUserId)}/orders/${encodeURIComponent(orderId)}`,
    journal,
  );
  return response.data;
}

export async function deleteLocationVisit(authUserId: string, authHangoutId: string) {
  await API.delete(
    `/api/locations/visits/users/${encodeURIComponent(authUserId)}/hangouts/${encodeURIComponent(authHangoutId)}`,
  );
}

export async function deleteStandaloneLocationOrder(authUserId: string, orderId: string) {
  await API.delete(
    `/api/locations/visits/users/${encodeURIComponent(authUserId)}/orders/${encodeURIComponent(orderId)}`,
  );
}

export async function getFriendLocationVisits(location: string, friendAuthUserIds: string[]) {
  if (!location.trim() || friendAuthUserIds.length === 0) return [];

  const response = await API.post<FriendLocationVisit[]>('/api/locations/visits/friends', {
    location: location.trim(),
    friendAuthUserIds,
  });
  return response.data;
}
