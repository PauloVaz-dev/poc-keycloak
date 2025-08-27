import 'dotenv/config'
import express from 'express'
import axios from 'axios'
import qs from 'qs'

const app = express()

const tokenEndpoint = `${process.env.KEYCLOAK_BASE_URL}${process.env.TOKEN_URL}`
const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET

console.log(tokenEndpoint);

// Cache simples em memória para o access_token
let cachedToken = null
let tokenExpiresAt = 0

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000)
  if (cachedToken && now < tokenExpiresAt - 10) {
    return cachedToken
  }

  const body = qs.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  })

  const { data } = await axios.post(tokenEndpoint, body, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 10000,
  })

  cachedToken = data.access_token
  tokenExpiresAt = now + (data.expires_in || 300)

  return cachedToken
}

// Endpoint que demonstra a chamada ao Serviço B
app.get('/call', async (req, res) => {
  try {
    const token = await getAccessToken()
    const { data } = await axios.get(process.env.SERVICE_B_URL, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000,
    })
    res.json({ ok: true, fromServiceB: data })
  } catch (err) {
    console.error(err.response?.data || err.message)
    res.status(500).json({ ok: false, error: err.response?.data || err.message })
  }
})

app.listen(3002, () => {
  console.log('Serviço A rodando em :3000')
})
