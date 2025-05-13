import { setSession, setStatus } from '@/store/slice/sessionSlice';
import { getSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

export const useSessionSync = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchAndUpdateSession = async () => {
      dispatch(setStatus('loading'));

      try {
        const session = await getSession();
        dispatch(setSession(session));
      } catch (err) {
        dispatch(setSession(null));
        dispatch(setStatus('unauthenticated'));
      }
    };

    fetchAndUpdateSession();

    const interval = setInterval(fetchAndUpdateSession, 30 * 60 * 1000); // every 30 mins

    return () => clearInterval(interval);
  }, [dispatch]);
};
