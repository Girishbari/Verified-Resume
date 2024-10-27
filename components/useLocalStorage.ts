"use client";

export function useLocalStorage() {
  function setItem(key: string, value: unknown) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getItem(key: string) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : undefined;
  }

  function removeItem(key: string) {
    localStorage.removeItem(key);
  }

  return { setItem, getItem, removeItem };
}
