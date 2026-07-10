// frontend/src/api/locations.ts
import API from './index';

export type SaveLocationRequest = {
  userId: string;
  placeId: string;
  address: string;
  latitude: number;
  longitude: number;
};

// TODO: these are generated methods, update to reflect true location microservice endpoints and request/response formats

export async function autocompletePlaces(input: string, sessionToken: string) {
  const response = await API.post('/api/locations/places/autocomplete', {
    input,
    sessionToken,
  });

  return response.data;
}

export async function getPlaceDetails(placeId: string, sessionToken: string) {
  const response = await API.post('/api/locations/places/details', {
    placeId,
    sessionToken,
  });

  return response.data;
}

export async function saveLocation(body: SaveLocationRequest) {
  const response = await API.post('/api/locations/save', body);
  return response.data;
}
