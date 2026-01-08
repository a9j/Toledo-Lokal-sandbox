import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useGoogleMapsKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKey() {
      try {
        const { data, error } = await supabase.functions.invoke('get-maps-key');
        
        if (error) {
          console.error('Error fetching maps key:', error);
          setError('Failed to load maps');
          return;
        }
        
        if (data?.apiKey) {
          setApiKey(data.apiKey);
        } else {
          setError('Maps not configured');
        }
      } catch (err) {
        console.error('Error fetching maps key:', err);
        setError('Failed to load maps');
      } finally {
        setIsLoading(false);
      }
    }

    fetchKey();
  }, []);

  return { apiKey, isLoading, error };
}
