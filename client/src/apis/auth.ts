import { useMutation } from "@tanstack/react-query";
import axios from "axios";

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
    return axios.post("/auth/register", { name, email, password });
  };

  return useMutation({
    mutationFn: fetcher,
  });
};

export const useLoginMutation = () => {
  const fetcher = ({ email, password }: { email: string; password: string }) => {
    return axios.post("/auth/login", { email, password });
  };

  return useMutation({
    mutationFn: fetcher,
    // TODO 성공했을 경우 accessToken 저장 (zustand? localStorage? cookie?)
    // accessToken: cookie (쿠기 다 때려넣기...) / localStorage / zustand (번거로움..귀찮음.. 안해봤음..)
    // refreshToken: cookie,
    // onSuccess: (data) => {
    // },
  });
};
