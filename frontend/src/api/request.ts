import type { AxiosRequestConfig } from "axios";
import Axios from "axios";

import { appNavigate } from "@/lib/navigation";

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const AXIOS_INSTANCE = Axios.create({
  withCredentials: true,
});

AXIOS_INSTANCE.interceptors.request.use((config) => {
  return config;
});

AXIOS_INSTANCE.interceptors.response.use(
  (response) => {
    const code = response.data?.code;
    if (code === HttpStatus.OK || code === HttpStatus.CREATED) {
      return response.data.data;
    }
    return Promise.reject(new Error("Unexpected response code: " + code));
  },
  (error) => {
    // if (error.response?.status === HttpStatus.UNAUTHORIZED) {
    //   appNavigate("/login");
    //   return Promise.reject(new Error("Unauthorized"));
    // }
    return Promise.reject(error);
  },
);

export const request = <T>(url: string, options?: RequestInit): Promise<T> => {
  const source = Axios.CancelToken.source();
  const promise = AXIOS_INSTANCE({
    url,
    method: options?.method as AxiosRequestConfig["method"],
    data: options?.body,
    headers: options?.headers as AxiosRequestConfig["headers"],
    cancelToken: source.token,
    signal: options?.signal as AbortSignal,
  }).then((res) => res as T);

  // @ts-expect-error attach cancel method for react-query
  promise.cancel = () => source.cancel("Query was cancelled");

  return promise;
};

export default request;
