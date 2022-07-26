import { BufferList } from "bl";
export const ipfs = null;

export async function addToIPFS(file) {
  const fileAdded = await ipfs.add(file);

  return fileAdded;
}

export function urlFromCID(cid) {
  return `https://ipfs.infura.io/ipfs/${cid}`;
}

export async function getFromIPFS(hashToGet) {
  for await (const file of ipfs.cat(hashToGet)) {
    const content = new BufferList(file).toString();

    return content;
  }
}
