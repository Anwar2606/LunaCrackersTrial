import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase"; // Assuming you have this configured
import { collection, query, where, getDocs, doc, deleteDoc, orderBy } from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./ProductList.css";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [category, setCategory] = useState('');
  const [categoryCounts, setCategoryCounts] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      const productsCollectionRef = collection(db, "products");

      let q = productsCollectionRef;
      if (category) {
        q = query(productsCollectionRef, where("category", "==", category));
      } else {
        q = query(productsCollectionRef);
      }

      try {
        const querySnapshot = await getDocs(q);
        const fetchedProducts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Sort products numerically and alphabetically
        fetchedProducts.sort((a, b) => {
          const nameA = a.name.toUpperCase(); // Convert to uppercase to ensure case-insensitive comparison
          const nameB = b.name.toUpperCase();

          // Compare numerically and alphabetically
          const numberComparison = nameA.localeCompare(nameB, undefined, { numeric: true });
          return numberComparison;
        });

        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products: ", error);
      }
    };

    const fetchCategoryCounts = async () => {
      const productsCollectionRef = collection(db, "products");
      const querySnapshot = await getDocs(productsCollectionRef);

      const counts = {};
      querySnapshot.forEach((doc) => {
        const product = doc.data();
        if (counts[product.category]) {
          counts[product.category] += 1;
        } else {
          counts[product.category] = 1;
        }
      });

      setCategoryCounts(counts);
    };

    fetchProducts();
    fetchCategoryCounts();
  }, [category]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
  };

  const toggleDescription = (productId) => {
    const updatedProducts = products.map((product) => {
      if (product.id === productId) {
        return {
          ...product,
          expanded: !product.expanded,
        };
      }
      return product;
    });
    setProducts(updatedProducts);
  };

  const handleBulkUploadClick = () => {
    navigate('/bulkupload');
  };

  const handleNewProductClick = () => {
    navigate('/add');
  };

  // Filter products by search term and category
  const filteredProducts = products.filter(product => 
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.sno.toString().includes(searchTerm)) &&
    (category ? product.category === category : true)
  );

  const deleteProduct = async (productId, event) => {
    event.stopPropagation();

    try {
      await deleteDoc(doc(db, "products", productId));
      setProducts(products.filter((product) => product.id !== productId));
    } catch (error) {
      console.error("Error deleting product: ", error);
    }
  };

  const handleSelectProduct = (event, productId) => {
    const isChecked = event.target.checked;
    if (isChecked) {
      setSelectedProducts((prevSelected) => [...prevSelected, productId]);
    } else {
      setSelectedProducts((prevSelected) => prevSelected.filter((id) => id !== productId));
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((product) => product.id));
    }
    setSelectAll(!selectAll);
  };

  const bulkDeleteProducts = async () => {
    const promises = selectedProducts.map(async (productId) => {
      try {
        await deleteDoc(doc(db, "products", productId));
      } catch (error) {
        console.error("Error deleting product: ", error);
      }
    });

    await Promise.all(promises);
    setProducts((prevProducts) =>
      prevProducts.filter((product) => !selectedProducts.includes(product.id))
    );
    setSelectedProducts([]);
    setSelectAll(false);
  };

  const padSno = (sno) => {
    return sno.replace(/(\d+)/, (match) => match.padStart(3, '0'));
  };

  const downloadPDF = () => {
    const sortedProducts = [...products].sort((a, b) => padSno(a.sno).localeCompare(padSno(b.sno)));
    const doc = new jsPDF();
    const tableColumn = ["S.No", "Name", "Regular Price", "Sales Price", "Category"];
    const tableRows = [];

    sortedProducts.forEach((product, index) => {
      const productData = [
        product.sno,
        product.name,
        `Rs.${product.regularprice.toFixed(2)}`,
        `Rs.${product.saleprice.toFixed(2)}`,
        product.category
      ];
      tableRows.push(productData);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 10 });
    doc.save("Product_List.pdf");
  };

  return (
    <div className="product-list-container">
      <h2 className="product-list-title">Product List</h2>
      <input
        type="text"
        className="product-list-input"
        placeholder="Search products"
        value={searchTerm}
        onChange={handleSearch}
      />
      <select className="custom-select" value={category} onChange={handleCategoryChange}>
        <option value="">All Products</option>
        {Object.keys(categoryCounts).map((cat) => (
          <option key={cat} value={cat}>
            {cat} ({categoryCounts[cat]})
          </option>
        ))}
      </select>
      <div className="button-row">
        <button className="select-all-button" onClick={handleSelectAll}>
          {selectAll ? "Deselect All" : "Select All"}
        </button>
        <button className="bulk-delete-button" onClick={bulkDeleteProducts}>
          <i className="fas fa-trash-alt"></i> Bulk Delete
        </button>
        <button className="bulk-new-button" onClick={handleNewProductClick} style={{ position: "relative", left: "500px" }}>
          <i className="fa fa-plus-circle"></i> New
        </button>
        <button className="bulk-upload-button" onClick={handleBulkUploadClick} style={{ position: "relative", left: "530px" }}>
          <i className="fa fa-upload"></i> Bulk Upload
        </button>
        <button className="download-button2" onClick={downloadPDF} style={{ position: "relative", left: "560px" }}>
          <i className="fa fa-download"></i> Download PDF
        </button>
      </div>
      <ul className="product-list">
        {filteredProducts.map((product) => (
          <li key={product.id} className="product-item">
            <input
              type="checkbox"
              className="product-checkbox"
              checked={selectedProducts.includes(product.id)}
              onChange={(event) => handleSelectProduct(event, product.id)}
            />
            <div className="product-info" onClick={() => toggleDescription(product.id)}>
              <div className="products-details">
                <div className="product-name">{product.name}</div>
                {product.expanded && (
                  <div className="product-description">{product.description}</div>
                )}
                <div className="product-price">Regular price: Rs.{product.regularprice.toFixed(2)}</div>
                <div className="product-price">Sales price: Rs.{product.saleprice.toFixed(2)}</div>
              </div>
            </div>
            <div className="product-actions">
              <Link to={`/edit-product/${product.id}`}>
                <button className="edit-button">
                  <i className="fas fa-edit"></i> Edit
                </button>
              </Link>
              <button className="delete-button" onClick={(event) => deleteProduct(product.id, event)}>
                <i className="fas fa-trash-alt"></i> Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductList;
