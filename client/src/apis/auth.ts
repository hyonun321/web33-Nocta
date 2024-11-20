import { useMutation, useQuery } from "@tanstack/react-query";
import { useUserActions } from "@src/stores/useUserStore";
import { unAuthorizationFetch, fetch } from "./axios";

export const useSignupMutation = (onSuccess: () => void) => {
  const fetcher = ({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }) => {
    return unAuthorizationFetch.post("/auth/register", { name, email, password });
  };

  return useMutation({
    mutationFn: fetcher,
    onSuccess: () => {
      onSuccess();
    },
  });
};

export const useLoginMutation = (onSuccess: () => void) => {
  const { setUserInfo } = useUserActions();

  const fetcher = ({ email, password }: { email: string; password: string }) => {
    return unAuthorizationFetch.post("/auth/login", { email, password });
  };

  return useMutation({
    mutationFn: fetcher,
    onSuccess: (response) => {
      const { id, name, accessToken } = response.data;
      console.log(accessToken);
      setUserInfo(id, name, accessToken);
      onSuccess();
    },
  });
};

export const useLogoutMutation = (onSuccess: () => void) => {
  const { removeUserInfo } = useUserActions();

  const fetcher = () => {
    return fetch.post("/auth/logout");
  };

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

  return useQuery({
    queryKey: ["refresh"],
    queryFn: () => fetch.get("/auth/refresh"),
    enabled: false,
    select: (response) => {
      const { accessToken } = response.data;
      console.log(accessToken);
      updateAccessToken(accessToken);
      return response.data;
    },
  });
};
