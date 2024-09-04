import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import { Thing, THUMBNAIL_SIZE } from "../../types";
import create_viewer from "./utils/create_viewer";
import delete_thing from "./utils/delete_thing";
import styles from "./Card.module.scss";
import shared from "../../shared.module.scss";
import "viewerjs/dist/viewer.css";
import Dialog from "corvu/dialog";
import { ToastHandler } from "solid-toast";
import trash from "./assets/trash.svg";
import plus from "./assets/plus.svg";
import minus from "./assets/minus.svg";
import pencil from "./assets/pencil.svg";
import useFileInput from "../FileInput/hooks/useFileInput";
import FileInput from "../FileInput/FileInput";
import is_valid_type from "../../utils/is_valid_type";
import { createStore } from "solid-js/store";
import create_thumbnail from "../../utils/create_thumbnail";
import update_counter from "./utils/update_counter";

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
    const files = form.file.files as FileList;
    const image = files[0];
    const isValid = image && is_valid_type(image.type);

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
        manager.clear_file_input();
        manager.setError(true);
      }

      return;
    }

    try {
      const newThumbnail = await create_thumbnail(image, THUMBNAIL_SIZE);
      const data = {
        name,
        count: number,
        image,
        thumbnail: newThumbnail,
      };
      const update = await update_counter(props.db, props.thing.id, data);
      const url = URL.createObjectURL(newThumbnail);

      URL.revokeObjectURL(thumbnail());
      props.update(update);

      setThumbnail(url);
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

  onMount(() => {
    const thumbnail = URL.createObjectURL(props.thing.thumbnail);

    setThumbnail(thumbnail);
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
        onEscapeKeyDown={() => setIsEditing(false)}
        onOutsidePointer={() => setIsEditing(false)}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Label class="fs-l">Edit Counter</Dialog.Label>
            <form onSubmit={handle_submit}>
              <FileInput
                name="file"
                size={THUMBNAIL_SIZE}
                manager={manager}
                errorToast={props.errorToast}
              />
              <label>
                <span>Name:</span>
                <input type="text" name="name" value={props.thing.name} />
                <Show when={errors.name}>
                  <p class={`fs-s ${shared["error"]}`}>
                    please enter a valid name!
                  </p>
                </Show>
              </label>
              <label>
                <span>Count:</span>
                <input type="number" value={props.thing.count} name="number" />
                <Show when={errors.number}>
                  <p class={`fs-s ${shared["error"]}`}>
                    please enter a valid number!
                  </p>
                </Show>
              </label>
              <div class={styles["buttons"]}>
                <button>save</button>
                <button type="button" onClick={() => setIsEditing(false)}>
                  cancel
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
