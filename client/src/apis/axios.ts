import axios, { CreateAxiosDefaults } from "axios";
import { useUserInfo } from "@src/stores/useUserStore";

const baseConfig: CreateAxiosDefaults = {
  baseURL: `${import.meta.env.VITE_API_URL}`,
  withCredentials: true,
};

export const unAuthorizationFetch = axios.create(baseConfig);

export const fetch = axios.create(baseConfig);

fetch.interceptors.request.use(
  function (config) {
    const { accessToken } = useUserInfo();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);
// response 에러 처리 + access token 재발급
// fetch.interceptors.response.use(
//   function (response) {
//     return response;
//   },
//   async function (error: AxiosError) {
//     const originalRequest: CustomAxiosRequestConfig | undefined = error.config;

//     if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
//       originalRequest._retry = true;
//       try {
//         const response = await getRefreshToken();

//         const { payload } = response;

//         useUserStore.setState({ user: { accessToken: payload.accessToken } });

//         originalRequest.headers.Authorization = `Bearer ${payload.accessToken}`;

//         return fetch(originalRequest);
//       } catch (error) {
//         if (error instanceof AxiosError && error.response?.status === 403) {
//           useUserStore.getState().removeCredentials();
//           return;
//         }
//       }
//     }

//     return Promise.reject(error);
//   },
// );
``;
