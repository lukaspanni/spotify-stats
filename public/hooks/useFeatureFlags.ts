import { useQuery } from '@tanstack/react-query';

export interface FeatureFlags {
  recommendations: boolean;
}

const fetchFeatureFlags = async (): Promise<FeatureFlags> => {
  const response = await fetch('/api/feature-flags');
  if (!response.ok) throw new Error('Failed to fetch feature flags');

  return response.json();
};

export const useFeatureFlags = () => {
  return useQuery({
    queryKey: ['featureFlags'],
    queryFn: fetchFeatureFlags,
    // Default to disabled if query fails
    placeholderData: { recommendations: false }
  });
};
