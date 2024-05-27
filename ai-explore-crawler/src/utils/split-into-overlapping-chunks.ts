function splitIntoOverlappingChunks<T>(
  target: T[],
  chunkSize: number,
  overlapSize: number
) {
  const result: T[][] = [];

  let currentChunkStart = 0;
  let currentChunkEnd = chunkSize;

  while (currentChunkStart < target.length) {
    if (target.length - currentChunkStart > overlapSize) {
      result.push(target.slice(currentChunkStart, currentChunkEnd));
    }

    currentChunkStart += chunkSize - overlapSize;
    currentChunkEnd = currentChunkStart + chunkSize;
  }

  return result;
}

export { splitIntoOverlappingChunks };
