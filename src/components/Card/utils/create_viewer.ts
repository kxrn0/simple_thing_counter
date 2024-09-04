import Viewer from "viewerjs";
import get_image from "./get_image";

type ViewResult = {
  viewer: Viewer;
  url: string;
  container: HTMLDivElement;
};

export default function create_viewer(
  db: IDBDatabase,
  id: string
): Promise<ViewResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const file = await get_image(db, id);
      const url = URL.createObjectURL(file);
      const container = document.createElement("div");
      const img = document.createElement("img");

      container.append(img);

      img.src = url;

      img.addEventListener("load", () => {
        const viewer = new Viewer(container, {
          toolbar: false,
          navbar: false,
          title: false,
        });

        resolve({ viewer, url, container });
      });

      img.addEventListener("error", (event) => reject(event.error));
    } catch (error) {
      console.log(error);

      reject(error);
    }
  });
}
