import { useState } from 'react'
import Input from '../components/Input'
import Button from '../components/Button'
import { login } from '../services/authService'

function Login() {
  const [form, setForm] = useState({ email: '', password: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await login(form)
  }

  return (
    <section className="page page--auth">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="form">
        <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email" />
        <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Enter your password" />
        <Button type="submit">Login</Button>
      </form>
    </section>
  )
}

export default Login
