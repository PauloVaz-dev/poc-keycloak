import 'dotenv/config'
import express from 'express'
import * as jose from 'jose'

const app = express()

const issuer = `${process.env.KEYCLOAK_BASE_URL}/realms/${process.env.KEYCLOAK_REALM}`
const jwksUri = `${issuer}/protocol/openid-connect/certs`
const expectedAudience = process.env.EXPECTED_AUDIENCE

// Baixa/usa o JWKS do Keycloak (com cache interno do jose)
const jwks = jose.createRemoteJWKSet(new URL(jwksUri))

async function verifyAccessToken(token) {
  // Valida assinatura e alguns claims
  return await jose.jwtVerify(token, jwks, {
    issuer,
    // Se ainda não tiver audience configurada, você pode comentar a linha abaixo:
    audience: expectedAudience,
  })
}

function bearerToken(req) {
  const h = req.headers.authorization || ''
  const [, token] = h.split(' ')
  return token
}

app.get('/api/data', async (req, res) => {
  try {
    const token = bearerToken(req)
    if (!token) return res.status(401).json({ error: 'missing bearer token' })

    const { payload } = await verifyAccessToken(token)

    // Exemplo de payload em client_credentials: "sub" = clientId, sem usuário
    res.json({
      ok: true,
      message: 'Recurso protegido do Serviço B',
      token_sub: payload.sub,
      token_aud: payload.aud,
      token_iss: payload.iss,
    })
  } catch (err) {
    console.error(err)
    return res.status(401).json({ error: 'invalid token' })
  }
})

app.listen(process.env.PORT || 4000, () => {
  console.log(`Serviço B rodando em :${process.env.PORT || 4000}`)
})
