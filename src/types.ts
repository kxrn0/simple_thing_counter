export type Thing = {
  name: string;
  count: number;
  image?: File;
  thumbnail: Blob;
  index: number;
  id: string;
};

export const THUMBNAIL_SIZE = 150;
