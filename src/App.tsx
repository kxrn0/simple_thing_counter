import { For, Match, onMount, Show, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import { Thing } from "./types";
import open_database from "./utils/open_database";
import get_things from "./utils/get_things";
import add_thing from "./utils/add_thing";
import count from "./utils/count";
import Form from "./components/Form/Form";
import Card from "./components/Card/Card";
import styles from "./App.module.scss";
import "normalize.css";
import "./style.css";

type TSType = {
  things: Thing[];
  state: StateType;
};

type DBObj = {
  db: IDBDatabase | null;
  error: boolean;
};

const STATES = {
  LOADING: "LOADING",
  READY: "READY",
  ERROR: "ERROR",
} as const;

type StateType = (typeof STATES)[keyof typeof STATES];

function App() {
  const [dbObj, setDbObj] = createStore<DBObj>({ db: null, error: false });
  const [thingsState, setThingsState] = createStore<TSType>({
    things: [],
    state: STATES.LOADING,
  });

  async function handle_count(dc: number, id: string) {
    try {
      setThingsState(
        "things",
        (thing) => thing.id === id,
        "count",
        (count) => count + dc
      );

      await count(dbObj.db!, id, dc);
    } catch (error) {
      console.log(error);

      //a toast!

      setThingsState(
        "things",
        (thing) => thing.id === id,
        "count",
        (count) => count - dc
      );
    }
  }

  async function handle_addition(thing: Thing) {
    await add_thing(dbObj.db!, thing);

    setThingsState("things", (prev) => [thing, ...prev]);
  }

  async function load_things(db: IDBDatabase) {
    setThingsState("state", STATES.LOADING);

    try {
      const things = await get_things(db);

      setThingsState("things", things);
      setThingsState("state", STATES.READY);
    } catch (error) {
      console.log(error);

      setThingsState("state", STATES.ERROR);
    }
  }

  function remove_thing(id: string) {
    setThingsState("things", (things) =>
      things.filter((thing) => thing.id !== id)
    );
  }

  onMount(async () => {
    try {
      const db = await open_database();

      await load_things(db);

      setDbObj("db", db);
    } catch (error) {
      console.log(error);

      setDbObj("error", true);
    }
  });

  return (
    <div class={styles.app}>
      <Form add_thing={handle_addition} />
      <Show when={dbObj.db} fallback={<p>loading database...</p>}>
        <Switch>
          <Match when={thingsState.state === STATES.LOADING}>
            <p>loading things...</p>
          </Match>
          <Match when={thingsState.state === STATES.READY}>
            <p>ready...</p>

            <div class={styles["cards-container"]}>
              <For each={thingsState.things}>
                {(thing) => (
                  <Card
                    thing={thing}
                    count={handle_count}
                    db={dbObj.db}
                    remove_thing={remove_thing}
                  />
                )}
              </For>
            </div>
          </Match>
          <Match when={thingsState.state === STATES.ERROR}>
            <p>something went wrong!</p>
            <button onClick={() => load_things(dbObj.db!)}>try again</button>
          </Match>
        </Switch>
      </Show>
    </div>
  );
}

export default App;
