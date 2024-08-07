import React, { useState } from "react";
import * as XLSX from "xlsx";
import { db, storage } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "./BulkUpload.css"; 

const BulkUpload = () => {
  const [products, setProducts] = useState([]);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFile(file);
    setFileName(file.name);
  };

  const handleFileUpload = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileData = event.target.result;
      const workbook = XLSX.read(fileData, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      setProducts(worksheet);
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const productCollection = collection(db, "products");

    for (const product of products) {
      if (!product.name || !product.saleprice || !product.regularprice) {
        console.error("Missing field(s) in product: ", product);
        continue;
      }
      const productData = {
        sno:product.sno,
        name: product.name.trim(),
        saleprice: parseFloat(product.saleprice),
        regularprice: parseInt(product.regularprice),
        category:product.category
        
      };
      if (isNaN(productData.saleprice) || isNaN(productData.regularprice)) {
        console.error("Invalid price or quantity for product:", product);
        continue;
      }
      try {
        await addDoc(productCollection, productData);
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    }
    setProducts([]);
    setFileName("");
    setUploadProgress(0);
  };
  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => {
    setDragging(false);
  };
  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    setFile(file);
    setFileName(file.name);
  };
  return (
    <div className="container">
      <h1 className="header">Bulk Upload Products</h1>
      <form onSubmit={handleSubmit}>
        <div
          className={`file-drop-zone ${dragging ? "dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label htmlFor="fileUpload" className="file-label">
            Drag and drop a file here, or click to select a file
          </label>
          <input
            id="fileUpload"
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          {fileName && <p className="file-name">{fileName}</p>}
        </div><br></br>
        <div className="buttons">
          <button className="btn" type="button" onClick={handleFileUpload}>
            Upload File
          </button>
          <button className="btn" type="submit">Submit to Firestore</button>
        </div>
        {uploadProgress > 0 && (
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}
      </form>
    </div>
  );
};

export default BulkUpload;