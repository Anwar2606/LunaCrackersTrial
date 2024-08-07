import React, { useState } from 'react';
import { db } from '../firebase'; 
import { collection, addDoc } from 'firebase/firestore';
import './Addproduct.css'; 
const AddProduct = () => {
  const [sno, setSno] = useState('');
  const [name, setName] = useState('');
  const [saleprice, setSalePrice] = useState('');
  const [regularprice, setRegularPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState(''); 
  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, 'products'), {
        sno,
        name,
        saleprice: parseFloat(saleprice),
        regularprice: parseFloat(regularprice),
        quantity: parseInt(quantity),
        category, 
        discount: 0,
      });
      setSno('');
      setName('');
      setSalePrice('');
      setRegularPrice('');
      setQuantity('');
      setCategory('');
      alert('Product added successfully!');
      window.location.reload();
    } catch (error) {
      console.error("Error adding product: ", error);
    }
  };

  return (
    <div className="add-product-page">
      <div className="add-product-container">
        <h2>Add Product</h2>
        <form onSubmit={handleAddProduct} className="add-product-form">
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Name" 
            required 
          />
          <input 
            type="number" 
            value={saleprice} 
            onChange={(e) => setSalePrice(e.target.value)} 
            placeholder="Sale Price" 
            required 
          />
          <input 
            type="number" 
            value={regularprice} 
            onChange={(e) => setRegularPrice(e.target.value)} 
            placeholder="Regular Price" 
            required 
          />
          <input 
            type="text" 
            value={quantity} 
            onChange={(e) => setQuantity(e.target.value)} 
            placeholder="Quantity" 
            required 
          />
            <select 
             className="custom-select"
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              required
            >
              <option value="" disabled>Select Category</option>
              <option value="ONE SOUND CRACKERS">ONE SOUND CRACKERS</option>
              <option value="SPARKLERS RAMS HQ">SPARKLERS RAMS HQ</option>
              <option value="RAMESH SPARKLERS SPL">RAMESH SPARKLERS SPL</option>
              <option value="FLOWER POTS HQ">FLOWER POTS HQ</option>
              <option value="FLOWER POTS VARSHINI">FLOWER POTS VARSHINI</option>
              <option value="GROUND CHAKKARS VARSHINI">GROUND CHAKKARS VARSHINI</option>
              <option value="FANCY CHAKKARS ">FANCY CHAKKARS</option>
              <option value="FMUD POTS MERCURY  SPL">FMUD POTS MERCURY  SPL</option>
              <option value="T.STARS / CANDLE / PENCIL">T.STARS / CANDLE / PENCIL</option>
              <option value="DIGITAL WALAS">DIGITAL WALAS</option>
              <option value="STARVELL COLOURFUL COLLECTIONS">STARVELL COLOURFUL COLLECTIONS</option>
              <option value="DAMO FW KIDS NEW COLLECTIONS">DAMO FW KIDS NEW COLLECTIONS</option>
              <option value="VANITHA FIREWORKS">VANITHA FIREWORKS</option>
              <option value="CHANK BRAND RAVINDRA FW">CHANK BRAND RAVINDRA FW</option>
              <option value="COLOURFUL PEACOCK COLLECTION">COLOURFUL PEACOCK COLLECTIO</option>
              <option value="RAMESH COLOUR MATCHES">RAMESH COLOUR MATCHES</option>
              <option value="ASSORTED KIDS FANCY SPL ">ASSORTED KIDS FANCY SPL</option>
              <option value="ASSORTED FANCY NOVELTIES">ASSORTED FANCY NOVELTIES</option>
              <option value="FANCY FOUNTAINS">FANCY FOUNTAINS</option>
              <option value="BOMBS">BOMBS</option>
              <option value="MULTIPLE MULTI COLOUR SHOTS">MULTIPLE MULTI COLOUR SHOTS</option>
              <option value="MEGA PREMIUM SINGLE PIPES">MEGA PREMIUM SINGLE PIPES</option>
              <option value="WILLOW'S FOCUS SPL GIFT BOXES">WILLOW'S FOCUS SPL GIFT BOXES</option>
            </select>
          <button type="submit">Add Product</button>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
