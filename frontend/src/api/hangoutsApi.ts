import API from './index';

export type Hangout = {
  id: string;
  authHangoutId: string;
  participantAuthUserIds: string[];
  hangoutName: string;
  location: string;
  startTime: string;
  endTime: string;
  description: string;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HangoutRequest = Pick<
  Hangout,
  | 'participantAuthUserIds'
  | 'hangoutName'
  | 'location'
  | 'startTime'
  | 'endTime'
  | 'description'
  | 'isOpen'
>;

export async function getHangoutsForUser(authUserId: string) {
  const response = await API.get<Hangout[]>(`/api/hangouts/user/${authUserId}`);
  return response.data;
}

export async function createHangout(body: HangoutRequest) {
  const authHangoutId = createObjectId();
  const response = await API.post<Hangout>(`/api/hangouts/${authHangoutId}/create`, body);
  return response.data;
}

export async function updateHangout(authHangoutId: string, body: HangoutRequest) {
  const response = await API.put<Hangout>(`/api/hangouts/${authHangoutId}/update`, body);
  return response.data;
}

function createObjectId() {
  const timestamp = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0');
  const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(
    '',
  );
  return `${timestamp}${random}`;
}
