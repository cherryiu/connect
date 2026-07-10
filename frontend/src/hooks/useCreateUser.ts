// frontend/src/hooks/useCreateUser.ts
import { useState } from 'react';
import { createUser, UserProfileRequest } from '../api/usersApi';

export function useCreateUser() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitCreateUser = async (UserProfileRequest: UserProfileRequest) => {
    try {
      setIsCreating(true);
      setError(null);

      // createUser makes api call
      const user = await createUser(UserProfileRequest);
      return user;
    } catch {
      setError('Unable to create user');
      throw new Error('Unable to create user');
    } finally {
      setIsCreating(false);
    }
  };

  return {
    submitCreateUser,
    isCreating,
    error,
  };
}
