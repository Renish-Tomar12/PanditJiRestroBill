import React, { useState } from "react";
import ExcelJS from "exceljs";
import saveAs from "file-saver";
import "./RestaurentBill.css";

const BillGenerate = () => {
  const restaurant = {
    name: "Pandit Ji Food Junction",
    address: "Bhalswa Village First Indian & Chinese Restaurant",
    phone: "+91-8368813290",
    email: "@panditji_food_junction",
    gst: "GSTIN: 27ABCDE1234F1Z5",
  };

  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    price: "",
    plateType: "Full",
  });
  const [gstRate, setGstRate] = useState(18);

  // Get current date and day
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const dayOfWeek = today.toLocaleDateString("en-IN", { weekday: "long" });

  const handleAddItem = () => {
    const { name, quantity, price, plateType } = newItem;
    if (!name || !quantity || !price) {
      alert("Please fillout the all fields");
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

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Restaurant Bill");

    // Title Row (merged)
    sheet.mergeCells("A1:D1");
    const titleRow = sheet.getCell("A1");
    titleRow.value = "Restaurant Bill";
    titleRow.font = { size: 16, bold: true };
    titleRow.alignment = { vertical: "middle", horizontal: "center" };

    sheet.addRow([]); // Empty row

    // Basic Info
    const info = [
      ["Date", formattedDate],
      ["Day", dayOfWeek],
      ["Restaurant Name", restaurant.name],
      ["Address", restaurant.address],
      ["Phone", restaurant.phone],
      ["Email", restaurant.email],
      ["GST No.", restaurant.gst],
    ];

    info.forEach(([label, value]) => {
      const row = sheet.addRow([label, value]);
      row.font = { bold: true };
    });

    sheet.addRow([]); // Empty row before items table

    // Table Headers
    const headerRow = sheet.addRow([
      "Item",
      "Quantity",
      "Price (INR)",
      "Total",
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF007BFF" }, // Blue background
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { horizontal: "center" };
    });

    // Table Data
    items.forEach((item) => {
      const row = sheet.addRow([
        item.name,
        item.quantity,
        item.price,
        item.quantity * item.price,
      ]);
      row.getCell(3).numFmt = '"₹"#,##0.00';
      row.getCell(4).numFmt = '"₹"#,##0.00';
    });

    sheet.addRow([]); // Empty row

    // Summary (Subtotal, GST, Total)
    const summaryData = [
      ["", "", "Subtotal", subtotal],
      ["", "", `GST (${gstRate}%)`, gstAmount],
      ["", "", "Total Amount", totalAmount],
    ];

    summaryData.forEach(([a, b, label, value]) => {
      const row = sheet.addRow([a, b, label, value]);
      row.getCell(4).numFmt = '"₹"#,##0.00';
      row.getCell(3).font = { bold: true };
      row.getCell(4).font = { bold: true };
    });

    // Auto column widths
    sheet.columns.forEach((col) => {
      let maxLen = 0;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        const len = cell.value ? cell.value.toString().length : 10;
        maxLen = Math.max(maxLen, len);
      });
      col.width = maxLen + 2;
    });

    // Generate and save the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "Restaurant_Bill.xlsx");
  };

  return (
    <div className="bill-container">
      <div className="bill">
        <h1>{restaurant.name}</h1>
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
          <strong>Date:</strong> {formattedDate} | <strong>Day:</strong>{" "}
          {dayOfWeek}
        </p>
        <hr />

        {/* Input Section */}
        <div className="input-section">
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
          <button onClick={handleAddItem}>Add Item</button>
        </div>

        {/* GST Input */}
        <div className="gst-section">
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>₹{item.price}</td>
                <td>₹{item.quantity * item.price}</td>
                <td>
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

        <button onClick={exportToExcel}>Export to Excel</button>
      </div>
    </div>
  );
};

export default BillGenerate;
