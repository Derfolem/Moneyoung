type ToastType = "success" | "error" | "info";

type ToastData = {
  type: ToastType;
  title: string;
  message: string | undefined;
};

type Listener = (data: ToastData) => void;

const listeners = new Set<Listener>();

function emit(data: ToastData) {
  listeners.forEach((fn) => fn(data));
}

export const toast = {
  success(title: string, message?: string) {
    emit({ type: "success", title, message });
  },
  error(title: string, message?: string) {
    emit({ type: "error", title, message });
  },
  info(title: string, message?: string) {
    emit({ type: "info", title, message });
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
};

export type { ToastData, ToastType };
