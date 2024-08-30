import compute_sizes from "./compute_sizes";

export default function create_thumbnail(
  file: File,
  size: number
): Promise<Blob> {
  const errorMessage = "couldn't create thumbnail!";

  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);

    img.src = url;

    img.addEventListener("load", () => {
      const { width, height } = compute_sizes(
        img.naturalWidth,
        img.naturalHeight,
        size
      );

      canvas.width = width;
      canvas.height = height;

      context?.drawImage(img, 0, 0, width, height);

      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (blob === null) return reject(new Error(errorMessage));

        resolve(blob);
      }, "image/jpg");
    });

    img.addEventListener("error", () => reject(errorMessage));
  });
}
