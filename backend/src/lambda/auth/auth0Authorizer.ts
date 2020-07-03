import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-shaker.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', {
    authorizationToken: event.authorizationToken
  })

  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', { Token: jwtToken })

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // Implement token verification
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  const cert = await getCert(jwksUrl, jwt.header.kid)
  logger.info('certificarion retrived', { Cert: cert })

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}

async function getCert(jwksUrl: string, kid: string) {
  try {
    //Retrieving the JWK
    const { data } = await Axios.get(jwksUrl)
    logger.info('getCert', { 'Retrived Keys': data.keys })

    //filter out all the keys that are not intended for verifying a JWT.
    const signingKeys = data.keys
      .filter(
        (key) =>
          key.use === 'sig' && // JWK property `use` determines the JWK is for signature verification
          key.kty === 'RSA' && // We are only supporting RSA (RS256)
          key.kid && // The `kid` must be present to be useful for later
          ((key.x5c && key.x5c.length) || (key.n && key.e)) // Has useful public keys
      )
      .map((key) => {
        return { kid: key.kid, publicKey: certToPEM(key.x5c[0]) }
      })

    //get the signing key
    const signingKey = signingKeys.find((key) => key.kid === kid)
    logger.info('getCert', { signingKey: signingKey })

    return signingKey.publicKey
  } catch (e) {
    throw new Error(`Error in Signing Key.\nError:${e.message}`)
  }
}

function certToPEM(cert) {
  let pem = cert.match(/.{1,64}/g).join('\n')
  pem = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----\n`
  return pem
}
