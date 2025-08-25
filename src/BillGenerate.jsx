import React, { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./RestaurentBill.css";
import autoTable from "jspdf-autotable";

const BillGenerate = () => {
  const restaurant = {
    name: "Pandit Ji Food Junction",
    address: "Bhalswa Village First Indian & Chinese Restaurant",
    phone: "+91-8368813290",
    email: "@panditji_food_junction",
    gst: "GSTIN:  07DKNPP1452H1ZX",
    fssai: "FSSAI NO.: 23325008001669",
  };

  const [client, setClient] = useState({
    name: "",
    address: "",
    phone: "",
  });

  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    price: "",
    plateType: "",
  });
  const [gstRate, setGstRate] = useState(18);

  // Date
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const dayOfWeek = today.toLocaleDateString("en-IN", { weekday: "long" });

  // Validate client phone number (exact 10 digits)
  const handleClientPhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setClient({ ...client, phone: value });
    }
  };

  const handleAddItem = () => {
    const { name, quantity, price, plateType } = newItem;
    if (!name || !quantity || !price) {
      alert("Please fill out all fields");
      return;
    }
    const displayName = `${name} (${plateType})`;
    setItems([
      ...items,
      { name: displayName, quantity: +quantity, price: +price },
    ]);
    setNewItem({ name: "", quantity: "", price: "", plateType: "Full" });
  };

  const subtotal = items.reduce(
    (total, item) => total + item.quantity * item.price,
    0
  );
  const gstAmount = (subtotal * gstRate) / 100;
  const totalAmount = subtotal + gstAmount;

  // ✅ Print function
  const handlePrint = () => {
    window.print();
  };

  // ✅ Download as PDF
  const handleDownload = () => {
    const billElement = document.querySelector(".bill");

    // Clone the bill so inputs remain editable in UI
    const clonedBill = billElement.cloneNode(true);

    // IMPORTANT: only modify clonedBill, never billElement
    // --- Collect Client Details ---
    const clientInputs = billElement.querySelectorAll(".client-section input"); // from ORIGINAL
    const clientLabels = ["Client Name", "Address", "Phone"];
    const clientDetails = [];

    clientInputs.forEach((input, i) => {
      clientDetails.push({
        label: clientLabels[i] || `Field ${i + 1}`,
        value: input.value.trim() || "N/A",
      });
    });

    // --- Replace in CLONED version ---
    const clonedClientSection = clonedBill.querySelector(".client-section");
    if (clonedClientSection) {
      const detailsWrapper = document.createElement("div");

      // Heading
      const heading = document.createElement("h3");
      heading.innerText = "Client Details";
      heading.style.marginBottom = "8px";
      heading.style.fontSize = "16px";
      heading.style.fontWeight = "bold";
      detailsWrapper.appendChild(heading);

      clientDetails.forEach((detail) => {
        const p = document.createElement("p");
        p.style.margin = "2px 0";
        p.style.fontSize = "14px";
        p.innerHTML = `<strong>${detail.label}:</strong> ${detail.value}`;
        detailsWrapper.appendChild(p);
      });

      clonedClientSection.replaceWith(detailsWrapper);
    }

    // --- GST (only cloned version changed) ---
    const gstOriginal = billElement.querySelector(".gst-section input");
    const gstCloned = clonedBill.querySelector(".gst-section input");
    if (gstCloned && gstOriginal) {
      const value = gstOriginal.value.trim() || "0";
      const text = document.createElement("span");
      text.innerText = `GST: ${value}%`;
      gstCloned.replaceWith(text);
    }

    // --- Remove add/delete from cloned only ---
    clonedBill
      .querySelectorAll(".delete-col, .delete-btn, .add-btn, .no-print")
      .forEach((el) => el.remove());

    // Position cloned bill offscreen
    clonedBill.style.position = "absolute";
    clonedBill.style.left = "-9999px";
    document.body.appendChild(clonedBill);

    // Convert cleaned version to image
    html2canvas(clonedBill, { scale: 2, useCORS: true }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF("p", "mm", [imgWidth, imgHeight]);

      // 🔒 Image only (no selectable text)
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      pdf.save(`Bill_${formattedDate}.pdf`);

      if (document.body.contains(clonedBill)) {
        document.body.removeChild(clonedBill);
      }
    });
  };

  return (
    <div className="bill-container">
      <div className="bill">
        <h1
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <img
            src={`${process.env.PUBLIC_URL}/LogoRestro.png`}
            alt=""
            style={{ height: "50px", width: "50px", objectFit: "contain" }}
          />
          {restaurant.name}
        </h1>

        <h4>{restaurant.address}</h4>
        <p>
          <a
            href={`tel:${restaurant.phone}`}
            style={{ textDecoration: "none", color: "#007bff" }}
          >
            {restaurant.phone}
          </a>{" "}
          | {restaurant.email}
        </p>
        <p>
          <strong>{restaurant.gst}</strong>
        </p>
        <p>
          <strong>{restaurant.fssai}</strong>
        </p>
        <p>
          <strong>Date:</strong> {formattedDate} | <strong>Day:</strong>{" "}
          {dayOfWeek}
        </p>
        <hr />

        {/* Client Section */}
        <div className="client-section">
          <h3>Client Details</h3>

          {/* Input fields for screen (hidden in print) */}
          <div className="no-print">
            <input
              type="text"
              placeholder="Client Name"
              value={client.name}
              onChange={(e) => setClient({ ...client, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Client Address"
              value={client.address}
              onChange={(e) =>
                setClient({ ...client, address: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Client Phone No."
              value={client.phone}
              onChange={handleClientPhoneChange}
              maxLength="10"
            />
          </div>

          {/* Read-only labels for print */}
          <div className="print-only">
            <p>
              <strong>Name:</strong> {client.name || "N/A"}
            </p>
            <p>
              <strong>Address:</strong> {client.address || "N/A"}
            </p>
            <p>
              <strong>Phone:</strong> {client.phone || "N/A"}
            </p>
          </div>
        </div>

        <hr />

        {/* Input Section */}
        <div className="input-section no-print">
          <input
            type="text"
            placeholder="Item Name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
          />
          <select
            value={newItem.plateType}
            onChange={(e) =>
              setNewItem({ ...newItem, plateType: e.target.value })
            }
          >
            <option value="">Select</option>
            <option value="Full">Full</option>
            <option value="Half">Half</option>
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
          </select>
          <input
            type="number"
            placeholder="Quantity"
            value={newItem.quantity}
            onChange={(e) =>
              setNewItem({ ...newItem, quantity: e.target.value })
            }
          />
          <input
            type="number"
            placeholder="Price"
            value={newItem.price}
            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
          />
          <button onClick={handleAddItem}>➕ Add Item</button>
        </div>

        {/* GST Input */}
        <div className="gst-section no-print">
          <label>
            GST (%):&nbsp;
            <input
              type="number"
              value={gstRate}
              onChange={(e) => setGstRate(Number(e.target.value))}
              min="0"
              max="100"
              step="0.1"
            />
          </label>
        </div>

        {/* Items Table */}
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
              <th className="no-print">Delete</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>₹{item.price}</td>
                <td>₹{item.quantity * item.price}</td>
                <td className="no-print">
                  <button
                    className="delete-btn"
                    onClick={() => {
                      const updatedItems = [...items];
                      updatedItems.splice(idx, 1);
                      setItems(updatedItems);
                    }}
                    title="Delete item"
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr />
        <div className="total-section">
          <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
          <p>
            GST ({gstRate}%): ₹{gstAmount.toFixed(2)}
          </p>
          <strong>Total Amount: ₹{totalAmount.toFixed(2)}</strong>
        </div>

        {/* Print Button and Downlaod Button*/}
        <div className="actions no-print">
          <button onClick={handlePrint}>🖨️ Print Bill</button>
          <button onClick={handleDownload}>📥 Download Bill</button>
        </div>
      </div>
    </div>
  );
};

export default BillGenerate;
