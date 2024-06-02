function getPageIdFromPineconeId(pineconeId: string) {
  const match = /page(\d+)\#/g.exec(pineconeId);

  if (!match) {
    return null;
  }

  return parseInt(match[1]);
}

export { getPageIdFromPineconeId };
