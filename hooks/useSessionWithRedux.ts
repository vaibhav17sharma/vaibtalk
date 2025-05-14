import { setSession, setStatus } from "@/store/slice/sessionSlice";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export const useSessionWithRedux = () => {
  const dispatch = useDispatch();
  const { data: session, status, update } = useSession();

  useEffect(() => {
    if (status === "loading") {
      dispatch(setStatus("loading"));
    } else if (status === "authenticated" && session) {
      dispatch(setSession(session));
    } else if (status === "unauthenticated") {
      dispatch(setSession(null));
      dispatch(setStatus("unauthenticated"));
    }
  }, [status, session, dispatch]);

  const updateSession = async () => {
    await update();
    dispatch(setSession(session));
  };

  return { session, status, updateSession };
};
