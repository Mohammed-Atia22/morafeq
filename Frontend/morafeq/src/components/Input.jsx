function Input({ label, type = "text", name, value, onChange, placeholder }) {
  return (
    <label className="input__group">
      <span>{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input__field"
      />
    </label>
  );
}

export default Input;
