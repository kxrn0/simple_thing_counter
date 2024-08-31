import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import { Thing } from "../../types";
import Viewer from "viewerjs";
import styles from "./Card.module.scss";
import "viewerjs/dist/viewer.css";

type Props = {
  thing: Thing;
  count: (dc: number, id: string) => Promise<void>;
};

export default function Card(props: Props) {
  const [image, setImage] = createSignal("");
  const [thumbnail, setThumbnail] = createSignal("");
  const [isOpen, setIsOpen] = createSignal(false);
  const [viewer, setViewer] = createSignal<Viewer | null>();
  /**
   * Now what? First of all, I want the full image to not load until it is
   * necessary. The viewer will also be destroyed when not in use, which
   * will hopefully liberate the memory taken by the image. Since the app
   * is local, bandwidth is not an issue at all, so we can optimize for
   * memory by requesting the image from the database each time the user
   * wants to display the image.
   * When do we want to open the image? We want to open it when the user
   * clicks on the image element. Can we do away with the isOpen signal?
   * It would be better if the displaying of the image can be controlled
   * by just one signal, the viewer signal in this case.
   * If we want to do things in an effect we would need to set that signal
   * to something other than what it's intended to represent to trigger the
   * effect, so it's better to keep the isOpen signal around in this case.
   *
   * When the user clicks on the image element the isOpen signal is set to
   * true. We will have a branch in an effect that will test the value of
   * isOpen. The presence of isOpen in the conditional will trigger the
   * effect everytime its value changes.
   *
   * Only reading the signal somewhere in the effect is enough to make the
   * effect subscribe to it. We will probably need to read the signal a level
   * deeper than expected.
   *
   * If isOpen is true, then we set up the viewer, which is expected to be null,
   * otherwise if isOpen is false we destroy the viewer. When would the isOpen
   * signal be set to false? When the viewer is closed, which so far we don't
   * know how to track, so it's possible that the actual code will have a
   * branching statement testing if the viewer is defined at the very top.
   *
   * Assume that's the case. If the viewer is null, then fetch the image, set
   * the img element's src to the result, create a viewer object, give it the
   * img's container, open it, and set the viewer's signal value to the viewer
   * object we just created.
   *
   * We can add an event to the viewer to listen for when it hides. We add
   * and event listener to the viewer to listen when it closes. After that we
   * destroy it and set isOpen to false. But in that case the effect would trigger
   * again, and the viewer would open again following the logic above.
   * 
   * What happens if the top level conditional checks if isOpen is true or false?
   * When the image element is clicked isOpen is set to true. In this case we 
   * create a viewer, we fetch the image from the database, we set the viewer's 
   * element to the img element's container, we show it. We also add an event 
   * listener to the viewer for when it finishes closing. In here we destroy the
   * viewer and all evidence. We also set isOpen to false.
   */

  // let container;

  function handle_click() {
    if (viewer()) {
      viewer()?.destroy();
      setViewer(null);
    } else {
      const div = document.createElement("div");
      const img = document.createElement("img");

      img.src = image();

      img.addEventListener("load", () => {
        div.append(img);

        const view = new Viewer(div);

        div.addEventListener("shown", () => console.log("hi!"));

        view.show();

        setViewer(view);
      });
    }
  }

  onMount(() => {
    const image = URL.createObjectURL(props.thing.image);
    const thumbnail = URL.createObjectURL(props.thing.thumbnail);

    setImage(image);
    setThumbnail(thumbnail);
  });

  onCleanup(() => {
    URL.revokeObjectURL(image());
    URL.revokeObjectURL(thumbnail());
  });

  createEffect(() => {
    // if (!viewer()) {
    // }
    // else {
    // }
    // if (isOpen()) {
    //   const viewer = new Viewer(container, );
    //   viewer.show();
    // }
  });

  return (
    <div class={styles.card}>
      <p>{props.thing.name}</p>
      <img
        src={thumbnail()}
        alt={props.thing.name}
        onClick={handle_click}
        // onClick={() => setIsOpen(true)}
      />
      <div class={styles["count-area"]}>
        <button onClick={() => props.count(1, props.thing.id)}>+</button>
        <p>{props.thing.count}</p>
        <button onClick={() => props.count(-1, props.thing.id)}>-</button>
      </div>
      {/* <Show when={isOpen()}>
        <div ref={container}>
          <img src={image()} alt={props.thing.name} />
        </div>
      </Show> */}
    </div>
  );
}
