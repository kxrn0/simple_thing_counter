import { Show } from "solid-js";
import { FileManager } from "./hooks/useFileInput";
import is_valid_type from "../../utils/is_valid_type";
import create_thumbnail from "../../utils/create_thumbnail";
import image_icon from "./assets/image_icon.svg";
import replace_icon from "./assets/replace_icon.svg";
import x_icon from "./assets/x_icon.svg";
import shared from "../../shared.module.scss";
import styles from "./FileInput.module.scss";
import { ToastHandler } from "solid-toast";

type Props = {
  name: string;
  size: number;
  manager: FileManager;
  errorToast: ToastHandler;
};

export default function FileInput(props: Props) {
  let inputRef!: HTMLInputElement;

  function clear(event: Event) {
    event.preventDefault();

    props.manager.clear_file_input();
    inputRef.value = "";
  }

  async function handle_input(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files as FileList;
    const file = files[0];

    if (!file) {
      props.manager.clear_file_input();
      props.manager.setError(true);
      inputRef.value = "";

      return;
    }

    const isValid = is_valid_type(file.type);

    if (!isValid) {
      props.manager.clear_file_input();
      props.manager.setError(true);
      inputRef.value = "";

      return;
    }

    try {
      const image = await create_thumbnail(file, props.size);
      const url = URL.createObjectURL(image);

      props.manager.revoke();
      props.manager.setThumbnail(url);
      props.manager.setError(false);
    } catch (error) {
      console.log(error);

      props.errorToast("something went wrong!");
    }
  }

  return (
    <label
      class={styles["file-input"]}
      style={{ "--width": `${props.size}px`, "--height": `${props.size}px` }}
    >
      <input
        type="file"
        class={styles["input"]}
        onInput={handle_input}
        ref={inputRef}
        name={props.name}
      />
      <Show
        when={props.manager.thumbnail()}
        fallback={
          <button
            class={styles["input-button"]}
            type="button"
            aria-label="add image"
            onclick={() => inputRef.click()}
          >
            <img
              src={image_icon}
              class={styles["image-icon"]}
              aria-hidden="true"
            />
          </button>
        }
      >
        <img src={props.manager.thumbnail()} alt="thumbnail" />
        <button
          aria-label="replace image"
          class={`${shared["left"]} ${shared["button"]}`}
          type="button"
          onClick={() => inputRef.click()}
        >
          <img src={replace_icon} aria-hidden="true" class={styles["icon"]} />
        </button>
        <button
          aria-label="remove image"
          class={`${shared["right"]} ${shared["button"]}`}
          type="button"
          onClick={clear}
        >
          <img src={x_icon} aria-hidden="true" class={styles["icon"]} />
        </button>
      </Show>
      <Show when={props.manager.error()}>
        <p class={`fs-s ${shared["error"]}`}>please enter a valid file</p>
      </Show>
    </label>
  );
}
