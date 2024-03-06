const swaggerAutogen = require('swagger-autogen')({openapi: '3.0.0'});

const doc = {
    info: {
        title: 'Backend Make Anything',
        description: 'This is the backend of the website "MakeAnything" that regroups 3D models designed for 3D printing'
    },
    // host: ['localhost:5000', 'https://careful-hare-sweatpants.cyclic.app/']
    servers: [
        {
            url: "http://localhost:5000/",
            description: "local server"
        },
        {
            url: "https://careful-hare-sweatpants.cyclic.app/",
            description: "deployed server"
        }
    ]
}

const outputFile = './swagger-output.json'
const routes = ['./app.js', './appUser.js', './appModel.js'];

swaggerAutogen(outputFile, routes, doc);