import { serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";
import type { UploadedAsset } from "@/types/creatorflow";

export async function uploadProfileFile(file: File, pathPrefix: string) {
  const storagePath = `${pathPrefix}/${Date.now()}-${file.name}`;
  const fileRef = ref(storage, storagePath);

  await uploadBytes(fileRef, file);

  return {
    name: file.name,
    path: storagePath,
    url: await getDownloadURL(fileRef),
    uploadedAt: serverTimestamp(),
  } as UploadedAsset;
}

export async function uploadProfileFiles(files: FileList | null, pathPrefix: string) {
  if (!files?.length) return [];

  return Promise.all(
    Array.from(files).map((file) => uploadProfileFile(file, pathPrefix)),
  );
}
