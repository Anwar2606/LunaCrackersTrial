import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../assets/noback.png';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <h1 className="navbar-title"><Link to="/home" ><img src={Logo} height={"150px"} alt="Home" /></Link>
          
        </h1>
      <ul className="navbar-list">
     
         <li className="navbar-item">
          <Link to="/home" className="navbar-link">Dashboard</Link>
        </li>
        
        <li className="navbar-item">
          <Link to="/products" className="navbar-link">Products</Link>
        </li>
        
        {/* <li className="navbar-item">
          <Link to="/multipleproducts" className="navbar-link">Add MultipleProducts</Link>
        </li> */}
        <li className="navbar-item">
          <Link to="/bill" className="navbar-link">Invoice</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
