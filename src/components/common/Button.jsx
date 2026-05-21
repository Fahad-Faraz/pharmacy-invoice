// components/common/Button.jsx
export default function Button({ children, ...props }) {
  return (
    <button className="bg-blue-500 text-white px-4 py-2" {...props}>
      {children}
    </button>
  );
}