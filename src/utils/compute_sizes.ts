export default function compute_sizes(
  width: number,
  height: number,
  size: number
) {
  const longest = width > height ? width : height;
  const scale = size / longest;

  return {
    width: width * scale,
    height: height * scale,
  };
}
