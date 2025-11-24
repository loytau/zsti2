const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const SECRET_KEY = "supersecretkey";

app.use(cors());
app.use(bodyParser.json());

const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT,
    lastName TEXT,
    email TEXT UNIQUE,
    password TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    invoiceData TEXT,
    pdf_base64 TEXT,
    createdAt TEXT
  )`);
});

// Rejestracja
app.post('/api/register', async (req, res) => {
  const { firstName,lastName,email,password } = req.body;
  if(!email || !password) return res.status(400).json({ message:"Email i hasło wymagane" });

  const hashedPassword = await bcrypt.hash(password,10);
  db.run(`INSERT INTO users (firstName,lastName,email,password) VALUES (?,?,?,?)`,
    [firstName,lastName,email,hashedPassword],
    function(err){
      if(err) return res.status(400).json({ message:"Email już istnieje" });
      res.json({ message:"Użytkownik utworzony", userId:this.lastID });
    });
});

// Logowanie
app.post('/api/login', (req,res) => {
  const { email,password } = req.body;
  db.get(`SELECT * FROM users WHERE email=?`, [email], async (err,user)=>{
    if(err) return res.status(500).json({ message: err });
    if(!user) return res.status(400).json({ message:"Nieprawidłowy email" });

    const match = await bcrypt.compare(password, user.password);
    if(!match) return res.status(400).json({ message:"Nieprawidłowe hasło" });

    const token = jwt.sign({ userId:user.id }, SECRET_KEY, { expiresIn:'12h' });
    res.json({ token, userId:user.id, firstName:user.firstName });
  });
});

// Middleware JWT
function authenticateToken(req,res,next){
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if(!token) return res.sendStatus(401);
  jwt.verify(token, SECRET_KEY, (err,user)=>{
    if(err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Zapis faktury
app.post('/api/invoice', authenticateToken, (req,res)=>{
  const { invoice, pdf_base64 } = req.body;
  db.run(`INSERT INTO invoices (userId,invoiceData,pdf_base64,createdAt) VALUES (?,?,?,?)`,
    [req.user.userId, JSON.stringify(invoice), pdf_base64, new Date().toISOString()],
    function(err){
      if(err) return res.status(500).json({ message:err });
      res.json({ message:"Faktura zapisana", invoiceId:this.lastID });
    });
});

// Historia faktur
app.get('/api/invoice/history', authenticateToken, (req,res)=>{
  db.all(`SELECT * FROM invoices WHERE userId=? ORDER BY createdAt DESC`, [req.user.userId], (err,rows)=>{
    if(err) return res.status(500).json({ message:err });
    const invoices = rows.map(r=>({
      id: r.id,
      invoice: JSON.parse(r.invoiceData),
      pdf_base64: r.pdf_base64,
      createdAt: r.createdAt
    }));
    res.json(invoices);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Backend działa na porcie ${PORT}`));
