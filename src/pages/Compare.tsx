import React, { useState } from "react";
import {useEffect} from 'react'



type Mistake = {
  noteNumber: number;
  played: string;
  expected: string;
};

type CompareResponse = {
  mistakes: Mistake[];
};

export default function Compare() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!imageFile || !audioFile) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("audio", audioFile);

    try {
      const res = await fetch("http://localhost:8000/compare_upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const data = await res.json();
      console.log("Upload success:", data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    const fetchComparison = async (): Promise<void> => {
      const response = await fetch("/compare_upload", {
        method: "POST",
      });

      const data = (await response.json()) as CompareResponse;

      data.mistakes.forEach((m) => {
        console.log(
          `Note ${m.noteNumber}: expected ${m.expected}, played ${m.played}`
        );
      });
    };

    fetchComparison();
  }, []);


  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: 20 }}>
      <h2>Compare Performance</h2>

      {/* Sheet Music Upload */}
      <div style={{ marginBottom: 16 }}>
        <label>
          Sheet Music (PNG):
          <input
            type="file"
            accept="image/png"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      {/* Video Upload */}
      <div style={{ marginBottom: 16 }}>
        <label>
          Performance Audio:
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!imageFile || !audioFile || loading}
      >
        {loading ? "Uploading..." : "Upload & Compare"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
