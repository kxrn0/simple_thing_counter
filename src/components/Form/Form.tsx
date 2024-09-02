import { createSignal, onCleanup, Show } from "solid-js";
import { Thing } from "../../types";
import create_thumbnail from "./utils/create_thumbnail";
import { createStore } from "solid-js/store";
import is_valid_type from "./utils/is_valid_type";
import image_icon from "./assets/image_icon.svg";
import replace_icon from "./assets/replace_icon.svg";
import x_icon from "./assets/x_icon.svg";
import styles from "./Form.module.scss";

type FormType = HTMLFormElement & {
  name: HTMLInputElement;
  file: HTMLInputElement;
};

type Props = {
  add_thing: (thing: Thing) => Promise<void>;
};

export default function Form(props: Props) {
  const THUMBNAIL_SIZE = 150;
  const [errors, setErrors] = createStore({ name: false, image: false });
  const [thumbnail, setThumbnail] = createSignal("");
  let inputRef!: HTMLInputElement;

  async function handle_submit(event: Event) {
    //chrome clears the input field if the file picked is
    //closed without choosing another file...

    event.preventDefault();

    const form = event.target as FormType;
    const name = form.name.value.trim();
    const files = form.file.files as FileList;
    const image = files[0];
    const isValid = is_valid_type(image.type);

    if (!name || !isValid) {
      if (!name) {
        form.name.value = "";
        setErrors("name", true);
      }

      if (!isValid) {
        form.file.value = "";
        setErrors("image", true);
      }

      return;
    }

    const id = crypto.randomUUID();
    const count = 0;

    try {
      const thumbnail = await create_thumbnail(image, THUMBNAIL_SIZE);
      const thing = { name, count, image, thumbnail, id };

      await props.add_thing(thing);

      clear_file_input();
      setErrors({ name: false, image: false });
      form.reset();
    } catch (error) {
      console.log(error);

      throw error;
    }
  }

  async function handle_change(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files as FileList;
    const file = files[0];

    if (!file) return;

    setErrors("image", false);

    const isValid = is_valid_type(file.type);

    if (!isValid) {
      setErrors("image", true);
      inputRef.value = "";

      return;
    }

    try {
      const image = await create_thumbnail(file, THUMBNAIL_SIZE);
      const url = URL.createObjectURL(image);

      URL.revokeObjectURL(thumbnail());

      setThumbnail(url);
    } catch (error) {
      console.log(error);

      //a toast!
    }
  }

  function clear_file_input(event?: Event) {
    event?.preventDefault();

    URL.revokeObjectURL(thumbnail());
    setThumbnail("");
  }

  onCleanup(() => URL.revokeObjectURL(thumbnail()));

  return (
    <form onSubmit={handle_submit} class={styles["form"]}>
      <button onClick={() => console.log(inputRef.files)} type="button">
        hi
      </button>

      <label class={styles["image-container"]}>
        <input
          type="file"
          class={styles["file-input"]}
          onChange={handle_change}
          ref={inputRef}
          name="file"
        />
        <Show
          when={thumbnail()}
          fallback={<img src={image_icon} class={styles["image-icon"]} />}
        >
          <img src={thumbnail()} alt="thumbnail" />
          <button
            aria-label="replace image"
            class={`${styles["left"]} ${styles["button"]}`}
            type="button"
            onClick={() => inputRef?.click()}
          >
            <img src={replace_icon} aria-hidden="true" class={styles["icon"]} />
          </button>
          <button
            aria-label="remove image"
            class={`${styles["right"]} ${styles["button"]}`}
            type="button"
            onClick={clear_file_input}
          >
            <img src={x_icon} aria-hidden="true" class={styles["icon"]} />
          </button>
        </Show>
        <Show when={errors.image}>
          <p>please enter a valid file</p>
        </Show>
      </label>
      <label>
        <span>Name:</span>
        <input
          type="text"
          name="name"
          onChange={() => setErrors("name", false)}
        />
        <Show when={errors.name}>
          <p>please enter a valid name</p>
        </Show>
      </label>
      <button>create</button>
    </form>
  );
}
