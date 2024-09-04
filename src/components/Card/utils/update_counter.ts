import { Thing } from "../../../types";

type Data = {
  name: string;
  count: number;
  image: File;
  thumbnail: Blob;
};

export default function update_counter(
  db: IDBDatabase,
  id: string,
  data: Data
): Promise<Thing> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("things", "readwrite");
    const store = transaction.objectStore("things");
    const getRequest = store.get(id);

    getRequest.addEventListener("success", () => {
      const thing = getRequest.result;

      if (!thing) return reject(new Error("no such thing!"));

      const update = { ...thing, ...data };
      const putRequest = store.put(update);

      putRequest.addEventListener("success", () => resolve(update));

      putRequest.addEventListener("error", () => reject(putRequest.error));
    });

    getRequest.addEventListener("error", () => reject(getRequest.error));
  });
}
