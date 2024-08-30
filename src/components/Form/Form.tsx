import { Show } from "solid-js";
import { Thing } from "../../types";
import create_thumbnail from "./utils/create_thumbnail";
import { createStore } from "solid-js/store";
import is_valid_type from "./utils/is_valid_type";

type FormType = HTMLFormElement & {
  name: HTMLInputElement;
  file: HTMLInputElement;
};

type Props = {
  add_thing: (thing: Thing) => Promise<void>;
};

export default function Form(props: Props) {
  const [errors, setErrors] = createStore({ name: false, image: false });

  async function handle_submit(event: Event) {
    event.preventDefault();

    const form = event.target as FormType;
    const name = form.name.value.trim();

    if (!name) {
      form.name.value = "";
      setErrors("name", true);

      return;
    }

    const files = form.file.files as FileList;
    const image = files[0];

    if (!is_valid_type(image.type)) {
      form.file.files = new FileList();
      setErrors("image", true);

      return;
    }

    const id = crypto.randomUUID();
    const count = 0;

    try {
      const thumbnail = await create_thumbnail(image, 100);
      const thing = { name, count, image, thumbnail, id };

      await props.add_thing(thing);

      setErrors({ name: false, image: false });
      form.reset();
    } catch (error) {
      console.log(error);

      throw error;
    }
  }

  return (
    <form onSubmit={handle_submit}>
      <label>
        <input
          type="file"
          name="file"
          onChange={() => setErrors("image", false)}
        />
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
