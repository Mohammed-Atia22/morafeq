import { apiRequest } from '../../../services/api'

export const onboardingApi = {
  submitOnboarding: (role) =>
    apiRequest('/auth/onboarding', {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
}
