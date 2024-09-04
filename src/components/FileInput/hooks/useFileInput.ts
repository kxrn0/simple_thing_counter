import { Accessor, createSignal, onCleanup, Setter } from "solid-js";

export type FileManager = {
  thumbnail: Accessor<string>;
  setThumbnail: Setter<string>;
  error: Accessor<boolean>;
  setError: Setter<boolean>;
  clear_file_input: () => void;
  revoke: () => void;
};

export default function useFileInput(): FileManager {
  const [thumbnail, setThumbnail] = createSignal("");
  const [error, setError] = createSignal(false);

  function clear_file_input() {
    URL.revokeObjectURL(thumbnail());
    setThumbnail("");
  }

  function revoke() {
    URL.revokeObjectURL(thumbnail());
  }

  const manager = {
    thumbnail,
    setThumbnail,
    error,
    setError,
    clear_file_input,
    revoke,
  };

  onCleanup(revoke);

  return manager;
}
