export default function count(
  db: IDBDatabase,
  id: string,
  dc: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("things", "readwrite");
    const store = transaction.objectStore("things");
    const getRequest = store.get(id);

    getRequest.addEventListener("success", () => {
      const thing = getRequest.result;

      if (!thing) return reject(new Error("no such thing!"));

      thing.count += dc;

      const putRequest = store.put(thing);

      putRequest.addEventListener("success", () => resolve());

      putRequest.addEventListener("error", () => reject(putRequest.error));
    });

    getRequest.addEventListener("error", () => reject(getRequest.error));
  });
}
