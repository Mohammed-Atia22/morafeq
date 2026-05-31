export async function login({ email, password }) {
  console.log('Login payload:', { email, password })
  return new Promise((resolve) => setTimeout(resolve, 500))
}

export async function register({ name, email, password }) {
  console.log('Register payload:', { name, email, password })
  return new Promise((resolve) => setTimeout(resolve, 500))
}
