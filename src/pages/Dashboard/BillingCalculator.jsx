import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // Import the initialized firebase instance
import { collection, query, where, getDocs, addDoc, Timestamp, setDoc, getDoc, doc } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './BillingCalculator.css'; // Import the CSS file

const BillingCalculator = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState('');
  let invoiceNumber = ''; 
  const [billingDetails, setBillingDetails] = useState({
    totalAmount: 0,
    discountPercentage: '',
    discountedTotal: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    grandTotal: 0,
  });
  const [customerName, setCustomerName] = useState('');
  const [customerState, setCustomerState] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [invoiceNumbers, setInvoiceNumbers] = useState('');
  const [customerGSTIN, setCustomerGSTIN] = useState('');
  const [customerPAN, setCustomerPAN] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [manualInvoiceNumber, setManualInvoiceNumber] = useState('');
  const [businessState, setBusinessState] = useState('YourBusinessState');
  const [searchTerm, setSearchTerm] = useState('');
  const [taxOption, setTaxOption] = useState('cgst_sgst');
  const [currentDate, setCurrentDate] = useState(new Date()); // State for current date
  const [showCustomerDetails, setShowCustomerDetails] = useState(false); // State for toggling customer details
  const handleInvoiceNumberChange = (event) => {
    setManualInvoiceNumber(event.target.value);
  };
  useEffect(() => {
    const fetchProducts = async () => {
      const productsCollectionRef = collection(db, 'products');
      try {
        const querySnapshot = await getDocs(productsCollectionRef);
        const fetchedProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products: ', error);
      }
    };

    fetchProducts();
  }, []);
   useEffect(() => {
    const filterProducts = () => {
      let filtered = products;

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(product => {
          const productName = product.name ? product.name.toLowerCase() : '';
          const productCode = product.sno ? product.sno.toLowerCase() : '';
          return productName.includes(searchTerm.toLowerCase()) || productCode.includes(searchTerm.toLowerCase());
        });
      }

      // Filter by category
      if (category) {
        filtered = filtered.filter(product => product.category === category);
      }

      // Sort filtered products alphabetically
      filtered.sort((a, b) => {
        const nameA = a.name.toUpperCase(); // Convert to uppercase to ensure case-insensitive comparison
        const nameB = b.name.toUpperCase();
        return nameA.localeCompare(nameB, undefined, { numeric: true });
      });

      setFilteredProducts(filtered);
    };

    filterProducts();
  }, [searchTerm, category, products]);

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
  };
  const handleQuantityChange = (productId, quantity) => {
    const updatedCart = cart.map(item =>
      item.productId === productId ? { ...item, quantity: parseInt(quantity, 10) } : item
    );
    setCart(updatedCart);
    updateBillingDetails(updatedCart);
  };

  const updateBillingDetails = (updatedCart) => {
    const totalAmount = updatedCart.reduce((total, item) => {
      return total + (item.saleprice * item.quantity);
    }, 0);

    const discountPercentage = parseFloat(billingDetails.discountPercentage) || 0;
    const discountedTotal = totalAmount * (1 - discountPercentage / 100);

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (taxOption === 'cgst_sgst') {
      if (customerState === businessState) {
        cgstAmount = discountedTotal * 0.09;
        sgstAmount = discountedTotal * 0.09;
      } else {
        cgstAmount = discountedTotal * 0.09;
        sgstAmount = discountedTotal * 0.09;
      }
    } else if (taxOption === 'igst') {
      igstAmount = discountedTotal * 0.18;
    }

    const grandTotal = discountedTotal + cgstAmount + sgstAmount + igstAmount;

    setBillingDetails(prevState => ({
      ...prevState,
      totalAmount,
      discountedTotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      grandTotal,
    }));
  };
  
  const handleDiscountChange = (event) => {
    const discountPercentage = event.target.value;
    setBillingDetails(prevState => ({
      ...prevState,
      discountPercentage,
    }));
  };
  const ClearAllData =() => {
    window.location.reload();
  };

  useEffect(() => {
    updateBillingDetails(cart);
  }, [billingDetails.discountPercentage, customerState, taxOption]);
  function numberToWords(num) {
    const ones = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const thousands = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

    function convertHundreds(num) {
        let str = '';
        if (num > 99) {
            str += ones[Math.floor(num / 100)] + ' Hundred ';
            num %= 100;
        }
        if (num > 19) {
            str += tens[Math.floor(num / 10)] + ' ';
            num %= 10;
        }
        if (num > 9) {
            str += teens[num - 10] + ' ';
        } else if (num > 0) {
            str += ones[num] + ' ';
        }
        return str.trim();
    }

    function convertToWords(n) {
        if (n === 0) return 'Zero';

        let words = '';

        let i = 0;
        while (n > 0) {
            let rem = n % 1000;
            if (rem !== 0) {
                words = convertHundreds(rem) + ' ' + thousands[i] + ' ' + words;
            }
            n = Math.floor(n / 1000);
            i++;
        }
        return words.trim();
    }

    // Split the number into rupees and paise
    const rupees = Math.floor(num);
  

    return convertToWords(rupees);
}

function formatGrandTotal(amount) {
  return `${Math.floor(amount).toString()}.00`;
}
const saveBillingDetails = async (newInvoiceNumber) => {
  if (!newInvoiceNumber) {
    alert("Invoice number is required.");
    return;
  }

  if (cart.length === 0) {
    alert("Cart is empty. Cannot generate invoice.");
    return;
  }
  const billingDocRef = collection(db, 'billing');
  try {
    await addDoc(billingDocRef, {
      ...billingDetails,
      customerName,
      customerAddress,
      customerState,
      customerPhone,
      customerEmail,
      customerGSTIN,
      date: Timestamp.fromDate(currentDate),
      productsDetails: cart.map(item => ({
        productId: item.productId,
        name: item.name,
        saleprice: item.saleprice,
        quantity: item.quantity
      })),
      createdAt: Timestamp.now(),
      invoiceNumber, // Use the same invoice number
    });
    console.log('Billing details saved successfully in Firestore');
  } catch (error) {
    console.error('Error saving billing details: ', error);
  }
};

const generatePDF = (copyType, invoiceNumber) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20); // Draw border
    const imgData='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'
     doc.addImage(imgData, 'JPEG', 14, 18, 29, 29);
    doc.setFontSize(10);
    doc.setTextColor(255, 0, 0);  
    // Set font to bold and add the text
    doc.setFont('helvetica', 'bold');
    doc.text('LUNA CRACKERS', 44, 21);
    doc.setTextColor(0, 0, 0);
    // Reset font to normal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    // Add the rest of the text
    doc.text(' 4/476/2, meenampatti north, Anuppankulam, Sivakasi-626189', 44, 28);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Phone number:', 44, 35); // Regular text
   doc.setFont('helvetica', 'normal');
   doc.text('+91 88381 88818', 68, 35); // Bold text
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', 44, 42);
    doc.setFont('helvetica', 'normal');
    doc.text('lunacrackers18@gmail.com', 54, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('State:', 44, 49);
    doc.setFont('helvetica', 'normal');
    doc.text('33-Tamil Nadu', 53, 49);
    doc.setFontSize(10);
    doc.setTextColor(255, 0, 0);  
    doc.setFont('helvetica', 'bold');
     doc.text(`INVOICE`, 138, 22);
     doc.text(`${copyType}`,138, 29);
     doc.text(`Invoice Number: LC-${invoiceNumber}-24`, 138, 43);
     doc.setTextColor(0, 0, 0);
doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.text(`Date: ${currentDate.toLocaleDateString()}`, 138, 36);
doc.setFont('helvetica', 'bold');
doc.text('GSTIN: 123456789', 138, 49);


doc.rect(14, 15, 182, 40  );

doc.setFontSize(12);
doc.setTextColor(170, 51, 106);  
// Set font to bold and add the text
doc.setFont('helvetica', 'bold');
doc.text('BILLED TO', 19, 65);
doc.setTextColor(0, 0, 0);


doc.setFont('helvetica', 'normal');
doc.rect(14, 15, 182, 40);
doc.setFontSize(9);
       doc.setTextColor(170, 51, 106);  

       
       doc.setTextColor(0, 0, 0);

       doc.setFont('helvetica', 'normal');
       doc.setFontSize(9);
       const startX = 21;
       let startY = 72;
       const lineHeight = 8; 
      
       const labels = [
         'Name',
         'Address',
         'State',
         'Phone',
         'GSTIN',
         'AADHAR'
       ];
       
       const values = [
         customerName,
         customerAddress,
         customerState,
         customerPhone,
         customerGSTIN,
         customerPAN
       ];

       const maxLabelWidth = Math.max(...labels.map(label => doc.getTextWidth(label)));

       const colonOffset = 2; 
       const maxLineWidth = 160; 
       const maxTextWidth = 104; 

       labels.forEach((label, index) => {
         const labelText = label;
         const colonText = ':';
         const valueText = values[index];
       
         // Calculate positions
         const colonX = startX + maxLabelWidth + colonOffset;
         const valueX = colonX + doc.getTextWidth(colonText) + colonOffset;

         const splitValueText = doc.splitTextToSize(valueText, maxTextWidth - valueX);

         doc.text(labelText, startX, startY);
         doc.text(colonText, colonX, startY);

         splitValueText.forEach((line, lineIndex) => {
           doc.text(line, valueX, startY + (lineIndex * lineHeight));
         });

         startY += lineHeight * splitValueText.length;
       });
          
   doc.setFontSize(12);
   doc.setTextColor(170, 51, 106);  
  
   doc.setFont('helvetica', 'bold');
   doc.text('SHIPPED TO', 107, 65);
   doc.setFont('helvetica', 'normal');
   doc.setTextColor(0, 0, 0);
   doc.setFontSize(9);
   const initialX = 110;
   let initialY = 72;
   const lineSpacing = 8;  
   const spacingBetweenLabelAndValue = 3; 
   const maxValueWidth = 65; 
   const labelTexts = [
     'Name',
     'Address',
     'State',
     'Phone',
     'GSTIN',
     'AADHAR'
   ];

   const valuesTexts = [
     customerName,
     customerAddress,
     customerState,
     customerPhone,
     customerGSTIN,
     customerPAN,
   ];

   const maxLabelTextWidth = Math.max(...labelTexts.map(label => doc.getTextWidth(label)));

   const colonWidth = doc.getTextWidth(':');

   labelTexts.forEach((labelText, index) => {
     const valueText = valuesTexts[index];

     const labelWidth = doc.getTextWidth(labelText);
     const colonX = initialX + maxLabelTextWidth + (colonWidth / 2);

     const valueX = colonX + colonWidth + spacingBetweenLabelAndValue;

     const splitValueText = doc.splitTextToSize(valueText, maxValueWidth);

     doc.text(labelText, initialX, initialY);
     doc.text(':', colonX, initialY); 

     splitValueText.forEach((line, lineIndex) => {
       doc.text(line, valueX, initialY + (lineIndex * lineSpacing));
     });

     initialY += lineSpacing * splitValueText.length;
   });

       const rectX = 14;
       const rectY = 58;
       const rectWidth = 182;
       const rectHeight = 75;

       doc.rect(rectX, rectY, rectWidth, rectHeight);

       const centerX = rectX + rectWidth / 2;

       doc.line(centerX, rectY, centerX, rectY + rectHeight);

       const tableBody = cart
         .filter(item => item.quantity > 0)
         .map(item => [
           item.name,
           '36041000',
           item.quantity.toString(),
           `Rs. ${item.saleprice.toFixed(2)}`,
           `Rs. ${(item.saleprice * item.quantity).toFixed(2)}`
         ]);

       tableBody.push(
         [
           { content: 'Total Amount:', colSpan: 4, styles: { halign: 'right', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } },
           { content:  `${Math.round(billingDetails.totalAmount)}.00`, styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } }
         ],
         [
           { content: `Discount (${billingDetails.discountPercentage}%):`, colSpan: 4, styles: { halign: 'right', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } },
           { content: `${Math.round(billingDetails.totalAmount * (parseFloat(billingDetails.discountPercentage) / 100) || 0).toFixed(2)}`, styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } }
         ],
         [
           { content: 'Sub Total:', colSpan: 4, styles: { halign: 'right', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } },
           { content:  `${Math.round(billingDetails.discountedTotal)}.00`, styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } }
         ]
       );
     
       if (taxOption === 'cgst_sgst') {
         tableBody.push(
           [
             { content: 'CGST (9%):', colSpan: 4, styles: { halign: 'right', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } },
             { content:  `${Math.round(billingDetails.cgstAmount)}.00`, styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } }
           ],
           [
             { content: 'SGST (9%):', colSpan: 4, styles: { halign: 'right', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } },
             { content:  `${Math.round(billingDetails.sgstAmount)}.00`, styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } }
           ]
         );
       } else if (taxOption === 'igst') {
         tableBody.push(
           [
             { content: 'IGST (18%):', colSpan: 4, styles: { halign: 'right', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } },
             {
               content: formatGrandTotal(grandTotal),
               styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' }
             }
           ]
         );
       }
       const grandTotal = billingDetails.grandTotal;
       tableBody.push(
         [
           {
             content: 'Grand Total:',
             colSpan: 4,
             styles: { halign: 'right', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' }
           },
           {
             content: `${Math.round(billingDetails.grandTotal)}.00`,
             styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' }
           }
         ]
       );

       doc.autoTable({
         head: [['Product Name','HSN Code', 'Quantity', 'Rate per price', 'Total']],
         body: tableBody,
         startY: 150,
         theme: 'grid',
         headStyles: { fillColor: [255, 182, 193], textColor: [0, 0, 139], lineWidth: 0.2, lineColor: [0, 0, 0] }, // Reduced lineWidth
         bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.2, lineColor: [0, 0, 0] }, // Reduced lineWidth
         alternateRowStyles: { fillColor: [245, 245, 245] },
       });
       const totalAmount = cart.reduce((total, item) => total + item.quantity * item.saleprice, 0);
const pageSizeWidth = doc.internal.pageSize.getWidth();
const pageSizeHeight = doc.internal.pageSize.getHeight();

const borderMargin = 10;
const borderWidth = 0.2; 
const additionalTopPadding = 30; 
let currentPage = 1;

// Draw page border
const drawPageBorder = () => {
doc.setDrawColor(0, 0, 0); // Border color (black)
doc.setLineWidth(borderWidth);
doc.rect(borderMargin, borderMargin, pageSizeWidth - borderMargin * 2, pageSizeHeight - borderMargin * 2);
};

// Check if content will fit on the current page
const checkPageEnd = (currentY, additionalHeight, resetY = true) => {
if (currentY + additionalHeight > pageSizeHeight - borderMargin) { // Ensure it fits within the page
 doc.addPage();
 drawPageBorder();
 currentPage++; // Increment the page number
 // Apply additional top padding on the new page if it's the second page or later
 return resetY ? (currentPage === 2 ? borderMargin + additionalTopPadding : borderMargin) : currentY; // Apply margin for new page or keep currentY
}
return currentY;
};

// Initialize the y position after auto table
let y = doc.autoTable.previous.finalY + borderMargin; // Start Y position after the auto table

// Grand total in words
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
const grandTotalInWords = numberToWords(billingDetails.grandTotal); 
const backgroundColor = [255, 182, 193]; // RGB for light pink
const textColor = [0, 0, 139]; // RGB for dark blue
const marginLeft = borderMargin + 7; // Adjusted to be within margins
const padding = 5;
const backgroundWidth = 186; // Fixed width for the background rectangle
const text = `Rupees: ${grandTotalInWords}`;
const textDimensions = doc.getTextDimensions(text);
const textWidth = textDimensions.w;
const textHeight = textDimensions.h;

const backgroundX = marginLeft - padding;
const backgroundY = y - textHeight - padding;
const backgroundHeight = textHeight + padding * 2; // Height including padding

// Check if there’s enough space for the content; if not, create a new page
y = checkPageEnd(y, backgroundHeight);

doc.setTextColor(...textColor);

// Add text on top of the background
doc.text(text, marginLeft, y);

// Continue with "Terms & Conditions" and other content
const rectFX = borderMargin + 4; // Adjusted to be within margins
const rectFWidth = pageSizeWidth - 2 * rectFX; // Adjust width to fit within page
const rectPadding = 4; // Padding inside the rectangle
// const lineHeight = 8; // Line height for text
const rectFHeight = 6 + lineHeight * 2 + rectPadding * 2; // Header height + 2 lines of text + padding

// Ensure there's enough space for the rectangle and text
y = checkPageEnd(y + backgroundHeight + 8, rectFHeight);

doc.setFont('helvetica', 'normal');
doc.rect(rectFX, y, rectFWidth, rectFHeight);

// Drawing the "Terms & Conditions" text inside the rectangle
doc.setFont('helvetica', 'bold');
doc.setTextColor(0, 0, 0);
doc.setFontSize(10);

let textY = y + rectPadding + 6; // Adjust as needed for vertical alignment
doc.text('Terms & Conditions', rectFX + rectPadding, textY);

// Adjust vertical position for the following text
textY = checkPageEnd(textY + lineHeight, lineHeight, false);
doc.setFont('helvetica', 'normal');
doc.text('1. Goods once sold will not be taken back.', rectFX + rectPadding, textY);

textY = checkPageEnd(textY + lineHeight, lineHeight, false);
doc.text('2. All matters Subject to "Sivakasi" jurisdiction only.', rectFX + rectPadding, textY);

// Add "Authorised Signature" inside the rectangle at the bottom right corner
const authSigX = rectFX + rectFWidth - rectPadding - doc.getTextWidth('Authorised Signature');
const authSigY = y + rectFHeight - rectPadding;
doc.setFont('helvetica', 'bold');
doc.text('Authorised Signature', authSigX, authSigY);

// Continue with additional content
y = checkPageEnd(y + rectFHeight + 8, 40, false);

// Reset font and color for additional text
doc.setFontSize(12);
doc.setTextColor(170, 51, 106);

// More content with additional checks
y = checkPageEnd(y + 45, 10, false);
doc.setFontSize(9);
doc.setTextColor(0, 0, 0);

y = checkPageEnd(y + 5, 20, false);
doc.setFont('helvetica', 'bold');

y = checkPageEnd(y + 7, 23, false);
doc.setFont('helvetica', 'normal');
doc.setTextColor(0, 0, 0);
doc.setFontSize(10);

// Draw the page border at the end
drawPageBorder();





  
doc.save(`invoice_${invoiceNumber}_${copyType}.pdf`);
};
const handleGenerateAllCopies = async () => {
  await saveBillingDetails(manualInvoiceNumber);
  transportCopy(manualInvoiceNumber);
  salesCopy(manualInvoiceNumber);
  OfficeCopy(manualInvoiceNumber);
  // CustomerCopy(manualInvoiceNumber)
};

const transportCopy = (invoiceNumber) => {
  generatePDF('TRANSPORT COPY', invoiceNumber);
};

const salesCopy = (invoiceNumber) => {
  generatePDF('SALES COPY', invoiceNumber);
};

const OfficeCopy = (invoiceNumber) => {
  generatePDF('OFFICE COPY', invoiceNumber);
};
const CustomerCopy = async () => {
  if (cart.length === 0) {
    alert('The cart is empty. Please add items to the cart before saving.');
    return; // Exit the function if the cart is empty
  }

  // Validate the invoice number
  const invoiceNumber = manualInvoiceNumber.trim();
  if (!invoiceNumber) {
    alert('Please enter a valid invoice number.');
    return; // Exit the function if the invoice number is empty
  }
  const billingDocRef = collection(db, 'customerBilling');
  
  try {
    
    await addDoc(billingDocRef, {
      ...billingDetails,
      customerName,
      customerAddress,
      customerState,
      customerPhone,
      customerEmail,
      customerGSTIN,
      date: Timestamp.fromDate(currentDate),
      productsDetails: cart.map(item => ({
        productId: item.productId,
        name: item.name,
        saleprice: item.saleprice,
        quantity: item.quantity
      })),
      createdAt: Timestamp.now(),
      invoiceNumber, // Use the same invoice number
    });
    console.log('Billing details saved successfully in Firestore');
  } catch (error) {
    console.error('Error saving billing details: ', error);
  }

  // Generate and save PDF invoice
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20); // Draw border
    const imgData='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'
     doc.addImage(imgData, 'JPEG', 14, 18, 29, 29);
    doc.setFontSize(10);
    doc.setTextColor(255, 0, 0);  
    // Set font to bold and add the text
    doc.setFont('helvetica', 'bold');
    doc.text('A.M.SAKTHI PYROPARK', 44, 21);
    doc.setTextColor(0, 0, 0);
    // Reset font to normal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    // Add the rest of the text
    doc.text('A.G.P.POLITECNIC OFF SIDE 3/299D,Sivakasi prinding collage, Amathur', 44, 28);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Phone number:', 44, 35); // Regular text
   doc.setFont('helvetica', 'normal');
   doc.text('8098892999', 68, 35); // Bold text
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', 44, 42);
    doc.setFont('helvetica', 'normal');
    doc.text('hariprakashtex@gmail.com', 54, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('State:', 44, 49);
    doc.setFont('helvetica', 'normal');
    doc.text('33-Tamil Nadu', 53, 49);
    doc.setFontSize(10);
    doc.setTextColor(255, 0, 0);  
    doc.setFont('helvetica', 'bold');
     doc.text(`INVOICE`, 138, 22);
     doc.text(`CUSTOMER COPY`,138, 29);
     doc.text(`Estimate Number: AMSC-${invoiceNumber}-24`, 138, 43);
     doc.setTextColor(0, 0, 0);
doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.text(`Date: ${currentDate.toLocaleDateString()}`, 138, 36);
doc.setFont('helvetica', 'bold');
doc.text('GSTIN: 33AEGFS0424L1Z4', 138, 49);


doc.rect(14, 15, 182, 40  );

doc.setFontSize(12);
doc.setTextColor(170, 51, 106);  
// Set font to bold and add the text
doc.setFont('helvetica', 'bold');
doc.text('BILLED TO', 19, 65);
doc.setTextColor(0, 0, 0);


doc.setFont('helvetica', 'normal');
doc.rect(14, 15, 182, 40);
doc.setFontSize(9);
       doc.setTextColor(170, 51, 106);  

       
       doc.setTextColor(0, 0, 0);

       doc.setFont('helvetica', 'normal');
       doc.setFontSize(9);
       const startX = 21;
       let startY = 72;
       const lineHeight = 8; 
      
       const labels = [
         'Name',
         'Address',
         'State',
         'Phone',
         'GSTIN',
         'AADHAR'
       ];
       
       const values = [
         customerName,
         customerAddress,
         customerState,
         customerPhone,
         customerGSTIN,
         customerPAN
       ];

       const maxLabelWidth = Math.max(...labels.map(label => doc.getTextWidth(label)));

       const colonOffset = 2; 
       const maxLineWidth = 160; 
       const maxTextWidth = 104; 

       labels.forEach((label, index) => {
         const labelText = label;
         const colonText = ':';
         const valueText = values[index];
       
         // Calculate positions
         const colonX = startX + maxLabelWidth + colonOffset;
         const valueX = colonX + doc.getTextWidth(colonText) + colonOffset;

         const splitValueText = doc.splitTextToSize(valueText, maxTextWidth - valueX);

         doc.text(labelText, startX, startY);
         doc.text(colonText, colonX, startY);

         splitValueText.forEach((line, lineIndex) => {
           doc.text(line, valueX, startY + (lineIndex * lineHeight));
         });

         startY += lineHeight * splitValueText.length;
       });
          
   doc.setFontSize(12);
   doc.setTextColor(170, 51, 106);  
  
   doc.setFont('helvetica', 'bold');
   doc.text('SHIPPED TO', 107, 65);
   doc.setFont('helvetica', 'normal');
   doc.setTextColor(0, 0, 0);
   doc.setFontSize(9);
   const initialX = 110;
   let initialY = 72;
   const lineSpacing = 8;  
   const spacingBetweenLabelAndValue = 3; 
   const maxValueWidth = 65; 
   const labelTexts = [
     'Name',
     'Address',
     'State',
     'Phone',
     'GSTIN',
     'AADHAR'
   ];

   const valuesTexts = [
     customerName,
     customerAddress,
     customerState,
     customerPhone,
     customerGSTIN,
     customerPAN,
   ];

   const maxLabelTextWidth = Math.max(...labelTexts.map(label => doc.getTextWidth(label)));

   const colonWidth = doc.getTextWidth(':');

   labelTexts.forEach((labelText, index) => {
     const valueText = valuesTexts[index];

     const labelWidth = doc.getTextWidth(labelText);
     const colonX = initialX + maxLabelTextWidth + (colonWidth / 2);

     const valueX = colonX + colonWidth + spacingBetweenLabelAndValue;

     const splitValueText = doc.splitTextToSize(valueText, maxValueWidth);

     doc.text(labelText, initialX, initialY);
     doc.text(':', colonX, initialY); 

     splitValueText.forEach((line, lineIndex) => {
       doc.text(line, valueX, initialY + (lineIndex * lineSpacing));
     });

     initialY += lineSpacing * splitValueText.length;
   });

       const rectX = 14;
       const rectY = 58;
       const rectWidth = 182;
       const rectHeight = 75;

       doc.rect(rectX, rectY, rectWidth, rectHeight);

       const centerX = rectX + rectWidth / 2;

       doc.line(centerX, rectY, centerX, rectY + rectHeight);

       const tableBody = cart
         .filter(item => item.quantity > 0)
         .map(item => [
           item.name,
           '36041000',
           item.quantity.toString(),
           `Rs. ${item.saleprice.toFixed(2)}`,
           `Rs. ${(item.saleprice * item.quantity).toFixed(2)}`
         ]);

       tableBody.push(
         [
           { content: 'Total Amount:', colSpan: 4, styles: { halign: 'right', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } },
           { content:  `${Math.round(billingDetails.totalAmount)}.00`, styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } }
         ],
         [
           { content: `Discount (${billingDetails.discountPercentage}%):`, colSpan: 4, styles: { halign: 'right', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } },
           { content: `${Math.round(billingDetails.totalAmount * (parseFloat(billingDetails.discountPercentage) / 100) || 0).toFixed(2)}`, styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } }
         ],
         [
           { content: 'Sub Total:', colSpan: 4, styles: { halign: 'right', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } },
           { content:  `${Math.round(billingDetails.discountedTotal)}.00`, styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } }
         ]
       );
     
       if (taxOption === 'cgst_sgst') {
         tableBody.push(
           [
             { content: 'CGST (9%):', colSpan: 4, styles: { halign: 'right', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } },
             { content:  `${Math.round(billingDetails.cgstAmount)}.00`, styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } }
           ],
           [
             { content: 'SGST (9%):', colSpan: 4, styles: { halign: 'right', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } },
             { content:  `${Math.round(billingDetails.sgstAmount)}.00`, styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } }
           ]
         );
       } else if (taxOption === 'igst') {
         tableBody.push(
           [
             { content: 'IGST (18%):', colSpan: 4, styles: { halign: 'right', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' } },
             {
               content: formatGrandTotal(grandTotal),
               styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' }
             }
           ]
         );
       }
       const grandTotal = billingDetails.grandTotal;
       tableBody.push(
         [
           {
             content: 'Grand Total:',
             colSpan: 4,
             styles: { halign: 'right', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' }
           },
           {
             content: `${Math.round(billingDetails.grandTotal)}.00`,
             styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' }
           }
         ]
       );

       doc.autoTable({
         head: [['Product Name','HSN Code', 'Quantity', 'Rate per price', 'Total']],
         body: tableBody,
         startY: 150,
         theme: 'grid',
         headStyles: { fillColor: [255, 182, 193], textColor: [0, 0, 139], lineWidth: 0.2, lineColor: [0, 0, 0] }, // Reduced lineWidth
         bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.2, lineColor: [0, 0, 0] }, // Reduced lineWidth
         alternateRowStyles: { fillColor: [245, 245, 245] },
       });
       const totalAmount = cart.reduce((total, item) => total + item.quantity * item.saleprice, 0);
const pageSizeWidth = doc.internal.pageSize.getWidth();
const pageSizeHeight = doc.internal.pageSize.getHeight();

const borderMargin = 10;
const borderWidth = 0.2; 
const additionalTopPadding = 30; 
let currentPage = 1;

// Draw page border
const drawPageBorder = () => {
doc.setDrawColor(0, 0, 0); // Border color (black)
doc.setLineWidth(borderWidth);
doc.rect(borderMargin, borderMargin, pageSizeWidth - borderMargin * 2, pageSizeHeight - borderMargin * 2);
};

// Check if content will fit on the current page
const checkPageEnd = (currentY, additionalHeight, resetY = true) => {
if (currentY + additionalHeight > pageSizeHeight - borderMargin) { // Ensure it fits within the page
 doc.addPage();
 drawPageBorder();
 currentPage++; // Increment the page number
 // Apply additional top padding on the new page if it's the second page or later
 return resetY ? (currentPage === 2 ? borderMargin + additionalTopPadding : borderMargin) : currentY; // Apply margin for new page or keep currentY
}
return currentY;
};

// Initialize the y position after auto table
let y = doc.autoTable.previous.finalY + borderMargin; // Start Y position after the auto table

// Grand total in words
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
const grandTotalInWords = numberToWords(billingDetails.grandTotal); 
const backgroundColor = [255, 182, 193]; // RGB for light pink
const textColor = [0, 0, 139]; // RGB for dark blue
const marginLeft = borderMargin + 7; // Adjusted to be within margins
const padding = 5;
const backgroundWidth = 186; // Fixed width for the background rectangle
const text = `Rupees: ${grandTotalInWords}`;
const textDimensions = doc.getTextDimensions(text);
const textWidth = textDimensions.w;
const textHeight = textDimensions.h;

const backgroundX = marginLeft - padding;
const backgroundY = y - textHeight - padding;
const backgroundHeight = textHeight + padding * 2; // Height including padding

// Check if there’s enough space for the content; if not, create a new page
y = checkPageEnd(y, backgroundHeight);

doc.setTextColor(...textColor);

// Add text on top of the background
doc.text(text, marginLeft, y);

// Continue with "Terms & Conditions" and other content
const rectFX = borderMargin + 4; // Adjusted to be within margins
const rectFWidth = pageSizeWidth - 2 * rectFX; // Adjust width to fit within page
const rectPadding = 4; // Padding inside the rectangle
// const lineHeight = 8; // Line height for text
const rectFHeight = 6 + lineHeight * 2 + rectPadding * 2; // Header height + 2 lines of text + padding

// Ensure there's enough space for the rectangle and text
y = checkPageEnd(y + backgroundHeight + 8, rectFHeight);

doc.setFont('helvetica', 'normal');
doc.rect(rectFX, y, rectFWidth, rectFHeight);

// Drawing the "Terms & Conditions" text inside the rectangle
doc.setFont('helvetica', 'bold');
doc.setTextColor(0, 0, 0);
doc.setFontSize(10);

let textY = y + rectPadding + 6; // Adjust as needed for vertical alignment
doc.text('Terms & Conditions', rectFX + rectPadding, textY);

// Adjust vertical position for the following text
textY = checkPageEnd(textY + lineHeight, lineHeight, false);
doc.setFont('helvetica', 'normal');
doc.text('1. Goods once sold will not be taken back.', rectFX + rectPadding, textY);

textY = checkPageEnd(textY + lineHeight, lineHeight, false);
doc.text('2. All matters Subject to "Sivakasi" jurisdiction only.', rectFX + rectPadding, textY);

// Add "Authorised Signature" inside the rectangle at the bottom right corner
const authSigX = rectFX + rectFWidth - rectPadding - doc.getTextWidth('Authorised Signature');
const authSigY = y + rectFHeight - rectPadding;
doc.setFont('helvetica', 'bold');
doc.text('Authorised Signature', authSigX, authSigY);

// Continue with additional content
y = checkPageEnd(y + rectFHeight + 8, 40, false);

// Reset font and color for additional text
doc.setFontSize(12);
doc.setTextColor(170, 51, 106);

// More content with additional checks
y = checkPageEnd(y + 45, 10, false);
doc.setFontSize(9);
doc.setTextColor(0, 0, 0);

y = checkPageEnd(y + 5, 20, false);
doc.setFont('helvetica', 'bold');

y = checkPageEnd(y + 7, 23, false);
doc.setFont('helvetica', 'normal');
doc.setTextColor(0, 0, 0);
doc.setFontSize(10);

// Draw the page border at the end
drawPageBorder();


  doc.save(`invoice_${invoiceNumber}_CUSTOMERCOPY.pdf`);
};



const handleSearch = (event) => {
const term = event.target.value.toLowerCase();
setSearchTerm(term);

setFilteredProducts(
products.filter(product => {
const productName = product.name ? product.name.toLowerCase() : '';
const productCode = product.sno !== undefined && product.sno !== null
  ? product.sno.toString().toLowerCase()
  : '';
return productName.includes(term) || productCode.includes(term);
})
);
};
  // const addToCart = (product) => {
  //   const existingItem = cart.find(item => item.productId === product.id);
  //   if (existingItem) {
  //     const updatedCart = cart.map(item =>
  //       item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
  //     );
  //     setCart(updatedCart);
  //     updateBillingDetails(updatedCart);
  //   } else {
  //     const newItem = {
  //       productId: product.id,
  //       name: product.name,
  //       saleprice: product.saleprice,
  //       quantity: 1,
  //     };
  //     const updatedCart = [...cart, newItem];
  //     setCart(updatedCart);
  //     updateBillingDetails(updatedCart);
  //   }
  // };
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    let price = product.saleprice;
  
    // Check if this is the specific product that requires manual price entry
    if (product.name === 'Assorted Crackers') {
      price = prompt(`Enter price for ${product.name}:`);
      if (!price) {
        alert("Price is required.");
        return;
      }
      price = parseFloat(price); // Convert the input to a float number
    }
  
    if (existingItem) {
      const updatedCart = cart.map(item =>
        item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      setCart(updatedCart);
      updateBillingDetails(updatedCart);
    } else {
      const newItem = {
        productId: product.id,
        name: product.name,
        saleprice: price,
        quantity: 1,
      };
      const updatedCart = [...cart, newItem];
      setCart(updatedCart);
      updateBillingDetails(updatedCart);
    }
  };
  

  const handleRemoveFromCart = (productId) => {
    const updatedCart = cart.filter(item => item.productId !== productId);
    setCart(updatedCart);
    updateBillingDetails(updatedCart);
  };

  const handleDateChange = (event) => {
    const selectedDate = new Date(event.target.value);
    setCurrentDate(selectedDate);
  };

  return (
    <div className="billing-calculator">
      <div className="product-list">
        <input
          type="text"
          placeholder="Search Products"
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
            <select className="custom-select" value={category} onChange={handleCategoryChange}>
        <option value="">All Products</option>
        <option value="ONE & TWO SOUND CRACKERS">ONE & TWO SOUND CRACKERS</option>
        <option value="GROUND CHAKKAR">GROUND CHAKKAR</option>
        <option value="FLOWER POTS">FLOWER POTS</option>
        <option value="BOMB">BOMB</option>
        <option value="TWINKLING STAR">TWINKLING STAR</option>
        <option value="MAGIC PENCIL">MAGIC PENCIL</option>
        <option value="ROCKETS">ROCKETS</option>
        <option value="FOUNTAIN">FOUNTAIN</option>
        <option value="MATCH BOX">MATCH BOX</option>
        <option value="KIDS FANCY">KIDS FANCY</option>
        <option value="DELUXE CRACKERS">DELUXE CRACKERS</option>
        <option value="MULTI COLOUR SHOTS">MULTI COLOUR SHOTS</option>
        <option value="SPARKLES">SPARKLES</option>
        <option value="BIJILI CRACKERS">BIJILI CRACKERS</option>
        <option value="2 COMET">2" COMET</option>
        <option value="2 COMET - 3 PCS">2" COMET - 3 PCS</option>
        <option value="4 COMET - 2 PCS">4" COMET - 2 PCS</option>
        <option value="31/2 COMETS">31/2" COMETS</option>
        <option value="CHOTTA FANCY">CHOTTA FANCY</option>
        <option value="RIDER">RIDER</option>
        <option value="DIGITAL LAR (WALA)">DIGITAL LAR (WALA)</option>
        <option value="PEPPER BOMB">PEPPER BOMB</option>
        <option value="GIFT BOX VARIETIES">GIFT BOX VARIETIES</option>
      </select>
        <ul>
          {filteredProducts.map(product => (
            <li key={product.id}>
              <div className="product-details">
                <span>{product.name}</span>
                
                <span> {`(Sales Rs. ${product.saleprice ? product.saleprice.toFixed(2) : '0.00'})`}</span>
              </div>
              <button onClick={() => addToCart(product)}>Add to Cart</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="cart">
        <h2>Cart</h2>
        <button className="remove-button" style={{display:"flex",position:"relative",left:"540px",bottom:"34px"}} onClick={() => ClearAllData()}>Clear cart</button>
        <ul>
          {cart.map(item => (
            <li key={item.productId}>
              <div className="cart-item">
                <span>{item.name}</span>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                />
                <span>Rs. {item.saleprice ? (item.saleprice * item.quantity).toFixed(2) : '0.00'}</span>
                <button className="remove-button" onClick={() => handleRemoveFromCart(item.productId)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
        
        <div className="billing-summary">
          <div className="billing-details">
          <label>Invoice Number</label>
          <input
            type="text"
            placeholder="Enter Invoice Number"
            value={manualInvoiceNumber}
            onChange={(e) => setManualInvoiceNumber(e.target.value)}
            required
           />
            <label>Discount (%)</label>
            <input
              type="number"
              value={billingDetails.discountPercentage}
              onChange={handleDiscountChange}
              min="0"
              max="100"
            />
            <label>Date</label>
            <input
              type="date"
              className="custom-datepicker"
              value={currentDate.toISOString().substr(0, 10)} 
              onChange={handleDateChange}
            />
            <br />
            <br />
            <label>Tax Option</label>
          <select value={taxOption} onChange={(e) => setTaxOption(e.target.value)}>
            <option value="cgst_sgst">CGST + SGST</option>
            <option value="igst">IGST</option>            
            <option value="no_tax">No Tax</option>
          </select>
          </div>
          <div className="billing-amounts">
          <table>
            <tbody>
              <tr>
                <td>Total Amount:</td>
                <td>Rs. {billingDetails.totalAmount.toFixed(2)}</td>
              </tr>
              <tr>
                <td>Discounted Total:</td>
                <td>Rs. {billingDetails.discountedTotal.toFixed(2)}</td>
              </tr>
              {taxOption === 'cgst_sgst' && (
                <>
                  <tr>
                    <td>CGST (9%):</td>
                    <td>Rs. {billingDetails.cgstAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>SGST (9%):</td>
                    <td>Rs. {billingDetails.sgstAmount.toFixed(2)}</td>
                  </tr>
                </>
              )}
              {taxOption === 'igst' && (
                <tr>
                  <td>IGST (18%):</td>
                  <td>Rs. {billingDetails.igstAmount.toFixed(2)}</td>
                </tr>
              )}
              <tr className="grand-total-row">
                <td>Grand Total:</td>
                <td>Rs. {billingDetails.grandTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
        <div className="customer-details-toggle">
          <button onClick={() => setShowCustomerDetails(!showCustomerDetails)}>
            {showCustomerDetails ? 'Hide Customer Details' : 'Show Customer Details'}
          </button>
        </div>
        {showCustomerDetails && (
          <div className="customer-details">
            <div>
              <label>Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <label>Customer Address</label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
              />
            </div>
            <div>
              <label>Customer State</label>
              <input
                type="text"
                value={customerState}
                onChange={(e) => setCustomerState(e.target.value)}
              />
            </div>
            <div>
              <label>Customer Phone</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <div>
              <label>Customer GSTIN</label>
              <input
                type="text"
                value={customerGSTIN}
                onChange={(e) => setCustomerGSTIN(e.target.value)}
              />
            </div>
            <div>
              <label>{`Customer AAHDR(OPTIONAL)`}</label>
              <input
                type="text"
                value={customerPAN}
                onChange={(e) => setCustomerPAN(e.target.value)}
              />
            </div>
            <div>
              <label>Customer Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
             </div>
          </div>
        )}
         <button onClick={() => addToCart({ id: 1, name: 'Assorted Crackers', saleprice: null })}>
  Assorted crackers
</button><br></br>
       <button onClick={handleGenerateAllCopies}>Download All Copies</button><br></br>
       <button style={{display:"none"}} onClick={() => transportCopy(invoiceNumber)}>Transport Copy</button>
       <button style={{display:"none"}} onClick={() => salesCopy(invoiceNumber)}>Sales Copy</button>
       <button style={{display:"none"}} onClick={() => OfficeCopy(invoiceNumber)}>Office Copy</button>
        <button  onClick={() => CustomerCopy(invoiceNumber)}>Customer Copy</button>
      </div>
    </div>
  );
};

export default BillingCalculator;
