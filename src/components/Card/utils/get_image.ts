export default function get_image(db: IDBDatabase, id: string): Promise<File> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("things", "readonly");
    const store = transaction.objectStore("things");
    const request = store.get(id);

    request.addEventListener("success", () => resolve(request.result.image));

    request.addEventListener("error", () => reject(request.error));
  });
}
