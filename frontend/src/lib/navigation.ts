import type { NavigateFunction } from "react-router-dom";

let _navigate: NavigateFunction | null = null;

export function setNavigate(fn: NavigateFunction) {
  _navigate = fn;
}

export function appNavigate(to: string) {
  if (_navigate) {
    _navigate(to);
  } else {
    window.location.href = to;
  }
}
