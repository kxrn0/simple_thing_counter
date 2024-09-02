import { Thing } from "../types";

export default function get_things(db: IDBDatabase): Promise<Thing[]> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("things", "readonly");
    const store = transaction.objectStore("things");
    const request = store.getAll();

    request.addEventListener("success", () => {
      const things = request.result.map(({ image, ...thing }) => thing);

      resolve(things);
    });

    request.addEventListener("error", () => reject(request.error));
  });
}
