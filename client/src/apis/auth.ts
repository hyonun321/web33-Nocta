import { useMutation } from "@tanstack/react-query";

import { useUserActions } from "@src/stores/useUserStore";
import { fetch, unAuthorizationFetch } from "./axios";

export const useSignupMutation = () => {
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
  });
};

export const useLoginMutation = () => {
  const { setCredentials } = useUserActions();

  const fetcher = ({ email, password }: { email: string; password: string }) => {
    return unAuthorizationFetch.post("/auth/login", { email, password });
  };

  return useMutation({
    mutationFn: fetcher,
    onSuccess: (response) => {
      const { id, name, accessToken } = response.data;
      setCredentials(id, name, accessToken);
    },
  });
};

export const useLogoutMutation = () => {
  const { removeCredentials } = useUserActions();

  const fetcher = () => {
    return fetch.post("/auth/logout");
  };

  return useMutation({
    mutationFn: fetcher,
    onSuccess: () => {
      removeCredentials();
    },
  });
};
