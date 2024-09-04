import { createSignal, Show } from "solid-js";
import toast, { ToastHandler } from "solid-toast";
import is_valid_type from "../../utils/is_valid_type";
import create_thumbnail from "../../utils/create_thumbnail";
import useFileInput from "../FileInput/hooks/useFileInput";
import { Thing, THUMBNAIL_SIZE } from "../../types";
import FileInput from "../FileInput/FileInput";
import styles from "./Form.module.scss";
import shared from "../../shared.module.scss";

export type Data = HTMLFormElement & {
  name: HTMLInputElement;
  file: HTMLInputElement;
};

type Props = {
  add_thing: (thing: Thing) => Promise<void>;
  errorToast: ToastHandler;
};

export default function Form(props: Props) {
  const [nameError, setNameError] = createSignal(false);
  const manager = useFileInput();

  async function handle_submit(event: Event) {
    event.preventDefault();

    const form = event.target as Data;
    const name = form.name.value.trim();
    const files = form.file.files as FileList;
    const image = files[0];
    const isValid = image && is_valid_type(image.type);

    if (!name || !isValid) {
      if (!name) {
        form.name.value = "";

        setNameError(true);
      }

      if (!isValid) {
        manager.clear_file_input();
        manager.setError(true);
      }

      return;
    }

    const id = crypto.randomUUID();
    const count = 0;

    try {
      const thumbnail = await create_thumbnail(image, THUMBNAIL_SIZE);
      const thing = { name, count, image, thumbnail, id };

      await props.add_thing(thing);

      manager.clear_file_input();
      form.reset();
    } catch (error) {
      console.log(error);

      props.errorToast("something went wrong!");
    }
  }

  return (
    <form onSubmit={handle_submit} class={styles["form"]}>
      <FileInput
        name="file"
        size={THUMBNAIL_SIZE}
        manager={manager}
        errorToast={toast.error}
      />
      <label class={styles["name-container"]}>
        <span class="fs-m">Name:</span>
        <input
          type="text"
          name="name"
          onInput={() => setNameError(false)}
          class={`fs-r ${styles["input"]}`}
        />
        <Show when={nameError()}>
          <p class={`fs-s ${shared["error"]}`}>please enter a valid name</p>
        </Show>
      </label>
      <button class={`fs-l ${styles["button"]}`}>create</button>
    </form>
  );
}
