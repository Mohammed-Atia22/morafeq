import { useState } from 'react'
import Input from '../components/Input'
import Button from '../components/Button'
import { register } from '../services/authService'

function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    await register(form)
  }

  return (
    <section className="page page--auth">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="form">
        <Input label="Name" name="name" value={form.name} onChange={handleChange} placeholder="Enter your name" />
        <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter your email" />
        <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Enter your password" />
        <Button type="submit">Register</Button>
      </form>
    </section>
  )
}

export default Register
