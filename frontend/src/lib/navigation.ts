import type { NavigateFunction } from "react-router-dom";

let _navigate: NavigateFunction | null = null;

export const setNavigate = (fn: NavigateFunction) => {
  _navigate = fn;
};

export const appNavigate = (to: string) => {
  if (_navigate) {
    _navigate(to);
  } else {
    window.location.href = to;
  }
};
