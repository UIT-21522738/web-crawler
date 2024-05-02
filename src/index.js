import path from 'path'
import express from 'express'
import cors from 'cors'
import { engine } from 'express-handlebars'
import morgan from 'morgan'
const app = express()
import {SendoCrawl} from './controller/sendoCrawler.js'
import {TikiCrawl} from './controller/tikiCrawler.js'
import { fileURLToPath } from 'url'

app.use(cors());
const port = 3000

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

//middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// HTTP logger
app.use(morgan('combined'))

// Template Engine
app.engine(
    'hbs',
    engine({
      extname: '.hbs',
    }),
);



app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resources/view'));

// /
app.get('/', (req, res) => {
    res.render('home');
})

app.post('/sendo', async (req, res) => {
    console.log(req.body.link)
    await SendoCrawl(req.body.link, res);
})

app.post('/tiki', async (req, res) => {
  console.log(req.body.link)
  await TikiCrawl(req.body.link, res);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});