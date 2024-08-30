import { For, Match, onMount, Show, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import { Thing, DBObj, STATES, StateType } from "./types";
import open_database from "./utils/open_database";
import get_things from "./utils/get_things";
import add_thing from "./utils/add_thing";
import Form from "./components/Form/Form";
import Card from "./components/Card/Card";
import "normalize.css";
import "./App.module.scss";

type TSType = {
  things: Thing[];
  state: StateType;
};

function App() {
  const [dbObj, setDbObj] = createStore<DBObj>({ db: null, error: false });
  const [thingsState, setThingsState] = createStore<TSType>({
    things: [],
    state: STATES.LOADING,
  });

  async function handle_addition(thing: Thing) {
    await add_thing(dbObj.db!, thing);
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
    <div>
      <Form add_thing={handle_addition} />
      <Show when={dbObj.db} fallback={<p>loading database...</p>}>
        <Switch>
          <Match when={thingsState.state === STATES.LOADING}>
            <p>loading things...</p>
          </Match>
          <Match when={thingsState.state === STATES.READY}>
            <p>ready...</p>
            <For each={thingsState.things}>
              {(thing) => <Card thing={thing} />}
            </For>
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
