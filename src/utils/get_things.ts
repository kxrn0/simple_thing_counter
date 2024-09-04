import { Thing } from "../types";

export default function get_things(db: IDBDatabase): Promise<Thing[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("things", "readonly");
    const store = transaction.objectStore("things");
    const index = store.index("position_index");
    const request = index.openCursor(null, "prev");
    const things: Thing[] = [];

    request.addEventListener("success", () => {
      const cursor = request.result;

      if (cursor) {
        const { image, ...thing } = cursor.value;

        things.push(thing);

        cursor.continue();
      } else resolve(things);
    });

    request.addEventListener("error", () => reject(request.error));
  });
}
