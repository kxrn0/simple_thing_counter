import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { ToastHandler } from "solid-toast";
import Dialog from "corvu/dialog";
import { Thing, THUMBNAIL_SIZE } from "../../types";
import FileInput from "../FileInput/FileInput";
import useFileInput from "../FileInput/hooks/useFileInput";
import create_thumbnail from "../../utils/create_thumbnail";
import is_valid_type from "../../utils/is_valid_type";
import create_viewer from "./utils/create_viewer";
import delete_thing from "./utils/delete_thing";
import update_counter, { Update } from "./utils/update_counter";
import trash from "./assets/trash.svg";
import plus from "./assets/plus.svg";
import minus from "./assets/minus.svg";
import pencil from "./assets/pencil.svg";
import shared from "../../shared.module.scss";
import styles from "./Card.module.scss";
import "viewerjs/dist/viewer.css";

type Values = HTMLFormElement & {
  name: HTMLInputElement;
  number: HTMLInputElement;
  file: HTMLInputElement;
};

type Props = {
  thing: Thing;
  count: (dc: number, id: string) => Promise<void>;
  db: IDBDatabase | null;
  remove_thing: (id: string) => void;
  update: (thing: Thing) => void;
  errorToast: ToastHandler;
};

export default function Card(props: Props) {
  const [image, setImage] = createSignal("");
  const [thumbnail, setThumbnail] = createSignal("");
  const [isViewingImage, setIsViewingImage] = createSignal(false);
  const [isDeleting, setIsDeleting] = createSignal(false);
  const [isEditing, setIsEditing] = createSignal(false);
  const [errors, setErrors] = createStore({ name: false, number: false });
  const manager = useFileInput();

  function clean_up() {
    URL.revokeObjectURL(image());
    URL.revokeObjectURL(thumbnail());
  }

  async function handle_submit(event: Event) {
    event.preventDefault();

    if (!props.db) return;

    const form = event.target as Values;
    const name = form.name.value.trim();
    const number = Number(form.number.value.trim());
    const badNumber = isNaN(number);

    let newImage: File | null = null;
    let newThumbnail: Blob | null = null;
    let isValid: boolean;

    if (manager.hasUpdated()) {
      const files = form.file.files as FileList;
      const image = files[0];

      isValid = image && is_valid_type(image.type);

      if (isValid) {
        newImage = image;

        try {
          newThumbnail = await create_thumbnail(newImage, THUMBNAIL_SIZE);
        } catch (error) {
          console.log(error);

          props.errorToast("something went wrong!");

          return;
        }
      }
    } else isValid = true;

    if (!name || !isValid || badNumber) {
      if (!name) {
        form.name.value = "";

        setErrors("name", true);
      }

      if (badNumber) {
        form.number.value = "";

        setErrors("number", true);
      }

      if (!isValid) {
        form.reset();

        if (!errors.name) form.name.value = name;

        if (!errors.number) form.number.value = number.toString();

        manager.clear_file_input();
        manager.setError(true);
      }

      return;
    }

    try {
      const data: Update = { name, count: number };

      if (manager.hasUpdated()) {
        data.image = newImage!;
        data.thumbnail = newThumbnail!;
      }

      const update = await update_counter(props.db, props.thing.id, data);

      if (manager.hasUpdated()) {
        const url = URL.createObjectURL(newThumbnail!);

        URL.revokeObjectURL(thumbnail());

        setThumbnail(url);
      }

      props.update(update);

      setIsEditing(false);
    } catch (error) {}
  }

  async function handle_deletion() {
    if (!props.db) return;

    try {
      await delete_thing(props.db, props.thing.id);

      props.remove_thing(props.thing.id);
      clean_up();
    } catch (error) {
      console.log(error);

      props.errorToast("something went wrong!");
    }
  }

  function close_edit() {
    setIsEditing(false);
    setErrors("name", false);
    setErrors("number", false);
  }

  onMount(() => {
    const mine = URL.createObjectURL(props.thing.thumbnail);
    const yours = URL.createObjectURL(props.thing.thumbnail);

    manager.setThumbnail(yours);
    manager.setHasUpdated(false);

    setThumbnail(mine);
  });

  createEffect(async () => {
    if (isViewingImage()) {
      if (!props.db) return;

      try {
        const { viewer, url, container } = await create_viewer(
          props.db,
          props.thing.id
        );

        viewer.show();

        setImage(url);

        container.addEventListener("hidden", () => {
          viewer.destroy();

          URL.revokeObjectURL(url);

          setIsViewingImage(false);
          setImage("");
        });
      } catch (error) {
        console.log(error);

        props.errorToast("something went wrong!");
      }
    }
  });

  createEffect(() => {
    if (!isEditing()) manager.revoke();
    else {
      const url = URL.createObjectURL(props.thing.thumbnail);

      manager.setThumbnail(url);
      manager.setHasUpdated(false);
      manager.setError(false);
    }
  });

  onCleanup(clean_up);

  return (
    <div class={styles.card}>
      <div class={styles["image-container"]}>
        <img
          src={thumbnail()}
          alt={props.thing.name}
          onClick={() => setIsViewingImage(true)}
        />
      </div>
      <p class={`fs-r ${styles["name"]}`}>{props.thing.name}</p>
      <div class={styles["count-area"]}>
        <button
          onClick={() => props.count(1, props.thing.id)}
          class={`${shared["left"]} ${shared["button"]}`}
          aria-label="plus"
        >
          <img src={plus} aria-hidden="true" class={shared["icon"]} />
        </button>
        <p class={`fs-m ${styles["number"]}`}>{props.thing.count}</p>
        <button
          onClick={() => props.count(-1, props.thing.id)}
          class={`${shared["right"]} ${shared["button"]}`}
          aria-label="decrease"
        >
          <img src={minus} aria-hidden="true" class={shared["icon"]} />
        </button>
      </div>
      <button
        onClick={() => setIsDeleting(true)}
        class={`${shared["right"]} ${shared["button"]}`}
        aria-label="delete counter"
      >
        <img src={trash} aria-hidden="true" class={shared["icon"]} />
      </button>
      <button
        onClick={() => setIsEditing(true)}
        class={`${shared["left"]} ${shared["button"]}`}
        aria-label="edit counter"
      >
        <img src={pencil} aria-hidden="true" class={shared["icon"]} />
      </button>
      <Dialog
        open={isEditing()}
        onEscapeKeyDown={close_edit}
        onOutsidePointer={close_edit}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Label class="fs-l">Edit Counter</Dialog.Label>
            <form onSubmit={handle_submit} class={styles["edit-form"]}>
              <FileInput
                name="file"
                size={THUMBNAIL_SIZE}
                manager={manager}
                errorToast={props.errorToast}
              />
              <label class={`fs-m ${styles["label"]}`}>
                <span>Name:</span>
                <input
                  type="text"
                  name="name"
                  value={props.thing.name}
                  onInput={() => setErrors("name", false)}
                  class={`fs-r ${styles["input"]}`}
                />
                <Show when={errors.name}>
                  <p class={`fs-s ${shared["error"]}`}>
                    please enter a valid name!
                  </p>
                </Show>
              </label>
              <label class={`fs-m ${styles["label"]}`}>
                <span>Count:</span>
                <input
                  type="number"
                  value={props.thing.count}
                  name="number"
                  onInput={() => setErrors("number", false)}
                  class={`fs-r ${styles["input"]}`}
                />
                <Show when={errors.number}>
                  <p class={`fs-s ${shared["error"]}`}>
                    please enter a valid number!
                  </p>
                </Show>
              </label>
              <div class={styles["buttons"]}>
                <button class={`fs-m ${styles["button"]} ${styles["green"]}`}>
                  Save
                </button>
                <button
                  type="button"
                  onClick={close_edit}
                  class={`fs-m ${styles["button"]} ${styles["red"]}`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
      <Dialog
        open={isDeleting()}
        onEscapeKeyDown={() => setIsDeleting(false)}
        onOutsidePointer={() => setIsDeleting(false)}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Label class="fs-l">
              Do you wish to delete this counter?
            </Dialog.Label>
            <div class={styles["buttons"]}>
              <button
                onClick={() => setIsDeleting(false)}
                class={`fs-m ${styles["button"]} ${styles["green"]}`}
              >
                No
              </button>
              <button
                onClick={handle_deletion}
                class={`fs-m ${styles["button"]} ${styles["red"]}`}
              >
                Yes
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </div>
  );
}
