import { Thing } from "../types";

export default function add_thing(
  db: IDBDatabase,
  thing: Thing
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("things", "readwrite");
    const store = transaction.objectStore("things");
    const request = store.add(thing);

    request.addEventListener("success", () => resolve());

    request.addEventListener("error", () => reject(request.error));
  });
}
