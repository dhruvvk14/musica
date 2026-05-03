import { getStorage, ref, uploadBytesResumable, getDownloadURL, type StorageReference, type UploadTaskSnapshot } from 'firebase/storage';
import { app } from './firebase-config'; // Ensure app is initialized

const storage = getStorage(app);


export async function uploadFile( // <--- Added 'export' here
  file: File,
  filePath: string,
  onProgress?: (percentage: number) => void
): Promise<string> {
  const storageRef: StorageReference = ref(storage, filePath);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(progress);
        console.log('Upload is ' + progress + '% done');
      },
      (error) => {
        console.error('Upload failed:', error);
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        console.log('File available at', downloadURL);
        resolve(downloadURL);
      }
    );
  });
}