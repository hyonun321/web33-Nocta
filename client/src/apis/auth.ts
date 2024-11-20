import { useMutation } from "@tanstack/react-query";
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

export const useRefreshMutation = () => {
  const { updateAccessToken, removeUserInfo } = useUserActions();

  const fetcher = () => {
    // TODO 추후 그냥 fetch로 변경 (access token 넣어줘야함)
    return unAuthorizationFetch.post("/auth/refresh");
    // return fetch.post("/auth/refresh"); // refresh token은 알아서 보내질거임
  };

  return useMutation({
    mutationFn: fetcher,
    onSuccess: (response) => {
      const { accessToken } = response.data;
      updateAccessToken(accessToken);
    },
    onError: () => {
      removeUserInfo();
    },
  });
};
