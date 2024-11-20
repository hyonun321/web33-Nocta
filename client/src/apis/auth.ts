import { useMutation, useQuery } from "@tanstack/react-query";
import { useUserActions } from "@src/stores/useUserStore";
import { unAuthorizationFetch, fetch } from "./axios";

export const useSignupMutation = (onSuccess: () => void) => {
  const fetcher = ({ name, email, password }: { name: string; email: string; password: string }) =>
    unAuthorizationFetch.post("/auth/register", { name, email, password });

  return useMutation({
    mutationFn: fetcher,
    onSuccess: () => {
      onSuccess();
    },
  });
};

export const useLoginMutation = (onSuccess: () => void) => {
  const { setUserInfo } = useUserActions();

  const fetcher = ({ email, password }: { email: string; password: string }) =>
    unAuthorizationFetch.post("/auth/login", { email, password });

  return useMutation({
    mutationFn: fetcher,
    onSuccess: (response) => {
      const { id, name, accessToken } = response.data;
      setUserInfo(id, name, accessToken);
      onSuccess();
    },
  });
};

export const useLogoutMutation = (onSuccess: () => void) => {
  const { removeUserInfo } = useUserActions();

  const fetcher = () => fetch.post("/auth/logout");

  return useMutation({
    mutationFn: fetcher,
    onSuccess: () => {
      removeUserInfo();
      onSuccess();
    },
  });
};

export const useRefreshQuery = () => {
  const { updateAccessToken } = useUserActions();

  const fetcher = () => fetch.get("/auth/refresh");

  return useQuery({
    queryKey: ["refresh"],
    queryFn: async () => {
      const response = await fetcher();
      const { accessToken } = response.data;
      updateAccessToken(accessToken);
      return response.data;
    },
    enabled: false,
  });
};
