function Button({ children, type = 'button', onClick }) {
  return (
    <button type={type} className="button" onClick={onClick}>
      {children}
    </button>
  )
}

export default Button
