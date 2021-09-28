const expressJwt = require('express-jwt');

function authJwt() {
    const secret = 'nanb-ecommer-app-secret-jwt-key'//process.env.secret;
    const api = '/api/v1';
    return expressJwt({
        secret,
        /* algorithms value from from jwt.io website */
        algorithms: ['HS256'],
        isRevoked: isRevoked,
    }).unless({
        path: [
            // {
            //     /*regex express for all api urls paths */
            //     url: /(.*)/,
            // },
            `${api}/users/login`,
            `${api}/users/register`,
            {
                /*regex express for all api urls for product related paths */
                url: /\/api\/v1\/product(.*)/,
                methods: ['GET', 'OPTIONS']
            },
            {
                /*regex express for all api urls for category related paths */
                url: /\/api\/v1\/categories(.*)/,
                methods: ['GET', 'OPTIONS']
            },
            {
                /*regex express for all api urls for category related paths */
                url: /\/public\/uploads\/(.*)/,
                methods: ['GET', 'OPTIONS']
            }
        ]
    })
}

/* performs some check on isAdmin property in JWT 
 review udemy lecture #51 */
async function isRevoked(req, payload, done) {
    if (!payload.isAdmin) {
        done(null, true);
    }
    done();
}

module.exports = authJwt;