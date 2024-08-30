export type Thing = {
  name: string;
  count: number;
  image: File | string;
  thumbnail: Blob | string;
  //   index: number;
  id: string;
};

export type DBObj = {
  db: IDBDatabase | null;
  error: boolean;
};

export const STATES = {
  LOADING: "LOADING",
  READY: "READY",
  ERROR: "ERROR",
} as const;

export type StateType = typeof STATES[keyof typeof STATES]