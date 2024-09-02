import { createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { Thing } from "../../types";
import create_viewer from "./utils/create_viewer";
import delete_thing from "./utils/delete_thing";
import styles from "./Card.module.scss";
import "viewerjs/dist/viewer.css";
import Dialog from "corvu/dialog";

type Props = {
  thing: Thing;
  count: (dc: number, id: string) => Promise<void>;
  db: IDBDatabase | null;
  remove_thing: (id: string) => void;
};

export default function Card(props: Props) {
  const [image, setImage] = createSignal("");
  const [thumbnail, setThumbnail] = createSignal("");
  const [isOpen, setIsOpen] = createSignal(false);
  const [isDialogOpen, setIsDialogOpen] = createSignal(false);

  async function handle_deletion() {
    if (!props.db) return;

    try {
      await delete_thing(props.db, props.thing.id);

      props.remove_thing(props.thing.id);
    } catch (error) {
      console.log(error);

      //a toast!
    }
  }

  onMount(() => {
    const thumbnail = URL.createObjectURL(props.thing.thumbnail);

    setThumbnail(thumbnail);
  });

  onCleanup(() => {
    URL.revokeObjectURL(image());
    URL.revokeObjectURL(thumbnail());
  });

  createEffect(async () => {
    if (isOpen()) {
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

          setIsOpen(false);
          setImage("");
        });
      } catch (error) {
        console.log(error);
      }
    }
  });

  return (
    <div class={styles.card}>
      <button
        onClick={() => setIsDialogOpen(true)}
        class={styles["dialog-trigger"]}
      >
        open dialog
      </button>
      <Dialog
        open={isDialogOpen()}
        onEscapeKeyDown={() => setIsDialogOpen(false)}
        onOutsidePointer={() => setIsDialogOpen(false)}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Description>this is a dialog</Dialog.Description>
            <button onClick={() => setIsDialogOpen(false)}>close</button>
            <button onClick={handle_deletion}>delete thing?</button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
      <img
        src={thumbnail()}
        alt={props.thing.name}
        onClick={() => setIsOpen(true)}
      />
      <p>{props.thing.name}</p>
      <div class={styles["count-area"]}>
        <button onClick={() => props.count(1, props.thing.id)}>+</button>
        <p>{props.thing.count}</p>
        <button onClick={() => props.count(-1, props.thing.id)}>-</button>
      </div>
    </div>
  );
}
