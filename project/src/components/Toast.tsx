import React from "react";

type ToastProps = {
  type: "success" | "error" | "info";
  message: string;
};

export const Toast: React.FC<ToastProps> = ({ type, message }) => {
  const base =
    "fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium";
  const variant =
    type === "success"
      ? "bg-green-600 text-white"
      : type === "error"
      ? "bg-red-600 text-white"
      : "bg-blue-600 text-white";
  return <div className={`${base} ${variant}`}>{message}</div>;
};

export default Toast;
