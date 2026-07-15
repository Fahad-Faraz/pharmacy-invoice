  // features/product/AddProduct.jsx
  import { useState } from "react";
  import API from "../../api/axios";
  import toast from "react-hot-toast";

  export default function AddProduct() {
    const [form, setForm] = useState({
      name: "",
      mrp: "",
      purchase_price: "",
      quantity: "",
    });
    const [csvFile, setCsvFile] = useState(null);

    const submit = async () => {
      try {
        await API.post("/products", form);
        toast.success("Added");
      } catch (e) {
        toast.error(e.response?.data?.message);
      }
    };
    const importCSV = async () => {
  try {
    if (!csvFile) {
      return toast.error("CSV file select karo");
    }

    const formData = new FormData();
    formData.append("file", csvFile);

    const { data } = await API.post(
      "/import/products",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    toast.success(
      `${data.imported} products imported`
    );

    if (data.failed > 0) {
      console.log(data.errors);
    }
  } catch (err) {
    toast.error(
      err.response?.data?.message ||
        "Import failed"
    );
  }
};

    return (
      <div className="p-4">
        <input placeholder="Name" onChange={(e)=>setForm({...form,name:e.target.value})}/>
        <input placeholder="MRP" onChange={(e)=>setForm({...form,mrp:e.target.value})}/>
        <input placeholder="Purchase Price" onChange={(e)=>setForm({...form,purchase_price:e.target.value})}/>
        <input placeholder="Stock" onChange={(e)=>setForm({...form,quantity:e.target.value})}/>
        <button onClick={submit}>Add</button>
        <div className="mt-4">
  <input
    type="file"
    accept=".csv"
    onChange={(e) =>
      setCsvFile(e.target.files[0])
    }
  />

  <button
    onClick={importCSV}
    className="ml-2"
  >
    Import CSV
  </button>
</div>
      </div>
    );
  }