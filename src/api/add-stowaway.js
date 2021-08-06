const jwt = require("express-jwt")
const jwks = require("jwks-rsa")
const faunadb = require("faunadb")

const q = faunadb.query

const client = new faunadb.Client({ secret: process.env.FAUNA_KEY })

const jwtCheck = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.GATSBY_AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: process.env.GATSBY_AUTH0_AUDIENCE,
  issuer: `https://${process.env.GATSBY_AUTH0_DOMAIN}/`,
  algorithms: ["RS256"],
})

const checkJwtMiddleware = async (req, res) => {
  await new Promise((resolve, reject) => {
    jwtCheck(req, res, (result) => {
      if (result instanceof Error) {
        reject(result)
      }
      resolve(result)
    })
  })
}

export default async function handler(req, res) {
  const { user, date } = req.body

  try {
    await checkJwtMiddleware(req, res)

    await client.query(
      q.Create(q.Collection(`stowaways_${process.env.NODE_ENV}`), {
        data: { user: user, date: date },
      })
    )

    setTimeout(() => {
      res.status(200).json({ message: "User added ok!" })
    }, 500)
  } catch (error) {
    res.status(500).json({
      message: error.message,
    })
  }
}