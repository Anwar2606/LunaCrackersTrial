// src/components/EditProductPage.js
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, storage } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import './EditProduct.css';

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [name, setName] = useState("");
  const [regularprice, setRegularPrice] = useState(0);
  const [saleprice, setSalePrice] = useState(0);
  const [image, setImage] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      const productDoc = doc(db, "products", id);
      const docSnap = await getDoc(productDoc);
      if (docSnap.exists()) {
        const productData = docSnap.data();
        setProduct(productData);
        setName(productData.name);
        setRegularPrice(productData.regularprice);
        setSalePrice(productData.saleprice);
        // setQuantity(productData.quantity);
      }
    };

    fetchProduct();
  }, [id]);

  const handleFileChange = (event) => {
    setImage(event.target.files[0]);
  };

  const handleUpdate = async () => {
   

    const productData = {
      name,
      regularprice: parseFloat(regularprice),
      saleprice: parseInt(saleprice),
      // imageUrl,
    };

    const productRef = doc(db, "products", id);
    await updateDoc(productRef, productData);

    navigate("/products");
  };

  if (!product) return <div>Loading...</div>;

  return (
    <div className="Edit-page">
      <h2 className="Page-title">Edit Product</h2>
      <label>Product name:</label>
      <input
      className="Edit-input1"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Product Name"
      />
      <label>Regular Price:</label>
      <input
      className="Edit-input2"
        type="number"
        value={regularprice}
        onChange={(e) => setRegularPrice(e.target.value)}
        placeholder="Regular Price"
      />
       <label>Sale Price:</label>
     <input
      className="Edit-input2"
        type="number"
        value={saleprice}
        onChange={(e) => setSalePrice(e.target.value)}
        placeholder="Sale Price"
      />
      <input type="file" className="Edit-input3" onChange={handleFileChange} style={{display:"none"}}/>
      <button className="Edit-btn" onClick={handleUpdate}>Update</button>
      <button className="Edit-btn" onClick={() => navigate("/products")}>Cancel</button>
    </div>
  );
};

export default EditProductPage;
