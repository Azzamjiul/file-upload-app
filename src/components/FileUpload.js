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
        // const chunk = selectedFile.slice(start, end);
        const chunk = selectedFile.slice(0);
        const formData = new FormData();
        formData.append("file", chunk);
        // formData.append("chunkNumber", chunkNumber);
        // formData.append("totalChunks", totalChunks);
        // formData.append("originalname", selectedFile.name);

        fetch("http://localhost:8080/report", {
          method: "POST",
          body: formData,
          // Add headers if needed (e.g., authorization token)
          // headers: {
          //   "Content-Type": "application/octet-stream", // Set the content type to indicate raw binary data
          // },
          // body: chunk,
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

  // const CHUNK_SIZE = 1024 * 1024; // 1MB chunk size
  const CHUNK_SIZE = 1024 * 512; // 512 KB chunk size

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

      // Send each chunk to the server using Fetch API
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileSize);
        const chunk = fileData.substring(start, end);

        try {
          await sendChunkToServer(chunk, i + 1, totalChunks, selectedFile.name);
          console.log(`Chunk ${i + 1}/${totalChunks} sent successfully.`);
        } catch (error) {
          console.error(`Failed to send chunk ${i + 1}/${totalChunks}:`, error);
          return; // Stop uploading if an error occurs
        }
      }

      console.log('File upload completed.');
    };

    // Read the selected file as base64
    reader.readAsDataURL(selectedFile);
  };

  const sendChunkToServer = async (chunk, chunkNumber, totalChunks, originalName) => {
    try {
      const response = await fetch('http://localhost:8080/report', {
        method: 'POST',
        body: JSON.stringify({
          chunk: chunk,
          chunkNumber: chunkNumber,
          totalChunks: totalChunks,
          slug: slugify(originalName),
        }),
        headers: {
          'Content-Type': 'application/json'
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
