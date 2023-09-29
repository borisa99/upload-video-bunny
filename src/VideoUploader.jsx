import { useRef } from "react";
import { Upload } from "tus-js-client";

const api_key = "";

async function computeSHA256(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);

  // Convert the hash from an ArrayBuffer to a hexadecimal string
  let hashArray = Array.from(new Uint8Array(hash));
  let hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

const VideoUploader = () => {
  const fileInputRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    const library_id = "";
    const expiration_time = 1727587638;
    let video_id = "";

    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/*+json",
        AccessKey: api_key,
      },
      body: JSON.stringify({ title: file.name }),
    };

    const res = await fetch(
      "https://video.bunnycdn.com/library/159781/videos",
      options
    );
    const data = await res.json();
    video_id = data.guid;

    const input_string = library_id + api_key + expiration_time + video_id;

    console.log("library_id", library_id);
    console.log("api_key", api_key);
    console.log("expiration_time", expiration_time);
    console.log("video_id", video_id);
    const shaSign = await computeSHA256(input_string);

    const upload = new Upload(file, {
      endpoint: "https://video.bunnycdn.com/tusupload",
      retryDelays: [0, 3000, 5000, 10000, 20000, 60000, 60000],
      headers: {
        AuthorizationSignature: shaSign, // SHA256 signature (library_id + api_key + expiration_time + video_id)
        AuthorizationExpire: expiration_time, // Expiration time as in the signature,
        VideoId: video_id, // The guid of a previously created video object through the Create Video API call
        LibraryId: library_id,
      },
      metadata: {
        filename: file.name,
        filetype: file.type,
        // collection: "collectionID",
      },
      onError: (error) => {
        console.log("Failed because: " + error);
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
        console.log(bytesUploaded, bytesTotal, percentage + "%");
      },
      onSuccess: () => {
        console.log("Download %s from %s", upload.file.name, upload.url);
        alert("Success");
      },
    });

    upload.start();
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        accept="video/*"
        onChange={handleUpload}
      />
    </div>
  );
};

export default VideoUploader;
