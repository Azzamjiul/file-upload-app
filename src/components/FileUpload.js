import { useState } from "react";

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
  };

  const handleFileUploadChunk = () => {
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    const chunkSize = 5 * 1024 * 1024; // 5MB (adjust based on your requirements)
    const totalChunks = Math.ceil(selectedFile.size / chunkSize);
    const chunkProgress = 100 / totalChunks;
    let chunkNumber = 0;
    let start = 0;
    let end = 0;

    const uploadNextChunk = async () => {
      if (end <= selectedFile.size) {
        const chunk = selectedFile.slice(0);
        const formData = new FormData();
        formData.append("file", chunk);

        fetch("http://localhost:8080/report", {
          method: "POST",
          body: formData,
        })
          .then((response) => response.json())
          .then((data) => {
            console.log({ data });
            const temp = `Chunk ${chunkNumber + 1}/${totalChunks} uploaded successfully`;
            setStatus(temp);
            setProgress(Number((chunkNumber + 1) * chunkProgress));
            console.log(temp);
            chunkNumber++;
            start = end;
            end = start + chunkSize;
            uploadNextChunk();
          })
          .catch((error) => {
            console.error("Error uploading chunk:", error);
          });
      } else {
        setProgress(100);
        setSelectedFile(null);
        setStatus("File upload completed");
      }
    };

    uploadNextChunk();
  };

  const slugify = (text) => {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const CHUNK_SIZE = 1024 * 1024; // 1MB chunk size
  // const CHUNK_SIZE = 1024 * 512; // 512 KB chunk size

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    // Create a new FileReader instance
    const reader = new FileReader();

    // Define a function to execute when the file is read
    reader.onload = async function (event) {
      const fileData = event.target.result; // Get the base64 data
      const fileSize = fileData.length;

      // Calculate the number of chunks
      const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);

      // Create an array to store promises for sending chunks to the server
      const chunkPromises = [];

      // Loop through each chunk and create a promise for sending it to the server
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileSize);
        const chunk = fileData.substring(start, end);

        // Push a promise for sending the chunk to the array
        chunkPromises.push(sendChunkToServer(chunk, i, totalChunks, selectedFile.name));
      }

      // Use Promise.all() to wait for all chunk promises to resolve
      Promise.all(chunkPromises)
        .then(() => {
          console.log('All chunks sent successfully.');
          console.log('File upload completed.');
        })
        .catch(error => {
          console.error('Error sending chunks:', error);
          // Handle error if needed
        });
    };

    // Read the selected file as base64
    reader.readAsDataURL(selectedFile);
  };

  const sendChunkToServer = async (chunk, chunkNumber, totalChunks, originalName) => {
    try {
      const response = await fetch('http://localhost:8080/report/chunk', {
        method: 'POST',
        body: JSON.stringify({
          chunk: chunk,
          chunkNumber: chunkNumber,
          totalChunks: totalChunks,
          slug: slugify(originalName),
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': '',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to upload chunk');
      }

      return response.json();
    } catch (error) {
      throw error;
    }
  };

  return (
    <div>
      <h2>Resumable File Upload</h2>
      <h3>{status}</h3>
      <h3>Progress: {progress}</h3>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload File</button>
    </div>
  );
};

export default FileUpload;
