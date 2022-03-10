var http = require('http');
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
require("dotenv-safe").config()
const { pool } = require('./config')


const jwt = require('jsonwebtoken')
const req = require('express/lib/request')
const { user, rows } = require('pg/lib/defaults')

const httpProxy = require('express-http-proxy')
const app = express()
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const helmet = require('helmet');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())

const organizacaoServiceProxy = httpProxy('https://organizacoes-api.herokuapp.com/');
const equipeServiceProxy = httpProxy('https://equipes-api.herokuapp.com/');

const sistema = (request, response, next) => {
    response.status(200).json("Seja bem-vindo ao sistema")
}

const login = (request, response, next) => {
    const { nome, senha } = request.body
    var result = ''
    pool.query('SELECT COUNT(*) FROM usuario where nome = $1 AND senha = $2', [nome, senha], (error, results) => {
        if (error) {
            throw error
        }
        const text = JSON.stringify(results)
        if (!(text.includes('"count":"0"'))) {
            console.log(result)

            const id = 1;
            const token = jwt.sign({ id }, process.env.SECRET, {
                expiresIn: 300 //expira em 5 minutos
            })
            return response.json({ auth: true, token: token })
        }
        return response.status(500).json({message : 'Login inválido'})
    })
}

function verificaJWT(request, response, next) {
    const token = request.headers['x-access-token'];
    if (!token) return response.status(401).json({ auth: false, message: 'Nenhum token válido' });
    jwt.verify(token, process.env.SECRET, function (err, decoded) {
        if (err) return response.status(500).json({ auth: false, message: 'Erro ao autenticar o token' })
        // se o token for válido
        request.userId = decoded.id;
        next();
    });
}

app
    .route("/login")
    .post(login)

// Proxy request
// rota para organizacao e todos os métodos

app.all('/organizacao', verificaJWT, (req, res, next) => {
    organizacaoServiceProxy(req, res, next);
})
// rota para organizacao e todos os métodos com um parâmetro ID
app.all('/organizacao/:id', verificaJWT, (req, res, next) => {
    organizacaoServiceProxy(req, res, next);
})
// rota para equipe e todos os métodos
app.all('/equipe', verificaJWT, (req, res, next) => {
    equipeServiceProxy(req, res, next);
})
// rota para equipe e todos os métodos com um parâmetro ID
app.all('/equipe/:id', verificaJWT, (req, res, next) => {
    equipeServiceProxy(req, res, next);
})

app.use(logger('dev'));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

var server = http.createServer(app);
server.listen(process.env.PORT || 3000, () => {
    console.log(`Servidor rodando na porta 3000`)
})