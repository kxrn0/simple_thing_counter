import { Accessor, createSignal, onCleanup, Setter } from "solid-js";

export type FileManager = {
  thumbnail: Accessor<string>;
  setThumbnail: Setter<string>;
  error: Accessor<boolean>;
  setError: Setter<boolean>;
  hasUpdated: Accessor<boolean>;
  setHasUpdated: Setter<boolean>;
  clear_file_input: () => void;
  revoke: () => void;
};

export default function useFileInput(initThumb?: string): FileManager {
  const [thumbnail, setThumbnail] = createSignal(initThumb || "");
  const [error, setError] = createSignal(false);
  const [hasUpdated, setHasUpdated] = createSignal(initThumb ? false : true);

  function clear_file_input() {
    URL.revokeObjectURL(thumbnail());
    setThumbnail("");
    setHasUpdated(true);
  }

  function revoke() {
    URL.revokeObjectURL(thumbnail());
    setHasUpdated(true);
  }

  const manager = {
    thumbnail,
    setThumbnail,
    error,
    setError,
    hasUpdated,
    setHasUpdated,
    clear_file_input,
    revoke,
  };

  onCleanup(revoke);

  return manager;
}
