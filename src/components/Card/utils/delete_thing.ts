export default async function delete_thing(
  db: IDBDatabase,
  id: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("things", "readwrite");
    const store = transaction.objectStore("things");
    const request = store.delete(id);

    request.addEventListener("success", () => resolve());

    request.addEventListener("error", () => reject(request.error));
  });
}
