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

    const submit = async () => {
      try {
        await API.post("/products", form);
        toast.success("Added");
      } catch (e) {
        toast.error(e.response?.data?.message);
      }
    };

    return (
      <div className="p-4">
        <input placeholder="Name" onChange={(e)=>setForm({...form,name:e.target.value})}/>
        <input placeholder="MRP" onChange={(e)=>setForm({...form,mrp:e.target.value})}/>
        <input placeholder="Purchase Price" onChange={(e)=>setForm({...form,purchase_price:e.target.value})}/>
        <input placeholder="Stock" onChange={(e)=>setForm({...form,quantity:e.target.value})}/>
        <button onClick={submit}>Add</button>
      </div>
    );
  }