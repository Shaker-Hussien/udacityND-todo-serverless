// TODO: Once your application is deployed, copy an API id here so that the frontend could interact with it
const apiId = '6mjsa064ja'
export const apiEndpoint = `https://${apiId}.execute-api.us-east-1.amazonaws.com/dev`

export const authConfig = {
  //Create an Auth0 application and copy values from it into this map
  domain: 'dev-shaker.auth0.com', // Auth0 domain
  clientId: 'pjsj5YuwFFAZipFaF3QjvkOUMnawN0zX', // Auth0 client id
  callbackUrl: 'http://localhost:3000/callback'
}
