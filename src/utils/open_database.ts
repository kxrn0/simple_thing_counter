export default function open_database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const openRequest = indexedDB.open("simple_counter", 1);

    openRequest.addEventListener("success", () => resolve(openRequest.result));

    openRequest.addEventListener("error", () => reject(openRequest.error));

    openRequest.addEventListener("upgradeneeded", () => {
      const db = openRequest.result;

      db.createObjectStore("things", { keyPath: "id" });
    });
  });
}
