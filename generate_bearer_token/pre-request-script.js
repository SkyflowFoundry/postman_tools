// Clear all global variables
pm.globals.clear();

let credentials = 
    // TODO: Overwrite the line below (including curly braces) with the contents of the service account credentials.json 
    {"clientID":"<>","clientName":"<>","tokenURI":"<>","keyID":"<>","privateKey":"-----BEGIN PRIVATE KEY-----<>-----END PRIVATE KEY-----\n"}
;

// Set the credentials as a global variable
pm.globals.set('credentials_json', JSON.stringify(credentials));

console.log("=======SIGNING JWT TOKEN=======");

// Fetch the JWT signing library
pm.sendRequest({
    url: "https://raw.githubusercontent.com/SkyflowFoundry/postman_tools/main/generate_bearer_token/jsrsasign-all-min.js",
    method: 'GET'
}, function (err, res) {
    var navigator = {};
    var window = {};
    eval(res.text());

    let obj = JSON.parse(pm.globals.get('credentials_json'));

    // Set each credential as a global variable
    for (let key in obj) {
        pm.globals.set(key, obj[key]);
    }

    // Set headers for JWT
    const header = { "alg": "RS256", "typ": "JWT" };

    let claimSet = {
        'iss': pm.globals.get('clientID'),
        'key': pm.globals.get('keyID'),
        'aud': pm.globals.get('tokenURI'),
        'exp': Math.floor(Date.now() / 1000) + 3600,
        'sub': pm.globals.get('clientID')
    }

    let signedToken = KJUR.jws.JWS.sign(null, header, claimSet, pm.globals.get('privateKey'));
    pm.globals.set('jwt_signed', signedToken);
    console.log('SIGNED JWT TOKEN: ' + signedToken);

    console.log("=======GENERATING BEARER TOKEN=======");

    // Request the bearer token
    pm.sendRequest({
        url: pm.globals.get('tokenURI'),
        method: 'POST',
        header: {
            'Content-Type': 'application/json'
        },
        body: {
            mode: 'raw',
            raw: JSON.stringify({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion: pm.globals.get('jwt_signed')
            })
        }
    }, function (err, res) {
        let accessToken = res.json().accessToken;
        console.log("BEARER TOKEN: " + accessToken);
        pm.globals.set('accessToken', accessToken);
    });
});